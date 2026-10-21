import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { canonicalizeUrl, type AttachedSource, type Source, type SourceCreate, type SourceValidation, type StorySourceAttach } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { AuthorizationService } from '../auth/authorization.service';
import type { Actor } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';

interface Row {
  id: string; kind: Source['kind']; title: string; publisher: string | null; url: string | null; canonical_url: string | null;
  archive_url: string | null; published_at: Date | null; retrieved_at: Date | null; ingest_channel: Source['ingestChannel'];
  validation_status: Source['validationStatus'];
}
const toSource = (r: Row): Source => ({
  id: r.id, kind: r.kind, title: r.title, publisher: r.publisher, url: r.url, canonicalUrl: r.canonical_url, archiveUrl: r.archive_url,
  publishedAt: r.published_at?.toISOString() ?? null, retrievedAt: r.retrieved_at?.toISOString() ?? null,
  ingestChannel: r.ingest_channel, validationStatus: r.validation_status,
});

/**
 * Cited sources. Every source is untrusted input: it stays `unvalidated` until an editor or
 * fact-checker judges it, and a rejected source cannot be attached. Nothing here fetches a URL.
 */
@Injectable()
export class SourcesService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AuthorizationService) private readonly authz: AuthorizationService,
  ) {}

  async get(id: string): Promise<Source> {
    const { rows } = await this.pool.query<Row>('SELECT * FROM source WHERE id = $1', [id]);
    if (!rows[0]) throw new NotFoundException('Source not found');
    return toSource(rows[0]);
  }

  /** Creates a source, or returns the existing one with the same canonical URL. */
  async create(input: SourceCreate, actor: Actor): Promise<{ source: Source; created: boolean }> {
    const canonical = input.canonicalUrl ?? (input.url ? safeCanonical(input.url) : null);
    return withTransaction(this.pool, async (db) => {
      if (canonical) {
        const dup = await db.query<Row>('SELECT * FROM source WHERE canonical_url = $1', [canonical]);
        if (dup.rows[0]) return { source: toSource(dup.rows[0]), created: false };
      }
      let row: Row;
      try {
        const res = await db.query<Row>(
          `INSERT INTO source (kind, title, publisher, url, canonical_url, archive_url, published_at, retrieved_at, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [input.kind, input.title, input.publisher ?? null, input.url ?? null, canonical, input.archiveUrl ?? null,
           input.publishedAt ?? null, input.retrievedAt ?? null, input.notes ?? null, actor.principal.subject],
        );
        row = res.rows[0]!;
      } catch (e) {
        // A concurrent create of the same canonical URL: return the winner.
        if (typeof e === 'object' && e && 'code' in e && e.code === '23505' && canonical) {
          const again = await this.pool.query<Row>('SELECT * FROM source WHERE canonical_url = $1', [canonical]);
          if (again.rows[0]) return { source: toSource(again.rows[0]), created: false };
        }
        throw e;
      }
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'source.create', objectType: 'source', objectId: row.id,
          requestId: actor.requestId, metadata: { kind: input.kind } },
        db,
      );
      return { source: toSource(row), created: true };
    });
  }

  async validate(id: string, input: SourceValidation, actor: Actor): Promise<Source> {
    await this.authz.requireAny(actor.principal, ['story.review', 'story.fact_check'], { requestId: actor.requestId, objectType: 'source', objectId: id });
    return withTransaction(this.pool, async (db) => {
      const cur = await db.query<Row>('SELECT * FROM source WHERE id = $1 FOR UPDATE', [id]);
      if (!cur.rows[0]) throw new NotFoundException('Source not found');
      if (cur.rows[0].validation_status === input.status) return toSource(cur.rows[0]);
      const res = await db.query<Row>('UPDATE source SET validation_status = $2 WHERE id = $1 RETURNING *', [id, input.status]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'source.validate', objectType: 'source', objectId: id,
          previousState: cur.rows[0].validation_status, newState: input.status, reason: input.reason, requestId: actor.requestId },
        db,
      );
      return toSource(res.rows[0]!);
    });
  }

  async forStory(storyId: string): Promise<AttachedSource[]> {
    await this.requireStory(this.pool, storyId);
    const { rows } = await this.pool.query<Row & { relation: AttachedSource['relation']; use_type: AttachedSource['useType']; link_notes: string | null }>(
      `SELECT s.*, ss.relation, ss.use_type, ss.notes AS link_notes FROM story_source ss JOIN source s ON s.id = ss.source_id
        WHERE ss.story_id = $1 ORDER BY (ss.relation = 'primary') DESC, s.title`,
      [storyId],
    );
    return rows.map((r) => ({ ...toSource(r), relation: r.relation, useType: r.use_type, notes: r.link_notes }));
  }

  async attach(storyId: string, sourceId: string, input: StorySourceAttach, actor: Actor): Promise<AttachedSource[]> {
    await withTransaction(this.pool, async (db) => {
      const story = await this.requireStory(db, storyId);
      if (story.status === 'ARCHIVED') throw new ConflictException({ message: 'Archived stories cannot be edited', reason: 'story_archived' });
      const src = await db.query<Row>('SELECT * FROM source WHERE id = $1', [sourceId]);
      if (!src.rows[0]) throw new NotFoundException('Source not found');
      if (src.rows[0].validation_status === 'rejected') {
        throw new ConflictException({ message: 'A rejected source cannot be attached', reason: 'source_rejected' });
      }
      const res = await db.query(
        `INSERT INTO story_source (story_id, source_id, relation, use_type, notes) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (story_id, source_id) DO UPDATE SET relation = EXCLUDED.relation, use_type = EXCLUDED.use_type, notes = EXCLUDED.notes
         RETURNING (xmax = 0) AS inserted`,
        [storyId, sourceId, input.relation, input.useType, input.notes ?? null],
      );
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: res.rows[0].inserted ? 'story.source_attach' : 'story.source_update',
          objectType: 'story', objectId: storyId, storyId, requestId: actor.requestId,
          metadata: { sourceId, relation: input.relation, useType: input.useType } },
        db,
      );
      await db.query('UPDATE story SET updated_at = now() WHERE id = $1', [storyId]);
    });
    return this.forStory(storyId);
  }

  async detach(storyId: string, sourceId: string, actor: Actor): Promise<AttachedSource[]> {
    await withTransaction(this.pool, async (db) => {
      const story = await this.requireStory(db, storyId);
      if (story.status === 'ARCHIVED') throw new ConflictException({ message: 'Archived stories cannot be edited', reason: 'story_archived' });
      const res = await db.query('DELETE FROM story_source WHERE story_id = $1 AND source_id = $2', [storyId, sourceId]);
      if (res.rowCount === 0) throw new NotFoundException('That source is not attached to this story');
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'story.source_detach', objectType: 'story', objectId: storyId,
          storyId, requestId: actor.requestId, metadata: { sourceId } },
        db,
      );
      await db.query('UPDATE story SET updated_at = now() WHERE id = $1', [storyId]);
    });
    return this.forStory(storyId);
  }

  private async requireStory(db: Pool | import('pg').PoolClient, id: string) {
    const { rows } = await db.query<{ status: string }>('SELECT status FROM story WHERE id = $1', [id]);
    if (!rows[0]) throw new NotFoundException('Story not found');
    return rows[0];
  }
}

function safeCanonical(url: string): string {
  try {
    return canonicalizeUrl(url);
  } catch {
    throw new BadRequestException('Invalid URL');
  }
}
