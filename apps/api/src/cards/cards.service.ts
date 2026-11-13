import {
  ConflictException, Inject, Injectable, NotFoundException, PayloadTooLargeException, UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Pool } from 'pg';
import sharp from 'sharp';
import { CARD_RENDER_MAX_BYTES, type CardRenderInputs } from '@fact-lens/contracts';
import { AuditService } from '../audit/audit.service';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { sniffImage } from '../media/image';
import { OBJECT_STORAGE, type ObjectStorage } from '../media/storage';

/** Pixels the renderer may decode. Same cap as uploads. */
const MAX_PIXELS = 40_000_000;

interface StoredVariant { name: string; key: string; width: number; height: number; mimeType: string; byteSize: number }

interface CardRow {
  media_asset_id: string;
  out_state: string;
  out_key: string;
  template_width: number;
  template_height: number;
  aspect_ratio: string;
  template_status: string;
  spec: Record<string, unknown>;
  crop: CardRenderInputs['crop'];
  text_inputs: { headline?: string; byline?: string };
  locale: string;
  src_state: string;
  src_variants: StoredVariant[];
  permitted_channels: string[];
  rights_expires_at: Date | null;
}

const CARD_SQL = `
  SELECT g.media_asset_id, out.processing_state AS out_state, out.object_key AS out_key,
         t.width AS template_width, t.height AS template_height, t.aspect_ratio, t.status AS template_status, t.spec,
         g.crop, g.text_inputs, g.locale,
         src.processing_state AS src_state, src.variants AS src_variants,
         src.permitted_channels, src.rights_expires_at
    FROM generated_card g
    JOIN card_template t ON t.id = g.template_id
    JOIN media_asset src ON src.id = g.source_media_asset_id
    JOIN media_asset out ON out.id = g.media_asset_id
   WHERE g.id = $1`;

/**
 * Renders branded cards for the worker (docs/10). The worker reads what it needs and writes the
 * result back through /internal only; it never touches storage or the cards tables directly.
 */
@Injectable()
export class CardsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** Everything the worker needs to composite one card. Refuses, and marks the card failed, when the source cannot be used. */
  async inputsFor(cardId: string, requestId: string): Promise<CardRenderInputs> {
    const row = await this.load(cardId);
    if (row.out_state === 'ready') throw new ConflictException({ message: 'This card is already rendered', reason: 'already_rendered' });

    const refusal = sourceRefusal(row, new Date());
    if (refusal) {
      await this.markFailed(cardId, refusal, requestId);
      throw new UnprocessableEntityException({ message: refusal, reason: 'source_not_usable' });
    }
    const headline = row.text_inputs.headline;
    if (!headline) throw new UnprocessableEntityException({ message: 'The card has no headline', reason: 'no_headline' });

    const variant = row.src_variants.find((v) => v.name === 'card');
    const object = variant ? await this.storage.get(variant.key) : null;
    if (!object) {
      await this.markFailed(cardId, 'The source image has no stored card derivative', requestId);
      throw new UnprocessableEntityException({ message: 'The source image has no stored card derivative', reason: 'source_missing' });
    }

    return {
      template: {
        aspectRatio: row.aspect_ratio as CardRenderInputs['template']['aspectRatio'],
        width: row.template_width,
        height: row.template_height,
        status: row.template_status as CardRenderInputs['template']['status'],
        spec: row.spec,
      },
      source: { contentType: 'image/webp', base64: object.body.toString('base64') },
      crop: row.crop,
      locale: row.locale,
      headline,
      byline: row.text_inputs.byline ?? null,
    };
  }

  /**
   * Stores a rendered card. The worker sends WebP bytes; they are decoded again, metadata is dropped,
   * and the size must match the template. A second call for a ready card changes nothing.
   */
  async storeRender(cardId: string, body: Buffer, requestId: string): Promise<{ created: boolean }> {
    if (body.length > CARD_RENDER_MAX_BYTES) throw new PayloadTooLargeException('The rendered card is too large');
    if (sniffImage(body) !== 'webp') throw new UnsupportedMediaTypeException('A rendered card must be WebP');

    const row = await this.load(cardId);
    if (row.out_state === 'ready') return { created: false };

    let rendered: { data: Buffer; info: sharp.OutputInfo };
    try {
      const data = await sharp(body, { limitInputPixels: MAX_PIXELS, failOn: 'error', animated: false }).webp().toBuffer({ resolveWithObject: true }).then((r) => ({ data: r.data, info: r.info }));
      rendered = data;
    } catch {
      throw new UnprocessableEntityException({ message: 'The rendered card could not be decoded', reason: 'render_rejected' });
    }
    if (rendered.info.width !== row.template_width || rendered.info.height !== row.template_height) {
      throw new UnprocessableEntityException({ message: 'The rendered card does not match the template size', reason: 'render_size' });
    }

    const variants: StoredVariant[] = [{
      name: 'card', key: row.out_key, width: rendered.info.width, height: rendered.info.height, mimeType: 'image/webp', byteSize: rendered.data.length,
    }];
    await this.storage.put(row.out_key, rendered.data, 'image/webp');

    return withTransaction(this.pool, async (db) => {
      const res = await db.query<{ id: string }>(
        `UPDATE media_asset
            SET mime_type = 'image/webp', byte_size = $2, width = $3, height = $4, sha256 = $5, variants = $6, processing_state = 'ready'
          WHERE id = $1 AND processing_state <> 'ready' RETURNING id`,
        [row.media_asset_id, rendered.data.length, rendered.info.width, rendered.info.height,
          sha256Of(rendered.data), JSON.stringify(variants)],
      );
      if (!res.rows[0]) return { created: false };
      await this.audit.record({
        actorType: 'system', actorId: 'card-renderer', action: 'card.render', objectType: 'media_asset', objectId: row.media_asset_id,
        previousState: 'pending', newState: 'ready', requestId, metadata: { generatedCardId: cardId, bytes: rendered.data.length },
      }, db);
      return { created: true };
    });
  }

  private async load(cardId: string): Promise<CardRow> {
    const { rows } = await this.pool.query<CardRow>(CARD_SQL, [cardId]);
    if (!rows[0]) throw new NotFoundException('Card not found');
    return rows[0];
  }

  private async markFailed(cardId: string, reason: string, requestId: string): Promise<void> {
    await withTransaction(this.pool, async (db) => {
      const res = await db.query<{ id: string }>(
        `UPDATE media_asset SET processing_state = 'failed'
          WHERE id = (SELECT media_asset_id FROM generated_card WHERE id = $1) AND processing_state <> 'ready' RETURNING id`,
        [cardId],
      );
      if (!res.rows[0]) return;
      await this.audit.record({
        actorType: 'system', actorId: 'card-renderer', action: 'card.render_failed', objectType: 'media_asset', objectId: res.rows[0].id,
        previousState: 'pending', newState: 'failed', reason, requestId, metadata: { generatedCardId: cardId },
      }, db);
    });
  }
}

/** Why the source photo may not be used for a card, or null when it may. The same rules apply on every render. */
export function sourceRefusal(row: Pick<CardRow, 'src_state' | 'permitted_channels' | 'rights_expires_at'>, now: Date): string | null {
  if (row.src_state !== 'ready') return 'The source image is not ready';
  if (!row.permitted_channels.includes('social')) return 'The rights of the source image do not permit social use';
  if (row.rights_expires_at && row.rights_expires_at.getTime() <= now.getTime()) return 'The rights of the source image have expired';
  return null;
}

const sha256Of = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
