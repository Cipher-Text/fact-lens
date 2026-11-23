import { createHash } from 'node:crypto';
import { BadRequestException, HttpException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  parseConfigValue, searchConfigFor, searchLiveStatuses, type PublicNewsList, type PublicSearch, type PublicSearchQuery, type SearchIndexResult,
} from '@fact-lens/contracts';
import type { Redis } from 'ioredis';
import type { Pool, PoolClient } from 'pg';
import { REDIS_CLIENT, VIEWS_OPTIONS, type ViewsOptions } from '../analytics/views.service';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { projectNewsSearch } from './projection';

export { plainTextOf } from './projection';

/** Queries shorter than this return nothing: one letter matches almost everything. */
const MIN_QUERY = 2;
/** The recency boost: a new item gets up to 0.2 more than an old one, halving every 30 days. */
const RECENCY_WEIGHT = 0.2;
const RECENCY_HALF_LIFE_SECONDS = 30 * 86400;

type Db = Pool | PoolClient;

/**
 * Public search (docs/26). The search document of each live news item is written here, from its published text, and
 * read by the public search endpoint. Only live items with a version in the language are ever returned. The worker asks
 * for a projection through an internal endpoint; the same method serves the reindex command.
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(TaxonomyService) private readonly taxonomy: TaxonomyService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    @Inject(VIEWS_OPTIONS) private readonly options: ViewsOptions,
  ) {}

  /**
   * Makes the search document of one news item match its published version (upsert), or removes it. Idempotent: the
   * same published version always gives the same rows.
   */
  async project(newsId: string, operation: 'upsert' | 'delete'): Promise<SearchIndexResult> {
    return withTransaction(this.pool, (db) => projectNewsSearch(db, newsId, operation, searchLiveStatuses));
  }

  /** Rebuilds every search document from the stored text, and removes rows of items that are no longer live. Safe to repeat. */
  async reindex(db: Db = this.pool): Promise<{ indexed: number; removed: number }> {
    const live = [...searchLiveStatuses];
    const { rows } = await db.query<{ id: string }>(
      'SELECT id FROM news WHERE status = ANY($1) AND published_revision_id IS NOT NULL', [live]);
    for (const row of rows) await this.project(row.id, 'upsert');
    const removed = await db.query(
      'DELETE FROM news_search WHERE news_id NOT IN (SELECT id FROM news WHERE status = ANY($1) AND published_revision_id IS NOT NULL)', [live]);
    return { indexed: rows.length, removed: removed.rowCount ?? 0 };
  }

  /** One page of results in one language. Ordered by relevance, then newest; the cursor is the offset of the next page. */
  async search(locale: string, q: PublicSearchQuery, ip: string | null): Promise<PublicSearch> {
    await this.requireActiveLocale(locale);
    await this.underLimit(ip);
    const text = q.q;
    const offset = this.decodeCursor(q.cursor);
    if (text.length < MIN_QUERY) return { query: text, items: [], nextCursor: null };

    const params: unknown[] = [searchConfigFor(locale), text, [...searchLiveStatuses], locale];
    const bind = (value: unknown) => `$${params.push(value)}`;
    const filters: string[] = [];
    if (q.category) {
      const slug = bind(q.category);
      filters.push(`AND EXISTS (SELECT 1 FROM news_category nc JOIN category c ON c.id = nc.category_id
                                  LEFT JOIN category_label cl ON cl.category_id = c.id AND cl.locale = $4
                                 WHERE nc.news_id = ns.news_id AND (cl.slug = ${slug} OR c.parent_id IN (
                                   SELECT pl.category_id FROM category_label pl WHERE pl.locale = $4 AND pl.slug = ${slug})))`);
    }
    if (q.region) {
      filters.push(`AND EXISTS (SELECT 1 FROM news_region nr JOIN region_label rl ON rl.region_id = nr.region_id AND rl.locale = $4
                                 WHERE nr.news_id = ns.news_id AND rl.slug = ${bind(q.region)})`);
    }
    // Opinion pieces stay out of results unless a reader asks for that format, as the public news lists do.
    if (q.format) filters.push(`AND s.format = ${bind(q.format)}`);
    else filters.push("AND s.format <> 'opinion'");
    const limit = bind(q.limit + 1);
    const start = bind(offset);

    const { rows } = await this.pool.query<{ news_id: string }>(
      `WITH query AS (SELECT plainto_tsquery($1::regconfig, $2) AS tsq)
       SELECT ns.news_id
         FROM news_search ns
         JOIN news s ON s.id = ns.news_id AND s.published_revision_id = ns.revision_id AND s.status = ANY($3)
         CROSS JOIN query
        WHERE ns.locale = $4 AND (ns.document @@ query.tsq OR word_similarity($2, ns.title) >= 0.4)
          ${filters.join('\n          ')}
        ORDER BY ts_rank(ns.document, query.tsq) + 0.5 * word_similarity($2, ns.title)
                 + ${RECENCY_WEIGHT} * exp(-extract(epoch FROM now() - s.published_at) / ${RECENCY_HALF_LIFE_SECONDS}) DESC,
                 s.published_at DESC, s.id DESC
        LIMIT ${limit} OFFSET ${start}`,
      params,
    );
    const pageIds = rows.slice(0, q.limit).map((r) => r.news_id);
    const more = rows.length > q.limit;
    const byId = new Map<string, PublicNewsList["items"][number]>();
    if (pageIds.length > 0) {
      const { items } = await this.taxonomy.publicNews(locale, { ids: pageIds, limit: pageIds.length });
      for (const item of items) byId.set(item.id, item);
    }
    return {
      query: text,
      items: pageIds.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
      nextCursor: more ? this.encodeCursor(offset + q.limit) : null,
    };
  }

  private async requireActiveLocale(locale: string): Promise<void> {
    const { rows } = await this.pool.query('SELECT 1 FROM locale WHERE code = $1 AND active', [locale]);
    if (!rows[0]) throw new NotFoundException('Not found');
  }

  private encodeCursor(offset: number): string {
    return Buffer.from(JSON.stringify({ offset })).toString('base64url');
  }

  private decodeCursor(cursor: string | undefined): number {
    if (!cursor) return 0;
    try {
      const value = (JSON.parse(Buffer.from(cursor, 'base64url').toString()) as { offset?: unknown }).offset;
      if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error();
      return value;
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }

  /**
   * The search limit (`rate_limit.search`) per client address, counted in Redis in windows. Without Redis, or with no
   * address, nothing is limited. The address is hashed before it is used as a key.
   * If Redis is unreachable the search still runs without its limit (fail-open for readers, ADR-050): search is a
   * public read, and an outage of the counter must not take the search down with it. The outage is logged.
   */
  private async underLimit(ip: string | null): Promise<void> {
    if (!this.redis || !ip) return;
    const { rows } = await this.pool.query<{ value: unknown }>(
      `SELECT value FROM configuration WHERE key = 'rate_limit.search' AND scope = 'global'`);
    const set = rows[0]
      ? (parseConfigValue('rate_limit.search', rows[0].value) as { limit: number; windowSeconds: number })
      : { limit: 60, windowSeconds: 60 };
    const slot = Math.floor(Date.now() / 1000 / set.windowSeconds);
    const hash = createHash('sha256').update(`${this.options.hashSecret ?? ''}|${ip}`).digest('hex');
    const key = `${this.options.prefix}:rl:search:${slot}:${hash}`;
    let answers: Array<[Error | null, unknown]> | null;
    try {
      answers = await this.redis.multi().incr(key).expire(key, set.windowSeconds + 1).exec();
    } catch (err) {
      this.logger.warn(`search limit skipped, Redis unavailable: ${(err as Error).message}`);
      return;
    }
    if (Number(answers?.[0]?.[1] ?? 0) > set.limit) throw new HttpException('Too many searches. Try again shortly.', 429);
  }
}
