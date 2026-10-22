import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  canonicalizeUrl, inboxStatuses, type Feed, type FeedCreate, type FeedIngest, type FeedIngestResult, type FeedUpdate, type InboxItem,
  type InboxList, type InboxQuery,
} from '@fact-lens/contracts';
import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { isPgError, type Actor } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { SourcesService } from '../news/sources.service';

interface FeedRow {
  id: string; name: string; url: string; active: boolean; poll_minutes: number; last_fetched_at: Date | null;
  last_status: Feed['lastStatus']; last_error: string | null; new_count: number;
}
interface ItemRow {
  id: string; feed_id: string; feed_name: string; title: string; url: string | null; summary: string | null;
  published_at: Date | null; retrieved_at: Date; status: InboxItem['status']; news_id: string | null;
}

const toFeed = (r: FeedRow): Feed => ({
  id: r.id, name: r.name, url: r.url, active: r.active, pollMinutes: r.poll_minutes, lastFetchedAt: r.last_fetched_at?.toISOString() ?? null,
  lastStatus: r.last_status, lastError: r.last_error, newCount: r.new_count,
});
const toItem = (r: ItemRow): InboxItem => ({
  id: r.id, feedId: r.feed_id, feedName: r.feed_name, title: r.title, url: r.url, summary: r.summary,
  publishedAt: r.published_at?.toISOString() ?? null, retrievedAt: r.retrieved_at.toISOString(), status: r.status, newsId: r.news_id,
});

const FEED_SELECT = `SELECT f.*, (SELECT count(*)::int FROM inbox_item i WHERE i.feed_id = f.id AND i.status = 'new') AS new_count FROM feed f`;
const ITEM_SELECT = `SELECT i.*, f.name AS feed_name FROM inbox_item i JOIN feed f ON f.id = i.feed_id`;

function canonicalOrNull(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    return canonicalizeUrl(url);
  } catch {
    return null;
  }
}

/**
 * The source inbox: approved RSS feeds and what they brought in. The worker fetches and reports through
 * `ingest`; editors triage here. A feed address is an allowlist entry, so only administrators add them.
 */
@Injectable()
export class InboxService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(SourcesService) private readonly sources: SourcesService,
  ) {}

  // ------------------------------------------------------------------ feeds

  async listFeeds(): Promise<Feed[]> {
    const { rows } = await this.pool.query<FeedRow>(`${FEED_SELECT} ORDER BY f.name`);
    return rows.map(toFeed);
  }

  private async getFeed(id: string): Promise<Feed> {
    const { rows } = await this.pool.query<FeedRow>(`${FEED_SELECT} WHERE f.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException('Feed not found');
    return toFeed(rows[0]);
  }

  async createFeed(input: FeedCreate, actor: Actor): Promise<Feed> {
    const canonical = canonicalOrNull(input.url);
    if (!canonical) throw new BadRequestException('That is not a valid web address');
    const id = await withTransaction(this.pool, async (db) => {
      let feedId: string;
      try {
        const res = await db.query<{ id: string }>(
          'INSERT INTO feed (name, url, canonical_url, poll_minutes, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [input.name, input.url, canonical, input.pollMinutes, actor.principal.subject],
        );
        feedId = res.rows[0]!.id;
      } catch (e) {
        if (isPgError(e) && e.code === '23505') throw new ConflictException({ message: 'That feed is already added', reason: 'feed_exists' });
        throw e;
      }
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'feed.create', objectType: 'feed', objectId: feedId,
          requestId: actor.requestId, metadata: { url: canonical } },
        db,
      );
      return feedId;
    });
    return this.getFeed(id);
  }

  async updateFeed(id: string, input: FeedUpdate, actor: Actor): Promise<Feed> {
    await withTransaction(this.pool, async (db) => {
      const found = await db.query('SELECT 1 FROM feed WHERE id = $1 FOR UPDATE', [id]);
      if (found.rowCount === 0) throw new NotFoundException('Feed not found');
      if (input.name !== undefined) await db.query('UPDATE feed SET name = $2 WHERE id = $1', [id, input.name]);
      if (input.active !== undefined) await db.query('UPDATE feed SET active = $2 WHERE id = $1', [id, input.active]);
      if (input.pollMinutes !== undefined) await db.query('UPDATE feed SET poll_minutes = $2 WHERE id = $1', [id, input.pollMinutes]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'feed.update', objectType: 'feed', objectId: id,
          requestId: actor.requestId, metadata: { changed: Object.keys(input) } },
        db,
      );
    });
    return this.getFeed(id);
  }

  async deleteFeed(id: string, actor: Actor): Promise<void> {
    await withTransaction(this.pool, async (db) => {
      const res = await db.query('DELETE FROM feed WHERE id = $1', [id]);
      if (res.rowCount === 0) throw new NotFoundException('Feed not found');
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'feed.delete', objectType: 'feed', objectId: id, requestId: actor.requestId },
        db,
      );
    });
  }

  // ------------------------------------------------------------------ inbox

  async list(q: InboxQuery): Promise<InboxList> {
    const { rows } = await this.pool.query<ItemRow>(
      `${ITEM_SELECT} WHERE i.status = $1 AND ($2::uuid IS NULL OR i.feed_id = $2)
        ORDER BY i.published_at DESC NULLS LAST, i.retrieved_at DESC, i.id LIMIT $3`,
      [q.status, q.feedId ?? null, q.limit],
    );
    const counts = await this.pool.query<{ status: InboxItem['status']; n: number }>(
      'SELECT status, count(*)::int AS n FROM inbox_item GROUP BY status');
    const byStatus = Object.fromEntries(inboxStatuses.map((s) => [s, 0])) as Record<InboxItem['status'], number>;
    for (const r of counts.rows) byStatus[r.status] = r.n;
    return { items: rows.map(toItem), counts: byStatus };
  }

  async get(id: string): Promise<InboxItem> {
    const { rows } = await this.pool.query<ItemRow>(`${ITEM_SELECT} WHERE i.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException('Inbox item not found');
    return toItem(rows[0]);
  }

  /** Puts an item aside, or brings it back. An item already used for a news item stays used. */
  async triage(id: string, status: 'new' | 'rejected', actor: Actor): Promise<InboxItem> {
    await withTransaction(this.pool, async (db) => {
      const cur = await db.query<{ status: InboxItem['status'] }>('SELECT status FROM inbox_item WHERE id = $1 FOR UPDATE', [id]);
      if (!cur.rows[0]) throw new NotFoundException('Inbox item not found');
      if (cur.rows[0].status === 'used') throw new ConflictException({ message: 'This item was used for a news item', reason: 'item_used' });
      if (cur.rows[0].status === status) return;
      await db.query('UPDATE inbox_item SET status = $2, triaged_by = $3, triaged_at = now() WHERE id = $1', [id, status, actor.principal.subject]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'inbox.triage', objectType: 'inbox_item', objectId: id,
          previousState: cur.rows[0].status, newState: status, requestId: actor.requestId },
        db,
      );
    });
    return this.get(id);
  }

  /**
   * An editor made a news item from this item: it becomes a source of that news item and leaves the
   * inbox. Safe to repeat for the same news item.
   */
  async use(id: string, newsId: string, actor: Actor): Promise<InboxItem> {
    const item = await this.pool.query<{
      status: InboxItem['status']; news_id: string | null; title: string; url: string | null; canonical_url: string | null; guid: string;
      published_at: Date | null; retrieved_at: Date; feed_id: string; feed_name: string;
    }>(`SELECT i.*, f.name AS feed_name FROM inbox_item i JOIN feed f ON f.id = i.feed_id WHERE i.id = $1`, [id]);
    const it = item.rows[0];
    if (!it) throw new NotFoundException('Inbox item not found');
    if (it.status === 'used' && it.news_id === newsId) return this.get(id);
    if (it.status === 'used' && it.news_id !== newsId) throw new ConflictException({ message: 'This item was already used for another news item', reason: 'item_used' });
    const news = await this.pool.query('SELECT 1 FROM news WHERE id = $1', [newsId]);
    if (news.rowCount === 0) throw new BadRequestException('That news item does not exist');

    const sourceId = await withTransaction(this.pool, async (db) => {
      if (it.canonical_url) {
        const same = await db.query<{ id: string }>('SELECT id FROM source WHERE canonical_url = $1', [it.canonical_url]);
        if (same.rows[0]) return same.rows[0].id;
      }
      const external = `${it.feed_id}:${it.guid}`.slice(0, 1000);
      const again = await db.query<{ id: string }>(`SELECT id FROM source WHERE ingest_channel = 'rss' AND external_id = $1`, [external]);
      if (again.rows[0]) return again.rows[0].id;
      const res = await db.query<{ id: string }>(
        `INSERT INTO source (kind, title, publisher, url, canonical_url, published_at, retrieved_at, ingest_channel, external_id, created_by)
         VALUES ('web', $1, $2, $3, $4, $5, $6, 'rss', $7, $8) RETURNING id`,
        [it.title, it.feed_name, it.url, it.canonical_url, it.published_at, it.retrieved_at, external, actor.principal.subject],
      );
      return res.rows[0]!.id;
    });
    const has = await this.pool.query(`SELECT 1 FROM news_source WHERE news_id = $1 AND relation = 'primary' AND source_id <> $2 LIMIT 1`, [newsId, sourceId]);
    await this.sources.attach(newsId, sourceId, { relation: has.rowCount ? 'secondary' : 'primary', useType: 'background' }, actor);

    await withTransaction(this.pool, async (db) => {
      await db.query(`UPDATE inbox_item SET status = 'used', news_id = $2, triaged_by = $3, triaged_at = now() WHERE id = $1`, [id, newsId, actor.principal.subject]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'inbox.use', objectType: 'inbox_item', objectId: id, newsId,
          previousState: it.status, newState: 'used', requestId: actor.requestId, metadata: { sourceId } },
        db,
      );
    });
    return this.get(id);
  }

  // ------------------------------------------------------------ from the worker

  /** What the worker found in one fetch. Repeating it changes nothing: an item is stored once per feed. */
  async ingest(feedId: string, input: FeedIngest, requestId: string): Promise<FeedIngestResult> {
    return withTransaction(this.pool, async (db) => {
      const feed = await db.query('SELECT 1 FROM feed WHERE id = $1 FOR UPDATE', [feedId]);
      if (feed.rowCount === 0) throw new NotFoundException('Feed not found');
      let inserted = 0, duplicates = 0, skipped = 0;
      if (input.status === 'ok') {
        for (const item of input.items) {
          const canonical = canonicalOrNull(item.url);
          // The same address already in the inbox from any feed, or already a source, is a duplicate: kept, not shown as new.
          const dup = canonical
            ? (await db.query(
                `SELECT 1 FROM inbox_item WHERE canonical_url = $1 AND NOT (feed_id = $2 AND guid = $3)
                 UNION ALL SELECT 1 FROM source WHERE canonical_url = $1 LIMIT 1`,
                [canonical, feedId, item.guid])).rowCount! > 0
            : false;
          const res = await db.query(
            `INSERT INTO inbox_item (feed_id, guid, title, url, canonical_url, summary, published_at, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (feed_id, guid) DO NOTHING`,
            [feedId, item.guid, item.title, item.url ?? null, canonical, item.summary ?? null, item.publishedAt ?? null, dup ? 'duplicate' : 'new'],
          );
          if (res.rowCount === 0) skipped++;
          else if (dup) duplicates++;
          else inserted++;
        }
      }
      await db.query(
        `UPDATE feed SET last_fetched_at = now(), last_status = $2, last_error = $3,
                etag = CASE WHEN $2 = 'ok' THEN $4 ELSE etag END, last_modified = CASE WHEN $2 = 'ok' THEN $5 ELSE last_modified END
          WHERE id = $1`,
        [feedId, input.status, input.status === 'error' ? (input.error ?? 'Fetch failed') : null, input.etag ?? null, input.lastModified ?? null],
      );
      await this.audit.record(
        { actorType: 'system', actorId: 'worker', action: 'feed.fetch', objectType: 'feed', objectId: feedId, requestId,
          metadata: { status: input.status, inserted, duplicates, skipped } },
        db,
      );
      return { inserted, duplicates, skipped };
    });
  }
}
