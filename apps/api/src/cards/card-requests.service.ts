import { ConflictException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { z } from 'zod';
import { cardAspectRatios, type CardRequest, type GeneratedCardListItem, type Principal } from '@fact-lens/contracts';
import { AuditService } from '../audit/audit.service';
import type { Actor } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { sourceRefusal } from './cards.service';

/** Body of POST /card-templates. A new template is a draft; publishing it makes it the active version of its key. */
export const cardTemplateCreateSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9][a-z0-9-]{1,60}$/, 'Use lower-case letters, digits and hyphens'),
    name: z.string().trim().min(1).max(120),
    aspectRatio: z.enum(cardAspectRatios),
    width: z.number().int().min(100).max(4000),
    height: z.number().int().min(100).max(4000),
    spec: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();
export type CardTemplateCreate = z.infer<typeof cardTemplateCreateSchema>;

interface TemplateRow {
  id: string; key: string; version: number; name: string; aspect_ratio: string; width: number; height: number; status: string;
}
export interface CardTemplateView {
  id: string; key: string; version: number; name: string; aspectRatio: string; width: number; height: number; status: string;
}
const toTemplate = (r: TemplateRow): CardTemplateView => ({
  id: r.id, key: r.key, version: r.version, name: r.name, aspectRatio: r.aspect_ratio, width: r.width, height: r.height, status: r.status,
});

/** Requests for branded cards (docs/10). The worker renders them; this service only records and refuses. */
@Injectable()
export class CardRequestsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** Records a card request: a pending output asset, the card, and the outbox event that starts the render. */
  async request(newsId: string, input: CardRequest, actor: Actor): Promise<GeneratedCardListItem> {
    const enabled = await this.pool.query<{ enabled: boolean }>(`SELECT enabled FROM feature_flag WHERE key = 'cards.generation'`);
    if (!enabled.rows[0]?.enabled) throw new ConflictException({ message: 'Card generation is turned off', reason: 'cards_disabled' });

    const news = await this.pool.query<{ id: string }>('SELECT id FROM news WHERE id = $1', [newsId]);
    if (!news.rows[0]) throw new NotFoundException('News not found');

    const revision = (await this.pool.query<{ id: string }>(
      'SELECT id FROM news_revision WHERE news_id = $1 ORDER BY revision_no DESC LIMIT 1', [newsId])).rows[0];
    if (!revision) throw new UnprocessableEntityException({ message: 'The news item has no revision', reason: 'no_revision' });

    const translation = (await this.pool.query<{ title: string | null }>(
      'SELECT title FROM news_translation WHERE revision_id = $1 AND locale = $2', [revision.id, input.locale])).rows[0];
    if (!translation?.title) {
      throw new UnprocessableEntityException({ message: `Write the ${input.locale} title first`, reason: 'no_translation' });
    }

    const template = (await this.pool.query<{ status: string }>('SELECT status FROM card_template WHERE id = $1', [input.templateId])).rows[0];
    if (!template) throw new NotFoundException('Template not found');
    if (template.status !== 'active') throw new UnprocessableEntityException({ message: 'Only an active template can be used', reason: 'template_not_active' });

    const source = (await this.pool.query<{ processing_state: string; permitted_channels: string[]; rights_expires_at: Date | null }>(
      'SELECT processing_state, permitted_channels, rights_expires_at FROM media_asset WHERE id = $1', [input.sourceMediaAssetId])).rows[0];
    if (!source) throw new NotFoundException('Source photo not found');
    const refusal = sourceRefusal({ src_state: source.processing_state, permitted_channels: source.permitted_channels, rights_expires_at: source.rights_expires_at }, new Date());
    if (refusal) throw new UnprocessableEntityException({ message: refusal, reason: 'source_not_usable' });

    const cardId = await withTransaction(this.pool, async (db) => {
      const output = await db.query<{ id: string }>(
        `INSERT INTO media_asset (object_key, mime_type, byte_size, sha256, processing_state, uploaded_by)
         VALUES ($1, 'image/webp', 0, $2, 'pending', $3) RETURNING id`,
        [`derivatives/cards/${randomUUID()}.webp`, `pending-${randomUUID()}`, actor.principal.subject],
      );
      const card = await db.query<{ id: string }>(
        `INSERT INTO generated_card (media_asset_id, source_media_asset_id, template_id, news_id, revision_id, locale, crop, text_inputs, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [output.rows[0]!.id, input.sourceMediaAssetId, input.templateId, newsId, revision.id, input.locale, JSON.stringify(input.crop),
          JSON.stringify({ headline: input.headline, ...(input.byline ? { byline: input.byline } : {}) }), actor.principal.subject],
      );
      const generatedCardId = card.rows[0]!.id;
      await db.query(
        `INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type, payload) VALUES ('card', $1, 'card.requested', $2)`,
        [generatedCardId, JSON.stringify({ generatedCardId })],
      );
      await this.audit.record({
        actorType: 'human', actorId: actor.principal.subject, action: 'card.request', objectType: 'news', objectId: newsId,
        newState: 'pending', requestId: actor.requestId, metadata: { generatedCardId, templateId: input.templateId, locale: input.locale },
      }, db);
      return generatedCardId;
    });

    const [item] = await this.listRows('WHERE g.id = $1', [cardId]);
    return item!;
  }

  /** Cards made for one news item, newest first, with the render status of each output. */
  async listForNews(newsId: string): Promise<GeneratedCardListItem[]> {
    return this.listRows('WHERE g.news_id = $1', [newsId]);
  }

  /** Templates. Editors see the active ones; whoever manages templates sees every version. */
  async listTemplates(principal: Principal): Promise<CardTemplateView[]> {
    const canManage = principal.capabilities.includes('config.manage');
    const { rows } = await this.pool.query<TemplateRow>(
      canManage
        ? 'SELECT * FROM card_template ORDER BY key, version DESC'
        : `SELECT * FROM card_template WHERE status = 'active' ORDER BY key, version DESC`,
    );
    return rows.map(toTemplate);
  }

  /** A new draft version of a key. Drafts are edited by replacing them; an active version is never changed in place. */
  async createTemplate(input: CardTemplateCreate, actor: Actor): Promise<CardTemplateView> {
    return withTransaction(this.pool, async (db) => {
      const next = (await db.query<{ v: number }>('SELECT COALESCE(MAX(version), 0) + 1 AS v FROM card_template WHERE key = $1', [input.key])).rows[0]!.v;
      const { rows } = await db.query<TemplateRow>(
        `INSERT INTO card_template (key, version, name, aspect_ratio, width, height, spec, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8) RETURNING *`,
        [input.key, next, input.name, input.aspectRatio, input.width, input.height, JSON.stringify(input.spec), actor.principal.subject],
      );
      await this.audit.record({
        actorType: 'human', actorId: actor.principal.subject, action: 'card_template.create', objectType: 'card_template', objectId: rows[0]!.id,
        newState: 'draft', requestId: actor.requestId, metadata: { key: input.key, version: next },
      }, db);
      return toTemplate(rows[0]!);
    });
  }

  /** Makes a draft the active version of its key; the previous active version is retired in the same transaction. */
  async publishTemplate(id: string, actor: Actor): Promise<CardTemplateView> {
    return withTransaction(this.pool, async (db) => {
      const current = (await db.query<TemplateRow>('SELECT * FROM card_template WHERE id = $1 FOR UPDATE', [id])).rows[0];
      if (!current) throw new NotFoundException('Template not found');
      if (current.status !== 'draft') throw new ConflictException({ message: 'Only a draft can be published', reason: 'not_draft' });
      await db.query(`UPDATE card_template SET status = 'retired' WHERE key = $1 AND status = 'active' AND id <> $2`, [current.key, id]);
      const { rows } = await db.query<TemplateRow>(`UPDATE card_template SET status = 'active' WHERE id = $1 RETURNING *`, [id]);
      await this.audit.record({
        actorType: 'human', actorId: actor.principal.subject, action: 'card_template.publish', objectType: 'card_template', objectId: id,
        previousState: 'draft', newState: 'active', requestId: actor.requestId, metadata: { key: current.key, version: current.version },
      }, db);
      return toTemplate(rows[0]!);
    });
  }

  async retireTemplate(id: string, actor: Actor): Promise<CardTemplateView> {
    return withTransaction(this.pool, async (db) => {
      const { rows } = await db.query<TemplateRow>(`UPDATE card_template SET status = 'retired' WHERE id = $1 AND status = 'active' RETURNING *`, [id]);
      if (!rows[0]) throw new ConflictException({ message: 'Only an active template can be retired', reason: 'not_active' });
      await this.audit.record({
        actorType: 'human', actorId: actor.principal.subject, action: 'card_template.retire', objectType: 'card_template', objectId: id,
        previousState: 'active', newState: 'retired', requestId: actor.requestId, metadata: { key: rows[0].key, version: rows[0].version },
      }, db);
      return toTemplate(rows[0]);
    });
  }

  private async listRows(where: string, params: unknown[]): Promise<GeneratedCardListItem[]> {
    const { rows } = await this.pool.query<{
      id: string; media_asset_id: string; source_media_asset_id: string; template_id: string; news_id: string; revision_id: string;
      locale: string | null; created_at: Date; render_state: string; failure_reason: string | null;
    }>(
      `SELECT g.id, g.media_asset_id, g.source_media_asset_id, g.template_id, g.news_id, g.revision_id, g.locale, g.created_at,
              out.processing_state AS render_state,
              (SELECT a.reason FROM audit_event a WHERE a.action = 'card.render_failed' AND a.object_id = g.media_asset_id::text
                ORDER BY a.occurred_at DESC LIMIT 1) AS failure_reason
         FROM generated_card g JOIN media_asset out ON out.id = g.media_asset_id
         ${where} ORDER BY g.created_at DESC`,
      params,
    );
    return rows.map((r) => ({
      id: r.id, mediaAssetId: r.media_asset_id, sourceMediaAssetId: r.source_media_asset_id, templateId: r.template_id,
      newsId: r.news_id, revisionId: r.revision_id, locale: r.locale, createdAt: r.created_at.toISOString(),
      renderStatus: r.render_state as GeneratedCardListItem['renderStatus'], failureReason: r.failure_reason,
    })) as GeneratedCardListItem[];
  }
}
