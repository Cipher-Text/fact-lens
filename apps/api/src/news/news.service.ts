import { createHash, randomUUID } from 'node:crypto';
import {
  BadRequestException, ConflictException, HttpException, Inject, Injectable, NotFoundException, UnprocessableEntityException,
} from '@nestjs/common';
import {
  bodyMediaAssetIds, defaultWorkflowPolicy, parseConfigValue,
  type AvailableTransition, type CorrectionCreate, type Principal, type PublicNews, type RevisionCreate, type NewsCreate, type NewsDetail,
  type NewsList, type NewsListQuery, type NewsMeta, type NewsStatus, type TransitionRequest,
  type ScheduledPublishResult, type TimelineEntry, type TranslationSave, type WorkflowPolicy,
} from '@fact-lens/contracts';
import type { Pool, PoolClient } from 'pg';
import { AuditService } from '../audit/audit.service';
import { AuthorizationService } from '../auth/authorization.service';
import { isPgError, type Actor } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { publishIssues, reviewIssues, slugify, type RevisionSnapshot } from './validation';
import { capabilityFor, findTransition, LIVE_STATUSES, movesFrom } from './workflow';

type Db = Pool | PoolClient;

interface NewsRow {
  id: string; canonical_key: string; status: NewsStatus; category_id: string | null; desk_id: string | null;
  published_revision_id: string | null; published_at: Date | null; created_at: Date; updated_at: Date;
}
interface RevisionRow {
  id: string; news_id: string; revision_no: number; changed_by: string; created_at: Date; changed_at: Date; change_reason: string | null;
  submitted_at: Date | null; submitted_by: string | null; approved_at: Date | null; approved_by: string | null;
  is_correction: boolean; ai_assisted: boolean; content_hash: string | null;
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);
const toNews = (r: NewsRow) => ({
  id: r.id, canonicalKey: r.canonical_key, status: r.status, categoryId: r.category_id, deskId: r.desk_id,
  publishedRevisionId: r.published_revision_id, publishedAt: iso(r.published_at),
  createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString(),
});
const toRevision = (r: RevisionRow) => ({
  id: r.id, newsId: r.news_id, revisionNo: r.revision_no, changedBy: r.changed_by, createdAt: r.created_at.toISOString(), changedAt: r.changed_at.toISOString(),
  changeReason: r.change_reason, submittedAt: iso(r.submitted_at), approvedAt: iso(r.approved_at),
  isCorrection: r.is_correction, aiAssisted: r.ai_assisted,
});

const conflict = (reason: string, message: string) => new ConflictException({ message, reason });
const unprocessable = (message: string, issues: string[]) => new UnprocessableEntityException({ message, issues });
const fkMessage: Record<string, string> = {
  news_desk_id_fkey: 'Unknown desk', news_category_id_fkey: 'Unknown category',
  news_translation_locale_fkey: 'Unknown locale', news_contributor_contributor_id_fkey: 'Unknown contributor',
  revision_media_media_asset_id_fkey: 'Body references an unknown media asset', correction_notice_locale_fkey: 'Unknown locale',
};

/** Turns a foreign-key failure on user-supplied ids into a 400 instead of a 500. */
function asBadRequest(err: unknown): never {
  if (isPgError(err) && err.code === '23503') {
    throw new BadRequestException(fkMessage[err.constraint ?? ''] ?? 'Reference to something that does not exist');
  }
  throw err;
}

@Injectable()
export class NewsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AuthorizationService) private readonly authz: AuthorizationService,
    @Inject(TaxonomyService) private readonly taxonomy: TaxonomyService,
  ) {}

  // ---------------------------------------------------------------- queries

  async list(q: NewsListQuery): Promise<NewsList> {
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
    const { rows } = await this.pool
      .query<NewsRow & { titles: Record<string, string>; cursor_at: string }>(
        `SELECT s.*, to_char(s.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_at,
                COALESCE(t.titles, '{}'::jsonb) AS titles
           FROM news s
           LEFT JOIN LATERAL (
             SELECT jsonb_object_agg(st.locale, st.title) AS titles
               FROM news_translation st
              WHERE st.revision_id = (SELECT id FROM news_revision WHERE news_id = s.id ORDER BY revision_no DESC LIMIT 1)
           ) t ON true
          WHERE ($1::text IS NULL OR s.status = $1)
            AND ($2::uuid IS NULL OR s.desk_id = $2)
            AND ($3::timestamptz IS NULL OR (s.updated_at, s.id) < ($3::timestamptz, $4::uuid))
          ORDER BY s.updated_at DESC, s.id DESC
          LIMIT $5`,
        [q.status ?? null, q.deskId ?? null, cursorAt, cursorId, q.limit + 1],
      )
      .catch((e) => {
        if (isPgError(e) && e.code === '22007') throw new BadRequestException('Invalid cursor');
        throw e;
      });
    const page = rows.slice(0, q.limit);
    const last = rows.length > q.limit ? page[page.length - 1] : undefined;
    return {
      items: page.map((r) => ({ ...toNews(r), titles: r.titles })),
      nextCursor: last ? Buffer.from(JSON.stringify([last.cursor_at, last.id])).toString('base64url') : null,
    };
  }

  async detail(id: string, principal: Principal, db: Db = this.pool): Promise<NewsDetail> {
    const news = await this.loadNews(db, id);
    const revision = await this.latestRevision(db, id);
    const [translations, contributors, media, count, openComments, tags] = await Promise.all([
      db.query(
        `SELECT * FROM news_translation WHERE revision_id = $1 ORDER BY locale`, [revision.id]),
      db.query(
        `SELECT sc.role, sc.position, c.id, c.kind, c.display_name, c.bio
           FROM news_contributor sc JOIN contributor c ON c.id = sc.contributor_id
          WHERE sc.news_id = $1 ORDER BY sc.position, c.display_name`, [id]),
      db.query(
        `SELECT m.id, m.mime_type, m.byte_size, m.width, m.height, m.sha256, m.license, m.attribution,
                m.processing_state, rm.role
           FROM revision_media rm JOIN media_asset m ON m.id = rm.media_asset_id
          WHERE rm.revision_id = $1 ORDER BY rm.position`, [revision.id]),
      db.query<{ n: number }>('SELECT count(*)::int AS n FROM news_revision WHERE news_id = $1', [id]),
      db.query<{ n: number }>(`SELECT count(*)::int AS n FROM editorial_comment WHERE news_id = $1 AND status = 'open' AND parent_id IS NULL`, [id]),
      this.taxonomy.tagsOfNews(id, db),
    ]);
    return {
      news: toNews(news),
      revision: toRevision(revision),
      editable: revision.submitted_at === null,
      translations: translations.rows.map((t) => ({
        id: t.id, revisionId: t.revision_id, locale: t.locale, title: t.title, dek: t.dek, body: t.body, slug: t.slug,
        seoTitle: t.seo_title, seoDescription: t.seo_description, translationStatus: t.translation_status,
        version: t.version, updatedAt: t.updated_at.toISOString(),
      })),
      contributors: contributors.rows.map((c) => ({
        contributor: { id: c.id, kind: c.kind, displayName: c.display_name, bio: c.bio }, role: c.role, position: c.position,
      })),
      media: media.rows.map((m) => ({
        id: m.id, mimeType: m.mime_type, byteSize: Number(m.byte_size), width: m.width, height: m.height, sha256: m.sha256,
        license: m.license, attribution: m.attribution, processingState: m.processing_state, role: m.role,
      })),
      tags,
      revisionCount: count.rows[0]!.n,
      openCommentCount: openComments.rows[0]!.n,
      transitions: await this.availableTransitions(db, news, principal),
    };
  }

  private async availableTransitions(db: Db, news: NewsRow, principal: Principal): Promise<AvailableTransition[]> {
    const policy = await this.policyFor(db, news.desk_id);
    return movesFrom(news.status).flatMap((to) => {
      const move = findTransition(news.status, to)!;
      if (move.skipsFactCheck && policy.factCheckRequired) return [];
      const capability = capabilityFor(move, policy);
      return [{
        to, capability, permitted: principal.capabilities.includes(capability),
        reasonRequired: move.reasonRequired === true, needsSchedule: to === 'SCHEDULED',
      }];
    });
  }

  async revisions(id: string) {
    await this.loadNews(this.pool, id);
    const { rows } = await this.pool.query<RevisionRow>(
      'SELECT * FROM news_revision WHERE news_id = $1 ORDER BY revision_no DESC', [id]);
    return rows.map(toRevision);
  }

  /** Newest first: what happened to the news item and its revisions, without request or metadata detail. */
  async timeline(id: string): Promise<TimelineEntry[]> {
    await this.loadNews(this.pool, id);
    const { rows } = await this.pool.query(
      `SELECT * FROM (
         SELECT 'event' AS kind, a.occurred_at AS at, a.actor_id AS actor, a.action, r.revision_no,
                a.previous_state AS "from", a.new_state AS "to", a.reason
           FROM audit_event a LEFT JOIN news_revision r ON r.id = a.revision_id
          WHERE a.news_id = $1 AND a.action <> 'authz.denied'
         UNION ALL
         SELECT 'revision', r.created_at, NULL, 'revision.created', r.revision_no, NULL, NULL, r.change_reason
           FROM news_revision r WHERE r.news_id = $1
       ) t ORDER BY at DESC, revision_no DESC NULLS LAST LIMIT 200`,
      [id],
    );
    return rows.map((r) => ({
      kind: r.kind, at: r.at.toISOString(), actor: r.actor, action: r.action, revisionNo: r.revision_no,
      from: r.from, to: r.to, reason: r.reason,
    }));
  }

  // --------------------------------------------------------------- commands

  async create(input: NewsCreate, actor: Actor): Promise<NewsDetail> {
    const id = await withTransaction(this.pool, async (db) => {
      const newsId = randomUUID();
      const slug = input.slug ?? slugify(input.title, `news-${newsId.slice(0, 8)}`);
      try {
        await db.query(
          'INSERT INTO news (id, canonical_key, category_id, desk_id) VALUES ($1, $2, $3, $4)',
          [newsId, `news-${newsId}`, input.categoryId ?? null, input.deskId ?? null],
        );
        const rev = await db.query<{ id: string }>(
          `INSERT INTO news_revision (news_id, revision_no, changed_by, change_reason) VALUES ($1, 1, $2, 'created') RETURNING id`,
          [newsId, actor.principal.subject],
        );
        await db.query(
          `INSERT INTO news_translation (revision_id, locale, title, slug, body) VALUES ($1, $2, $3, $4, $5)`,
          [rev.rows[0]!.id, input.locale, input.title, slug, JSON.stringify({ type: 'doc', content: [] })],
        );
      } catch (e) {
        asBadRequest(e);
      }
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'news.create', objectType: 'news', objectId: newsId,
          newsId, newState: 'DRAFT', requestId: actor.requestId },
        db,
      );
      return newsId;
    });
    return this.detail(id, actor.principal);
  }

  async saveTranslation(id: string, locale: string, input: TranslationSave, actor: Actor): Promise<NewsDetail> {
    await withTransaction(this.pool, async (db) => {
      const news = await this.lockNews(db, id);
      if (news.status === 'ARCHIVED') throw conflict('news_archived', 'Archived news cannot be edited');
      const revision = await this.latestRevision(db, id);
      if (revision.submitted_at) {
        throw conflict('revision_locked', 'This revision is locked. Create a new revision to edit a published news item.');
      }
      const existing = await db.query<{ version: number }>(
        'SELECT version FROM news_translation WHERE revision_id = $1 AND locale = $2 FOR UPDATE', [revision.id, locale]);
      const current = existing.rows[0]?.version ?? null;
      if (current !== input.expectedVersion) {
        throw conflict('version_conflict', `Someone else changed this translation (current version ${current ?? 'none'})`);
      }
      const values = [input.title, input.dek ?? null, JSON.stringify(input.body), input.slug, input.seoTitle ?? null, input.seoDescription ?? null];
      try {
        if (current === null) {
          await db.query(
            `INSERT INTO news_translation (revision_id, locale, title, dek, body, slug, seo_title, seo_description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [revision.id, locale, ...values],
          );
        } else {
          await db.query(
            `UPDATE news_translation SET title = $3, dek = $4, body = $5, slug = $6, seo_title = $7, seo_description = $8,
                    version = version + 1, updated_at = now()
              WHERE revision_id = $1 AND locale = $2`,
            [revision.id, locale, ...values],
          );
        }
        await this.syncInlineMedia(db, revision.id);
      } catch (e) {
        asBadRequest(e);
      }
      await db.query('UPDATE news_revision SET changed_by = $2, changed_at = now() WHERE id = $1', [revision.id, actor.principal.subject]);
      await db.query('UPDATE news SET updated_at = now() WHERE id = $1', [id]);
    });
    return this.detail(id, actor.principal);
  }

  async updateMeta(id: string, input: NewsMeta, actor: Actor): Promise<NewsDetail> {
    await withTransaction(this.pool, async (db) => {
      const news = await this.lockNews(db, id);
      if (news.status === 'ARCHIVED') throw conflict('news_archived', 'Archived news cannot be edited');
      try {
        if ('deskId' in input || 'categoryId' in input) {
          await db.query(
            `UPDATE news SET desk_id = CASE WHEN $2::boolean THEN $3::uuid ELSE desk_id END,
                              category_id = CASE WHEN $4::boolean THEN $5::uuid ELSE category_id END
              WHERE id = $1`,
            [id, 'deskId' in input, input.deskId ?? null, 'categoryId' in input, input.categoryId ?? null],
          );
        }
        if (input.contributors) {
          await db.query('DELETE FROM news_contributor WHERE news_id = $1', [id]);
          for (const c of input.contributors) {
            await db.query(
              `INSERT INTO news_contributor (news_id, contributor_id, role, position) VALUES ($1, $2, $3, $4)
               ON CONFLICT DO NOTHING`,
              [id, c.contributorId, c.role, c.position ?? 0],
            );
          }
        }
      } catch (e) {
        asBadRequest(e);
      }
      await db.query('UPDATE news SET updated_at = now() WHERE id = $1', [id]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'news.meta_update', objectType: 'news', objectId: id,
          newsId: id, requestId: actor.requestId,
          metadata: { changed: Object.keys(input), from: { deskId: news.desk_id, categoryId: news.category_id } } },
        db,
      );
    });
    return this.detail(id, actor.principal);
  }

  /** Opens a new editable revision of a live news. The published revision stays live. */
  async createRevision(id: string, input: RevisionCreate, actor: Actor): Promise<NewsDetail> {
    await withTransaction(this.pool, async (db) => {
      const news = await this.lockNews(db, id);
      if (news.status !== 'PUBLISHED') {
        throw conflict('invalid_state', `Only a published news item can be revised (status is ${news.status})`);
      }
      const latest = await this.latestRevision(db, id);
      await this.copyRevision(db, latest, { changedBy: actor.principal.subject, reason: input.reason, isCorrection: false });
      await db.query(`UPDATE news SET status = 'UPDATED', updated_at = now() WHERE id = $1`, [id]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'news.revise', objectType: 'news', objectId: id,
          newsId: id, previousState: 'PUBLISHED', newState: 'UPDATED', reason: input.reason, requestId: actor.requestId },
        db,
      );
    });
    return this.detail(id, actor.principal);
  }

  async createCorrection(id: string, input: CorrectionCreate, actor: Actor): Promise<NewsDetail> {
    await this.authz.requireAll(actor.principal, ['news.correct'], { requestId: actor.requestId, objectType: 'news', objectId: id });
    await withTransaction(this.pool, async (db) => {
      const news = await this.lockNews(db, id);
      if (news.status !== 'PUBLISHED') {
        throw conflict('invalid_state', `Only a published news item can be corrected (status is ${news.status})`);
      }
      const latest = await this.latestRevision(db, id);
      const rev = await this.copyRevision(db, latest, { changedBy: actor.principal.subject, reason: input.reason, isCorrection: true });
      try {
        const correction = await db.query<{ id: string }>(
          `INSERT INTO correction (news_id, revision_id, reason, requested_by, approved_by) VALUES ($1, $2, $3, $4, $4) RETURNING id`,
          [id, rev.id, input.reason, actor.principal.subject],
        );
        for (const [locale, notice] of Object.entries(input.notices)) {
          await db.query('INSERT INTO correction_notice (correction_id, locale, notice) VALUES ($1, $2, $3)', [correction.rows[0]!.id, locale, notice]);
        }
      } catch (e) {
        asBadRequest(e);
      }
      await db.query(`UPDATE news SET status = 'CORRECTED', updated_at = now() WHERE id = $1`, [id]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'news.correct', objectType: 'news', objectId: id,
          newsId: id, revisionId: rev.id, previousState: 'PUBLISHED', newState: 'CORRECTED', reason: input.reason, requestId: actor.requestId },
        db,
      );
    });
    return this.detail(id, actor.principal);
  }

  async transition(id: string, req: TransitionRequest, actor: Actor): Promise<NewsDetail> {
    // Look at the news item first (no lock) so the capability check can run before any write.
    const peek = await this.loadNews(this.pool, id);
    const move = findTransition(peek.status, req.to);
    if (!move) {
      throw conflict('invalid_transition', `Cannot move from ${peek.status} to ${req.to}. Allowed: ${movesFrom(peek.status).join(', ') || 'none'}`);
    }
    const policy = await this.policyFor(this.pool, peek.desk_id);
    if (move.skipsFactCheck && policy.factCheckRequired) {
      throw conflict('fact_check_required', 'This desk requires a fact check before a news item is ready');
    }
    await this.authz.requireAll(actor.principal, [capabilityFor(move, policy)], { requestId: actor.requestId, objectType: 'news', objectId: id });
    if (move.reasonRequired && !req.reason) throw new BadRequestException(`A reason is required to move ${peek.status} to ${req.to}`);

    await withTransaction(this.pool, async (db) => {
      const news = await this.lockNews(db, id);
      if (news.status !== peek.status) throw conflict('stale_state', 'The news item changed while you were working. Reload and try again.');
      const revision = await this.latestRevision(db, id);
      const by = actor.principal.subject;
      const event: { type: string; payload: Record<string, unknown> } | null = await this.applyEffect(db, move.effect, news, revision, req, actor);
      await db.query('UPDATE news SET status = $2, updated_at = now() WHERE id = $1', [id, req.to]);
      await this.audit.record(
        { actorType: 'human', actorId: by, action: 'news.transition', objectType: 'news', objectId: id, newsId: id,
          revisionId: revision.id, previousState: news.status, newState: req.to, reason: req.reason ?? null, requestId: actor.requestId },
        db,
      );
      if (event) {
        await db.query(
          `INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type, payload) VALUES ('news', $1, $2, $3)`,
          [id, event.type, JSON.stringify(event.payload)],
        );
      }
    });
    return this.detail(id, actor.principal);
  }

  // -------------------------------------------------------- scheduled publish

  /**
   * Called by the worker when a schedule falls due. It publishes under the authority of the human
   * who scheduled it, re-checking every readiness rule now. If the news item can no longer be
   * published it goes back to READY and the schedule is marked failed, so an editor sees it.
   * Repeating the call returns the first outcome.
   */
  async publishScheduled(scheduleId: string, requestId: string): Promise<ScheduledPublishResult> {
    const by = 'system:scheduler';
    return withTransaction(this.pool, async (db) => {
      const found = await db.query<{ id: string; news_id: string; status: string; scheduled_for: Date; last_error: string | null }>(
        'SELECT id, news_id, status, scheduled_for, last_error FROM publishing_schedule WHERE id = $1 FOR UPDATE', [scheduleId]);
      const schedule = found.rows[0];
      if (!schedule) throw new NotFoundException('Schedule not found');
      const newsId = schedule.news_id;
      if (schedule.status === 'published') return { result: 'already_published', newsId };
      if (schedule.status === 'cancelled') return { result: 'cancelled', newsId };
      if (schedule.status === 'failed') return { result: 'failed', newsId, detail: schedule.last_error ?? undefined };
      if (schedule.scheduled_for.getTime() > Date.now()) return { result: 'not_due', newsId };

      const news = await this.lockNews(db, newsId);
      if (news.status !== 'SCHEDULED') {
        await db.query(`UPDATE publishing_schedule SET status = 'cancelled', last_error = $2 WHERE id = $1`, [scheduleId, `news is ${news.status}, not scheduled`]);
        return { result: 'cancelled', newsId, detail: `news is ${news.status}` };
      }
      const revision = await this.latestRevision(db, newsId);

      await db.query('SAVEPOINT scheduled_publish');
      try {
        const event = await this.publish(db, news, revision, by);
        await db.query(`UPDATE publishing_schedule SET status = 'published', executed_at = now(), last_error = NULL WHERE id = $1`, [scheduleId]);
        await db.query(`UPDATE news SET status = 'PUBLISHED', updated_at = now() WHERE id = $1`, [newsId]);
        await this.audit.record(
          { actorType: 'system', actorId: by, action: 'news.transition', objectType: 'news', objectId: newsId, newsId,
            revisionId: revision.id, previousState: 'SCHEDULED', newState: 'PUBLISHED', reason: 'scheduled publish', requestId,
            metadata: { scheduleId } },
          db,
        );
        await db.query(`INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type, payload) VALUES ('news', $1, $2, $3)`,
          [newsId, event.type, JSON.stringify(event.payload)]);
        return { result: 'published', newsId };
      } catch (err) {
        if (!(err instanceof HttpException)) throw err; // unexpected: roll everything back so the worker retries
        await db.query('ROLLBACK TO SAVEPOINT scheduled_publish');
        const body = err.getResponse();
        const issues = typeof body === 'object' && body !== null && 'issues' in body ? (body as { issues: string[] }).issues : [];
        const reason = [err.message, ...issues].join(' ').slice(0, 500);
        await db.query(`UPDATE publishing_schedule SET status = 'failed', executed_at = now(), last_error = $2 WHERE id = $1`, [scheduleId, reason]);
        await db.query(`UPDATE news SET status = 'READY', updated_at = now() WHERE id = $1`, [newsId]);
        await this.audit.record(
          { actorType: 'system', actorId: by, action: 'news.transition', objectType: 'news', objectId: newsId, newsId,
            revisionId: revision.id, previousState: 'SCHEDULED', newState: 'READY', reason: `scheduled publish failed: ${reason}`, requestId,
            metadata: { scheduleId } },
          db,
        );
        await db.query(`INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type, payload) VALUES ('news', $1, 'news.schedule_failed', $2)`,
          [newsId, JSON.stringify({ newsId, scheduleId, reason })]);
        return { result: 'failed', newsId, detail: reason };
      }
    });
  }

  // ------------------------------------------------------------ public read

  /** Only a published translation is ever returned; a replaced slug redirects to the current one. */
  async publicNews(locale: string, slug: string): Promise<{ news: PublicNews } | { redirectTo: string }> {
    const hit = await this.pool.query<{ news_id: string; is_current: boolean }>(
      `SELECT ss.news_id, ss.is_current FROM news_slug ss JOIN news s ON s.id = ss.news_id
        WHERE ss.locale = $1 AND ss.slug = $2 AND s.published_revision_id IS NOT NULL AND s.status = ANY($3)`,
      [locale, slug, LIVE_STATUSES],
    );
    const row = hit.rows[0];
    if (!row) throw new NotFoundException('Not found');
    if (!row.is_current) {
      const current = await this.pool.query<{ slug: string }>(
        'SELECT slug FROM news_slug WHERE news_id = $1 AND locale = $2 AND is_current', [row.news_id, locale]);
      if (!current.rows[0]) throw new NotFoundException('Not found');
      return { redirectTo: current.rows[0].slug };
    }

    const main = await this.pool.query(
      `SELECT s.id, s.published_at, st.title, st.dek, st.body, st.seo_title, st.seo_description, st.updated_at,
              sr.revision_no, sr.changed_at, sr.id AS revision_id
         FROM news s
         JOIN news_revision sr ON sr.id = s.published_revision_id
         JOIN news_translation st ON st.revision_id = sr.id AND st.locale = $2
        WHERE s.id = $1`,
      [row.news_id, locale],
    );
    const m = main.rows[0];
    if (!m) throw new NotFoundException('Not found');
    const [contributors, alternates, corrections] = await Promise.all([
      this.pool.query(
        `SELECT sc.role, c.id, c.kind, c.display_name, c.bio FROM news_contributor sc
           JOIN contributor c ON c.id = sc.contributor_id WHERE sc.news_id = $1 ORDER BY sc.position, c.display_name`, [row.news_id]),
      this.pool.query(
        `SELECT st.locale, ss.slug FROM news_translation st
           JOIN news_slug ss ON ss.news_id = $1 AND ss.locale = st.locale AND ss.is_current
          WHERE st.revision_id = $2 AND st.locale <> $3 ORDER BY st.locale`, [row.news_id, m.revision_id, locale]),
      this.pool.query(
        `SELECT c.approved_at, n.notice FROM correction c
           JOIN correction_notice n ON n.correction_id = c.id AND n.locale = $2
           JOIN news_revision r ON r.id = c.revision_id
          WHERE c.news_id = $1 AND r.revision_no <= $3 ORDER BY c.approved_at`, [row.news_id, locale, m.revision_no]),
    ]);
    const media = await this.publicMedia(bodyMediaAssetIds(m.body));
    const categoryRow = await this.pool.query<{ category_id: string | null }>('SELECT category_id FROM news WHERE id = $1', [row.news_id]);
    const refs = await this.taxonomy.publicRefs(row.news_id, categoryRow.rows[0]?.category_id ?? null, locale);
    return {
      news: {
        id: m.id, locale, slug, title: m.title, dek: m.dek, body: m.body, seoTitle: m.seo_title, seoDescription: m.seo_description,
        publishedAt: m.published_at.toISOString(), updatedAt: m.changed_at.toISOString(),
        contributors: contributors.rows.map((c) => ({
          contributor: { id: c.id, kind: c.kind, displayName: c.display_name, bio: c.bio }, role: c.role,
        })),
        alternates: alternates.rows.map((a) => ({ locale: a.locale, slug: a.slug })),
        corrections: corrections.rows.map((c) => ({ approvedAt: c.approved_at.toISOString(), notice: c.notice })),
        media,
        category: refs.category,
        tags: refs.tags,
      },
    };
  }

  /** The images a published body shows, if their rights still allow the web. Rights are checked on every read. */
  private async publicMedia(ids: string[]): Promise<PublicNews['media']> {
    if (ids.length === 0) return [];
    const { rows } = await this.pool.query(
      `SELECT id, width, height, alt_text, attribution, license FROM media_asset
        WHERE id = ANY ($1::uuid[]) AND processing_state = 'ready' AND 'web' = ANY (permitted_channels)
          AND (rights_expires_at IS NULL OR rights_expires_at > now())`,
      [ids],
    );
    const byId = new Map(rows.map((r) => [r.id as string, r]));
    return ids.flatMap((id) => {
      const r = byId.get(id);
      return r
        ? [{
            id, width: r.width, height: r.height, alt: r.alt_text, attribution: r.attribution, license: r.license,
            urls: { thumb: `/public/media/${id}/thumb`, card: `/public/media/${id}/card`, hero: `/public/media/${id}/hero` },
          }]
        : [];
    });
  }

  // ---------------------------------------------------------------- helpers

  private async applyEffect(
    db: PoolClient, effect: string, news: NewsRow, revision: RevisionRow, req: TransitionRequest, actor: Actor,
  ): Promise<{ type: string; payload: Record<string, unknown> } | null> {
    const by = actor.principal.subject;
    switch (effect) {
      case 'submit': {
        if (revision.submitted_at) throw conflict('revision_locked', 'This revision is already submitted');
        await this.requireReady(db, news, revision, 'review');
        await this.lockRevision(db, revision, by);
        return null;
      }
      case 'send_back':
        await this.copyRevision(db, revision, { changedBy: by, reason: req.reason!, isCorrection: revision.is_correction });
        return null;
      case 'approve':
        await db.query('UPDATE news_revision SET approved_at = now(), approved_by = $2 WHERE id = $1 AND approved_at IS NULL', [revision.id, by]);
        return null;
      case 'schedule': {
        await this.requireReady(db, news, revision, 'publish');
        const when = new Date(req.schedule!.scheduledFor);
        if (when.getTime() <= Date.now()) throw new BadRequestException('scheduledFor must be in the future');
        await db.query(
          `INSERT INTO publishing_schedule (news_id, scheduled_for, time_zone, idempotency_key, created_by) VALUES ($1, $2, $3, $4, $5)`,
          [news.id, when.toISOString(), req.schedule!.timeZone, `sched:${randomUUID()}`, by],
        );
        return null;
      }
      case 'unschedule':
        await this.cancelSchedules(db, news.id, 'cancelled by editor');
        return null;
      case 'publish':
        return this.publish(db, news, revision, by);
      case 'archive':
        await this.cancelSchedules(db, news.id, 'news archived');
        return { type: 'news.archived', payload: { newsId: news.id } };
      default:
        return null;
    }
  }

  private async publish(db: PoolClient, news: NewsRow, revision: RevisionRow, by: string) {
    const snapshot = await this.requireReady(db, news, revision, 'publish');
    // Updates and corrections skip review: the publisher's capability is the approval.
    if (!revision.submitted_at) await this.lockRevision(db, revision, by);
    await db.query('UPDATE news_revision SET approved_at = COALESCE(approved_at, now()), approved_by = COALESCE(approved_by, $2) WHERE id = $1', [revision.id, by]);

    for (const t of snapshot.translations) {
      const owner = await db.query<{ news_id: string }>('SELECT news_id FROM news_slug WHERE locale = $1 AND slug = $2', [t.locale, t.slug]);
      if (owner.rows[0] && owner.rows[0].news_id !== news.id) {
        throw conflict('slug_conflict', `${t.locale}: the slug "${t.slug}" belongs to another news item`);
      }
      await db.query('UPDATE news_slug SET is_current = false WHERE news_id = $1 AND locale = $2 AND slug <> $3 AND is_current', [news.id, t.locale, t.slug]);
      await db.query(
        `INSERT INTO news_slug (news_id, locale, slug, is_current) VALUES ($1, $2, $3, true)
         ON CONFLICT (locale, slug) DO UPDATE SET is_current = true`,
        [news.id, t.locale, t.slug],
      );
    }
    await db.query(
      `UPDATE news SET published_revision_id = $2, published_at = COALESCE(published_at, now()) WHERE id = $1`,
      [news.id, revision.id],
    );
    await this.cancelSchedules(db, news.id, 'published');
    return {
      type: 'news.published',
      payload: { newsId: news.id, revisionId: revision.id, locales: snapshot.translations.map((t) => ({ locale: t.locale, slug: t.slug })) },
    };
  }

  private async requireReady(db: Db, news: NewsRow, revision: RevisionRow, level: 'review' | 'publish'): Promise<RevisionSnapshot> {
    const snapshot = await this.snapshot(db, news, revision);
    const issues = level === 'review' ? reviewIssues(snapshot) : publishIssues(snapshot);
    if (issues.length > 0) throw unprocessable('The news item is not ready', issues);
    return snapshot;
  }

  private async snapshot(db: Db, news: NewsRow, revision: RevisionRow): Promise<RevisionSnapshot> {
    const [translations, authors, media] = await Promise.all([
      db.query('SELECT locale, title, slug, body, translation_status FROM news_translation WHERE revision_id = $1 ORDER BY locale', [revision.id]),
      db.query<{ n: number }>(`SELECT count(*)::int AS n FROM news_contributor WHERE news_id = $1 AND role = 'author'`, [news.id]),
      db.query(
        `SELECT m.id, m.license, m.attribution, m.processing_state, m.rights_expires_at, m.permitted_channels
           FROM revision_media rm JOIN media_asset m ON m.id = rm.media_asset_id WHERE rm.revision_id = $1`,
        [revision.id]),
    ]);
    return {
      deskId: news.desk_id,
      authorCount: authors.rows[0]!.n,
      translations: translations.rows.map((t) => ({ locale: t.locale, title: t.title, slug: t.slug, body: t.body, translationStatus: t.translation_status })),
      media: media.rows.map((m) => ({
        id: m.id, license: m.license, attribution: m.attribution, processingState: m.processing_state,
        rightsExpiresAt: m.rights_expires_at, permittedChannels: m.permitted_channels,
      })),
    };
  }

  private async lockRevision(db: PoolClient, revision: RevisionRow, by: string) {
    const rows = await db.query('SELECT locale, title, dek, body, slug, seo_title, seo_description FROM news_translation WHERE revision_id = $1 ORDER BY locale', [revision.id]);
    const hash = createHash('sha256').update(JSON.stringify(rows.rows)).digest('hex');
    await db.query('UPDATE news_revision SET submitted_at = now(), submitted_by = $2, content_hash = $3 WHERE id = $1', [revision.id, by, hash]);
  }

  private async cancelSchedules(db: PoolClient, newsId: string, why: string) {
    await db.query(`UPDATE publishing_schedule SET status = 'cancelled', last_error = $2 WHERE news_id = $1 AND status = 'pending'`, [newsId, why]);
  }

  /** A new editable revision holding a copy of an earlier one (history is never edited in place). */
  private async copyRevision(db: PoolClient, from: RevisionRow, o: { changedBy: string; reason: string; isCorrection: boolean }): Promise<{ id: string }> {
    const next = await db.query<{ id: string }>(
      `INSERT INTO news_revision (news_id, revision_no, changed_by, change_reason, is_correction, ai_assisted)
       SELECT news_id, max(revision_no) + 1, $2, $3, $4, false FROM news_revision WHERE news_id = $1 GROUP BY news_id
       RETURNING id`,
      [from.news_id, o.changedBy, o.reason, o.isCorrection],
    );
    const id = next.rows[0]!.id;
    await db.query(
      `INSERT INTO news_translation (revision_id, locale, title, dek, body, slug, seo_title, seo_description, translation_status)
       SELECT $2, locale, title, dek, body, slug, seo_title, seo_description, translation_status FROM news_translation WHERE revision_id = $1`,
      [from.id, id],
    );
    await db.query(
      `INSERT INTO revision_media (revision_id, media_asset_id, role, position, caption)
       SELECT $2, media_asset_id, role, position, caption FROM revision_media WHERE revision_id = $1`,
      [from.id, id],
    );
    return { id };
  }

  /** Keeps `revision_media` (inline role) equal to the images the translations actually use. */
  private async syncInlineMedia(db: PoolClient, revisionId: string) {
    const bodies = await db.query<{ body: unknown }>('SELECT body FROM news_translation WHERE revision_id = $1', [revisionId]);
    const ids = [...new Set(bodies.rows.flatMap((r) => bodyMediaAssetIds(r.body)))];
    await db.query(`DELETE FROM revision_media WHERE revision_id = $1 AND role = 'inline'`, [revisionId]);
    for (const [i, mediaId] of ids.entries()) {
      await db.query(`INSERT INTO revision_media (revision_id, media_asset_id, role, position) VALUES ($1, $2, 'inline', $3)`, [revisionId, mediaId, i]);
    }
  }

  private async policyFor(db: Db, deskId: string | null): Promise<WorkflowPolicy> {
    const { rows } = await db.query<{ scope: string; value: unknown }>(
      `SELECT scope, value FROM configuration WHERE key = 'workflow.transition_policy' AND scope = ANY($1::text[])`,
      [deskId ? ['global', `desk:${deskId}`] : ['global']],
    );
    const chosen = rows.find((r) => r.scope === `desk:${deskId}`) ?? rows.find((r) => r.scope === 'global');
    return chosen ? (parseConfigValue('workflow.transition_policy', chosen.value) as WorkflowPolicy) : defaultWorkflowPolicy;
  }

  private async loadNews(db: Db, id: string): Promise<NewsRow> {
    const { rows } = await db.query<NewsRow>('SELECT * FROM news WHERE id = $1', [id]);
    if (!rows[0]) throw new NotFoundException('News not found');
    return rows[0];
  }

  private async lockNews(db: PoolClient, id: string): Promise<NewsRow> {
    const { rows } = await db.query<NewsRow>('SELECT * FROM news WHERE id = $1 FOR UPDATE', [id]);
    if (!rows[0]) throw new NotFoundException('News not found');
    return rows[0];
  }

  private async latestRevision(db: Db, newsId: string): Promise<RevisionRow> {
    const { rows } = await db.query<RevisionRow>('SELECT * FROM news_revision WHERE news_id = $1 ORDER BY revision_no DESC LIMIT 1', [newsId]);
    if (!rows[0]) throw new NotFoundException('News has no revision');
    return rows[0];
  }
}
