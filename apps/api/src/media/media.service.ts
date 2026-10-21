import { createHash, randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import {
  BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import {
  mediaVariantNames, publicMediaVariants, type MediaDetail, type MediaList, type MediaListQuery, type MediaRightsUpdate,
  type MediaVariantName,
} from '@fact-lens/contracts';
import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import type { Actor } from '../common/http';
import { isPgError } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { EXT, ImageRejected, processImage, sniffImage } from './image';
import { OBJECT_STORAGE, type ObjectStorage } from './storage';

export const MEDIA_OPTIONS = Symbol('MEDIA_OPTIONS');
export interface MediaOptions {
  maxBytes: number;
}

interface StoredVariant {
  name: MediaVariantName;
  key: string;
  width: number;
  height: number;
  mimeType: string;
  byteSize: number;
}

interface Row {
  id: string; original_filename: string | null; mime_type: string; byte_size: string | number; width: number | null; height: number | null;
  processing_state: MediaDetail['processingState']; alt_text: string | null; license: string | null; attribution: string | null;
  rights_owner: string | null; rights_notes: string | null; source_url: string | null; rights_expires_at: Date | null;
  permitted_channels: MediaDetail['permittedChannels']; variants: StoredVariant[]; uploaded_by: string | null; created_at: Date;
  usage_count: number; cursor_at?: string; sha256?: string;
}

const SELECT = `SELECT m.*, (SELECT count(DISTINCT sr.story_id) FROM revision_media rm JOIN story_revision sr ON sr.id = rm.revision_id
                  WHERE rm.media_asset_id = m.id)::int AS usage_count,
                to_char(m.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_at
           FROM media_asset m`;

export const toDetail = (r: Row): MediaDetail => ({
  id: r.id, originalFilename: r.original_filename, mimeType: r.mime_type, byteSize: Number(r.byte_size), width: r.width, height: r.height,
  processingState: r.processing_state, altText: r.alt_text, license: r.license, attribution: r.attribution, rightsOwner: r.rights_owner,
  rightsNotes: r.rights_notes, sourceUrl: r.source_url, rightsExpiresAt: r.rights_expires_at?.toISOString() ?? null,
  permittedChannels: r.permitted_channels, uploadedBy: r.uploaded_by, createdAt: r.created_at.toISOString(), usageCount: r.usage_count,
  variants: r.variants.map(({ name, width, height, mimeType, byteSize }) => ({ name, width, height, mimeType, byteSize })),
});

const RIGHTS_COLUMNS: Record<keyof MediaRightsUpdate, string> = {
  altText: 'alt_text', license: 'license', attribution: 'attribution', rightsOwner: 'rights_owner', rightsNotes: 'rights_notes',
  sourceUrl: 'source_url', rightsExpiresAt: 'rights_expires_at', permittedChannels: 'permitted_channels',
};

/** A filename is a label for people, never a path: keep the last part, drop control characters, cap the length. */
export function cleanFilename(raw: string | undefined): string {
  const name = basename((raw ?? '').replaceAll('\\', '/')).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 200);
  return name || 'upload';
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(MEDIA_OPTIONS) private readonly options: MediaOptions,
  ) {}

  async upload(input: unknown, filename: string | undefined, actor: Actor): Promise<{ asset: MediaDetail; created: boolean }> {
    if (!Buffer.isBuffer(input) || input.length === 0) {
      throw new UnsupportedMediaTypeException('Send the image itself as the request body, with an image content type');
    }
    if (input.length > this.options.maxBytes) {
      throw new HttpException(`The image is larger than ${Math.floor(this.options.maxBytes / 1024 / 1024)} MB`, HttpStatus.PAYLOAD_TOO_LARGE);
    }
    const kind = sniffImage(input);
    if (!kind) throw new UnsupportedMediaTypeException('Only JPEG, PNG and WebP images can be uploaded');

    const sha256 = createHash('sha256').update(input).digest('hex');
    const existing = await this.pool.query<Row>(`${SELECT} WHERE m.sha256 = $1 ORDER BY m.created_at LIMIT 1`, [sha256]);
    if (existing.rows[0]) return { asset: toDetail(existing.rows[0]), created: false };

    let processed;
    try {
      processed = await processImage(input, kind);
    } catch (err) {
      if (err instanceof ImageRejected) throw new HttpException(err.message, HttpStatus.UNPROCESSABLE_ENTITY);
      throw err;
    }

    const id = randomUUID();
    const files: StoredVariant[] = [
      { name: 'original', key: `originals/${id}.${EXT[kind]}`, width: processed.original.width, height: processed.original.height, mimeType: processed.original.mimeType, byteSize: processed.original.body.length },
      ...processed.variants.map((v) => ({ name: v.name, key: `derivatives/${id}/${v.name}.webp`, width: v.width, height: v.height, mimeType: v.mimeType, byteSize: v.body.length })),
    ];
    const bodies = [processed.original.body, ...processed.variants.map((v) => v.body)];
    await Promise.all(files.map((f, i) => this.storage.put(f.key, bodies[i]!, f.mimeType)));

    try {
      const detail = await withTransaction(this.pool, async (db) => {
        await db.query(
          `INSERT INTO media_asset (id, object_key, mime_type, byte_size, width, height, sha256, variants, processing_state, original_filename, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ready', $9, $10)`,
          [id, files[0]!.key, processed.original.mimeType, processed.original.body.length, processed.width, processed.height, sha256,
           JSON.stringify(files), cleanFilename(filename), actor.principal.subject],
        );
        await this.audit.record(
          { actorType: 'human', actorId: actor.principal.subject, action: 'media.upload', objectType: 'media_asset', objectId: id,
            requestId: actor.requestId, metadata: { bytes: input.length, type: processed.original.mimeType } },
          db,
        );
        const { rows } = await db.query<Row>(`${SELECT} WHERE m.id = $1`, [id]);
        return toDetail(rows[0]!);
      });
      return { asset: detail, created: true };
    } catch (err) {
      // Two uploads of the same file at once: the loser's row is refused, so remove its stored copies and return the winner.
      await Promise.allSettled(files.map((f) => this.storage.delete(f.key)));
      if (isPgError(err) && err.code === '23505') {
        const winner = await this.pool.query<Row>(`${SELECT} WHERE m.sha256 = $1 ORDER BY m.created_at LIMIT 1`, [sha256]);
        if (winner.rows[0]) return { asset: toDetail(winner.rows[0]), created: false };
      }
      throw err;
    }
  }

  async list(q: MediaListQuery): Promise<MediaList> {
    let cursorAt: string | null = null;
    let cursorId: string | null = null;
    if (q.cursor) {
      try {
        [cursorAt, cursorId] = JSON.parse(Buffer.from(q.cursor, 'base64url').toString()) as [string, string];
        if (typeof cursorAt !== 'string' || typeof cursorId !== 'string') throw new Error();
      } catch {
        throw new BadRequestException('Invalid cursor');
      }
    }
    const search = q.query ? `%${q.query.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const { rows } = await this.pool
      .query<Row>(
        `${SELECT}
          WHERE ($1::text IS NULL OR m.original_filename ILIKE $1 OR m.alt_text ILIKE $1 OR m.attribution ILIKE $1 OR m.rights_owner ILIKE $1)
            AND ($2::timestamptz IS NULL OR (m.created_at, m.id) < ($2::timestamptz, $3::uuid))
          ORDER BY m.created_at DESC, m.id DESC LIMIT $4`,
        [search, cursorAt, cursorId, q.limit + 1],
      )
      .catch((e) => {
        if (isPgError(e) && (e.code === '22007' || e.code === '22P02')) throw new BadRequestException('Invalid cursor');
        throw e;
      });
    const page = rows.slice(0, q.limit);
    const last = rows.length > q.limit ? page[page.length - 1] : undefined;
    return {
      items: page.map(toDetail),
      nextCursor: last ? Buffer.from(JSON.stringify([last.cursor_at, last.id])).toString('base64url') : null,
    };
  }

  async get(id: string): Promise<MediaDetail> {
    const { rows } = await this.pool.query<Row>(`${SELECT} WHERE m.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException('Media not found');
    return toDetail(rows[0]);
  }

  async updateRights(id: string, input: MediaRightsUpdate, actor: Actor): Promise<MediaDetail> {
    const entries = Object.entries(input) as Array<[keyof MediaRightsUpdate, unknown]>;
    const sets = entries.map(([key], i) => `${RIGHTS_COLUMNS[key]} = $${i + 2}`);
    const values = entries.map(([, v]) => v);
    return withTransaction(this.pool, async (db) => {
      const res = await db.query(`UPDATE media_asset SET ${sets.join(', ')} WHERE id = $1`, [id, ...values]);
      if (res.rowCount === 0) throw new NotFoundException('Media not found');
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'media.rights_update', objectType: 'media_asset', objectId: id,
          requestId: actor.requestId, metadata: { changed: entries.map(([k]) => k) } },
        db,
      );
      const { rows } = await db.query<Row>(`${SELECT} WHERE m.id = $1`, [id]);
      return toDetail(rows[0]!);
    });
  }

  /** Bytes for the newsroom. Any variant, including the original. */
  async file(id: string, variant: string): Promise<{ body: Buffer; contentType: string }> {
    if (!(mediaVariantNames as readonly string[]).includes(variant)) throw new BadRequestException('Unknown variant');
    const { rows } = await this.pool.query<{ variants: StoredVariant[] }>('SELECT variants FROM media_asset WHERE id = $1', [id]);
    return this.read(rows[0]?.variants, variant);
  }

  /**
   * Bytes for readers. Only a derivative of an image that a live story uses, whose rights still
   * allow the web. Anything else answers 404, whether it exists or not.
   */
  async publicFile(id: string, variant: string, liveStatuses: readonly string[]): Promise<{ body: Buffer; contentType: string }> {
    if (!(publicMediaVariants as readonly string[]).includes(variant)) throw new NotFoundException('Not found');
    const { rows } = await this.pool.query<{ variants: StoredVariant[] }>(
      `SELECT m.variants FROM media_asset m
        WHERE m.id = $1 AND m.processing_state = 'ready' AND 'web' = ANY (m.permitted_channels)
          AND (m.rights_expires_at IS NULL OR m.rights_expires_at > now())
          AND EXISTS (SELECT 1 FROM revision_media rm JOIN story s ON s.published_revision_id = rm.revision_id
                       WHERE rm.media_asset_id = m.id AND s.status = ANY ($2))`,
      [id, liveStatuses],
    );
    return this.read(rows[0]?.variants, variant);
  }

  async delete(id: string, actor: Actor): Promise<void> {
    const keys = await withTransaction(this.pool, async (db) => {
      const found = await db.query<{ variants: StoredVariant[] }>('SELECT variants FROM media_asset WHERE id = $1 FOR UPDATE', [id]);
      if (!found.rows[0]) throw new NotFoundException('Media not found');
      try {
        await db.query('DELETE FROM media_asset WHERE id = $1', [id]);
      } catch (err) {
        if (isPgError(err) && err.code === '23503') {
          throw new ConflictException({ message: 'This image is used by a story, an ad or a card. Remove it there first.', reason: 'in_use' });
        }
        throw err;
      }
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'media.delete', objectType: 'media_asset', objectId: id, requestId: actor.requestId },
        db,
      );
      return found.rows[0].variants.map((v) => v.key);
    });
    // The row is gone; a failed object delete leaves an orphan to sweep later, never a broken record.
    const results = await Promise.allSettled(keys.map((k) => this.storage.delete(k)));
    for (const r of results) if (r.status === 'rejected') this.logger.warn(`could not delete a stored object for ${id}: ${String(r.reason)}`);
  }

  private async read(variants: StoredVariant[] | undefined, name: string) {
    const entry = variants?.find((v) => v.name === name);
    if (!entry) throw new NotFoundException('Not found');
    const object = await this.storage.get(entry.key);
    if (!object) throw new NotFoundException('Not found');
    return { body: object.body, contentType: entry.mimeType };
  }
}
