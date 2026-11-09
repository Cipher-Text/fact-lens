import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { parseConfigValue, type AnalyticsRollupResult, type MostRead, type MostReadQuery, type ViewBeacon, type ViewSource } from '@fact-lens/contracts';
import type { Redis } from 'ioredis';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/pool';
import { LIVE_STATUSES } from '../news/workflow';
import { TaxonomyService } from '../taxonomy/taxonomy.service';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const VIEWS_OPTIONS = Symbol('VIEWS_OPTIONS');

export interface ViewsOptions {
  /** Prefix of every Redis key, so several deployments or tests can share one Redis. */
  prefix: string;
  /** Keys the hash of the client address. Without a secret, one is made for this process. */
  hashSecret?: string | null;
  /** The public site's own host names, so a visit from one page of the site to another is "internal". */
  ownHosts: string[];
  /** The clock, for tests. */
  now?: () => Date;
}

/** The context of one beacon request, taken from the request by the controller. */
export interface ViewContext {
  ip: string | null;
  userAgent: string | null;
  /** The browser fetched the page ahead of the reader (prefetch or prerender): not a view. */
  prefetch: boolean;
}

const DAY_SECONDS = 24 * 3600;
/** The counters of an hour stay this long: 7 days of ranking, plus 2 days for the rollup to catch up. */
const BUCKET_TTL_SECONDS = 9 * DAY_SECONDS;
const WINDOW_HOURS = { '24h': 24, '7d': 168 } as const;
/** How many of the top ids are read from Redis before the section, region and format filters are applied. */
const CANDIDATES = 300;
const DHAKA_OFFSET_MS = 6 * 3600 * 1000;

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|python-requests|curl\/|wget|httpclient|node-fetch|axios|monitor|lighthouse|pingdom|uptime/i;

/** `YYYYMMDDHH` of the UTC hour a time falls in. */
export const hourBucket = (at: Date): string => at.toISOString().slice(0, 13).replace(/[-T]/g, '');

/** The Dhaka calendar day (`YYYY-MM-DD`) an hour bucket belongs to. Dhaka has no daylight saving time, so it is a fixed +6. */
export function dhakaDayOf(bucket: string): string {
  const ms = Date.UTC(+bucket.slice(0, 4), +bucket.slice(4, 6) - 1, +bucket.slice(6, 8), +bucket.slice(8, 10));
  return new Date(ms + DHAKA_OFFSET_MS).toISOString().slice(0, 10);
}

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|baidu|yandex|ecosia|brave|startpage|ask|naver|seznam)\./i;
const SOCIAL = /(^|\.)(facebook|fb|instagram|twitter|x|linkedin|lnkd|youtube|youtu|whatsapp|telegram|t|reddit|pinterest|tiktok|threads|messenger|bsky)\.(com|co|me|be|in|app|net|social)$/i;

/** Where a view came from, by the referrer's domain only. No referrer means a direct visit. */
export function classifySource(referrer: string | undefined, ownHosts: readonly string[]): ViewSource {
  const raw = referrer?.trim().toLowerCase();
  if (!raw) return 'direct';
  let host = raw;
  try {
    host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname;
  } catch {
    return 'other';
  }
  if (ownHosts.some((h) => host === h || host.endsWith(`.${h}`))) return 'internal';
  if (SEARCH.test(host)) return 'search';
  if (SOCIAL.test(host)) return 'social';
  return 'other';
}

interface CacheEntry<T> { value: T; until: number }

/**
 * First-party view counting behind "most read" (docs/03). A view is the first view of a news item, in a
 * language, by a session in 24 hours; it is counted in an hourly Redis sorted set, which is the live ranking
 * and is rolled up into `news_performance_daily` once the hour has finished. Nothing personal is kept: the
 * session id and the client address are only hashed, and only for the de-duplication and the rate limit.
 */
@Injectable()
export class ViewsService {
  private readonly secret: string;
  private readonly clock: () => Date;
  private readonly flagCache: { value: boolean; until: number } = { value: false, until: 0 };
  private readonly limitCache: CacheEntry<{ limit: number; windowSeconds: number }> = { value: { limit: 60, windowSeconds: 60 }, until: 0 };
  private readonly idCache = new Map<string, CacheEntry<string | null>>();

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    @Inject(VIEWS_OPTIONS) private readonly options: ViewsOptions,
    @Inject(TaxonomyService) private readonly taxonomy: TaxonomyService,
  ) {
    this.secret = options.hashSecret || randomBytes(32).toString('hex');
    this.clock = options.now ?? (() => new Date());
  }

  private key(...parts: string[]): string {
    return [this.options.prefix, ...parts].join(':');
  }

  private hash(scope: string, value: string): string {
    return createHash('sha256').update(`${this.secret}|${scope}|${value}`).digest('base64url').slice(0, 22);
  }

  // ------------------------------------------------------------------------ counting

  /** Counts one view when it should be counted. Never throws for a view that is not counted: the answer is the same for the reader. */
  async record(beacon: ViewBeacon, ctx: ViewContext): Promise<'counted' | 'ignored'> {
    try {
      return await this.count(beacon, ctx);
    } catch {
      // A counter that cannot be reached must not break the reader's page: the view is simply not counted.
      return 'ignored';
    }
  }

  private async count(beacon: ViewBeacon, ctx: ViewContext): Promise<'counted' | 'ignored'> {
    if (!this.redis) return 'ignored';
    if (ctx.prefetch || !ctx.userAgent || BOT.test(ctx.userAgent)) return 'ignored';
    if (!(await this.enabled())) return 'ignored';
    if (ctx.ip && !(await this.underLimit(ctx.ip))) return 'ignored';
    const newsId = await this.liveNewsId(beacon.shortId, beacon.locale);
    if (!newsId) return 'ignored';

    // One view per session, per news item and language, in 24 hours. SET NX is the whole check.
    const first = await this.redis.set(this.key('vs', newsId, beacon.locale, this.hash('session', beacon.sessionId)), '1', 'EX', DAY_SECONDS, 'NX');
    if (first !== 'OK') return 'ignored';

    const hour = hourBucket(this.clock());
    const source = classifySource(beacon.referrer, this.options.ownHosts);
    const total = this.key('v', hour, beacon.locale);
    const bySource = this.key('s', hour, beacon.locale, source);
    await this.redis.multi()
      .zincrby(total, 1, newsId).expire(total, BUCKET_TTL_SECONDS)
      .zincrby(bySource, 1, newsId).expire(bySource, BUCKET_TTL_SECONDS)
      .exec();
    return 'counted';
  }

  private async enabled(): Promise<boolean> {
    const now = this.clock().getTime();
    if (this.flagCache.until > now) return this.flagCache.value;
    const { rows } = await this.pool.query<{ enabled: boolean }>(`SELECT enabled FROM feature_flag WHERE key = 'analytics.news_views'`);
    this.flagCache.value = rows[0]?.enabled === true;
    this.flagCache.until = now + 30_000;
    return this.flagCache.value;
  }

  /** The configured limit (`rate_limit.news_view_beacon`) per client address; default 60 a minute. */
  private async underLimit(ip: string): Promise<boolean> {
    const now = this.clock().getTime();
    if (this.limitCache.until <= now) {
      const { rows } = await this.pool.query<{ value: unknown }>(`SELECT value FROM configuration WHERE key = 'rate_limit.news_view_beacon' AND scope = 'global'`);
      if (rows[0]) {
        try {
          const set = parseConfigValue('rate_limit.news_view_beacon', rows[0].value) as { limit: number; windowSeconds: number };
          this.limitCache.value = { limit: set.limit, windowSeconds: set.windowSeconds };
        } catch {
          // A bad stored value keeps the default rather than turning the limit off.
        }
      }
      this.limitCache.until = now + 60_000;
    }
    const { limit, windowSeconds } = this.limitCache.value;
    const slot = Math.floor(now / 1000 / windowSeconds);
    const k = this.key('rl', 'view', String(slot), this.hash('ip', ip));
    const answers = await this.redis!.multi().incr(k).expire(k, windowSeconds + 1).exec();
    return Number(answers?.[0]?.[1] ?? 0) <= limit;
  }

  /** The id of a live news item that has a version in this language, remembered for a minute. */
  private async liveNewsId(shortId: string, locale: string): Promise<string | null> {
    const now = this.clock().getTime();
    const memo = `${shortId}|${locale}`;
    const hit = this.idCache.get(memo);
    if (hit && hit.until > now) return hit.value;
    const { rows } = await this.pool.query<{ id: string }>(
      `SELECT n.id FROM news n JOIN news_translation st ON st.revision_id = n.published_revision_id AND st.locale = $2
        WHERE n.short_id = $1 AND n.published_revision_id IS NOT NULL AND n.status = ANY ($3)`,
      [shortId, locale, LIVE_STATUSES],
    );
    if (this.idCache.size > 5000) this.idCache.clear();
    const value = rows[0]?.id ?? null;
    this.idCache.set(memo, { value, until: now + 60_000 });
    return value;
  }

  // ---------------------------------------------------------------------- most read

  /**
   * The most read news in one language, most views first. Views in the window are summed from the hourly
   * counters (cached for a minute), the top ids are filtered by section, region and format and kept in order,
   * and the places are 1, 2, 3. When too few news items have views the window widens from 24 hours to 7 days,
   * and then the list is filled with the newest news, so it is never empty on a site that has news.
   */
  async mostRead(locale: string, q: MostReadQuery): Promise<MostRead> {
    const filters = { category: q.category, region: q.region, format: q.format, excludeFormat: q.excludeFormat };
    let window = q.window;
    let items = await this.rankedItems(locale, filters, window, q.limit);
    if (items.length < q.limit && window === '24h') {
      window = '7d';
      items = await this.rankedItems(locale, filters, window, q.limit);
    }
    if (items.length < q.limit) {
      const chosen = new Set(items.map((i) => i.id));
      const newest = await this.taxonomy.publicNews(locale, { ...filters, limit: Math.min(50, q.limit + chosen.size) });
      for (const item of newest.items) {
        if (items.length >= q.limit) break;
        if (!chosen.has(item.id)) items.push(item);
      }
    }
    return { window, items: items.slice(0, q.limit).map((item, i) => ({ ...item, rank: i + 1 })) };
  }

  private async rankedItems(
    locale: string, filters: Pick<MostReadQuery, 'category' | 'region' | 'format' | 'excludeFormat'>, window: keyof typeof WINDOW_HOURS, limit: number,
  ) {
    const scored = await this.topIds(locale, window);
    if (scored.length === 0) {
      // Still validate the language and the filters, so an unknown section is a 404 here too.
      await this.taxonomy.publicNews(locale, { ...filters, limit: 1 });
      return [];
    }
    const { items } = await this.taxonomy.publicNews(locale, { ...filters, ids: scored.map((s) => s.id), limit: Math.min(scored.length, 300) });
    const score = new Map(scored.map((s, i) => [s.id, { views: s.views, order: i }]));
    return items.sort((a, b) => score.get(a.id)!.order - score.get(b.id)!.order).slice(0, limit);
  }

  /** The ids with the most views in the window, most first. */
  private async topIds(locale: string, window: keyof typeof WINDOW_HOURS): Promise<Array<{ id: string; views: number }>> {
    try {
      return await this.readTop(locale, window);
    } catch {
      // Without the counters the list falls back to the newest news, which is better than an error page.
      return [];
    }
  }

  private async readTop(locale: string, window: keyof typeof WINDOW_HOURS): Promise<Array<{ id: string; views: number }>> {
    if (!this.redis) return [];
    const hours = WINDOW_HOURS[window];
    const union = this.key('mr', locale, String(hours));
    if (!(await this.redis.exists(union))) {
      const now = this.clock().getTime();
      const keys = Array.from({ length: hours }, (_, i) => this.key('v', hourBucket(new Date(now - i * 3600_000)), locale));
      await this.redis.zunionstore(union, keys.length, ...keys);
      await this.redis.expire(union, 60);
    }
    const flat = await this.redis.zrevrange(union, 0, CANDIDATES - 1, 'WITHSCORES');
    const out: Array<{ id: string; views: number }> = [];
    for (let i = 0; i < flat.length; i += 2) out.push({ id: flat[i]!, views: Number(flat[i + 1]) });
    return out;
  }

  // ------------------------------------------------------------------------ rollup

  /**
   * Adds every finished hour of the counters to `news_performance_daily` (by Dhaka day), once. The hour's
   * counters stay in Redis until they expire, because the live ranking reads them; the `analytics_flush` row
   * is what stops an hour being added twice, in the same transaction as the counts.
   */
  async rollup(): Promise<AnalyticsRollupResult> {
    const result: AnalyticsRollupResult = { buckets: 0, skipped: 0, rows: 0 };
    if (!this.redis) return result;
    const current = hourBucket(this.clock());
    const prefix = this.key('v', '');
    const found: Array<{ hour: string; locale: string; key: string }> = [];
    let cursor = '0';
    do {
      const [next, keys] = await this.redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 500);
      cursor = next;
      for (const key of keys) {
        const [hour, ...rest] = key.slice(prefix.length).split(':');
        const locale = rest.join(':');
        if (hour && /^\d{10}$/.test(hour) && locale && hour < current) found.push({ hour, locale, key });
      }
    } while (cursor !== '0');
    found.sort((a, b) => a.hour.localeCompare(b.hour));

    for (const { hour, locale, key } of found) {
      const flushId = `${hour}:${locale}`;
      const counts = await this.readBucket(hour, locale, key);
      if (counts.size === 0) continue;
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const first = await client.query('INSERT INTO analytics_flush (bucket, rows) VALUES ($1, $2) ON CONFLICT DO NOTHING', [flushId, counts.size]);
        if (first.rowCount === 0) {
          await client.query('ROLLBACK');
          result.skipped += 1;
          continue;
        }
        const ids = [...counts.keys()];
        const column = (pick: (c: BucketCounts) => number) => ids.map((id) => pick(counts.get(id)!));
        const written = await client.query(
          `INSERT INTO news_performance_daily (news_id, locale, day, views, src_search, src_social, src_direct, src_internal, src_other)
           SELECT t.id, $2, $3::date, t.views, t.search, t.social, t.direct, t.internal, t.other
             FROM unnest($1::uuid[], $4::int[], $5::int[], $6::int[], $7::int[], $8::int[], $9::int[]) AS t(id, views, search, social, direct, internal, other)
             JOIN news n ON n.id = t.id
           ON CONFLICT (news_id, locale, day) DO UPDATE SET
             views = news_performance_daily.views + EXCLUDED.views, src_search = news_performance_daily.src_search + EXCLUDED.src_search,
             src_social = news_performance_daily.src_social + EXCLUDED.src_social, src_direct = news_performance_daily.src_direct + EXCLUDED.src_direct,
             src_internal = news_performance_daily.src_internal + EXCLUDED.src_internal, src_other = news_performance_daily.src_other + EXCLUDED.src_other`,
          [ids, locale, dhakaDayOf(hour), column((c) => c.views), column((c) => c.search), column((c) => c.social), column((c) => c.direct),
            column((c) => c.internal), column((c) => c.other)],
        );
        await client.query('COMMIT');
        result.buckets += 1;
        result.rows += written.rowCount ?? 0;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
    }
    // The counters of those hours have long expired, so their markers are no longer needed.
    await this.pool.query(`DELETE FROM analytics_flush WHERE flushed_at < now() - interval '30 days'`);
    return result;
  }

  private async readBucket(hour: string, locale: string, key: string): Promise<Map<string, BucketCounts>> {
    const counts = new Map<string, BucketCounts>();
    const get = (id: string) => {
      let c = counts.get(id);
      if (!c) counts.set(id, (c = { views: 0, search: 0, social: 0, direct: 0, internal: 0, other: 0 }));
      return c;
    };
    const read = async (k: string, apply: (c: BucketCounts, n: number) => void) => {
      const flat = await this.redis!.zrange(k, '0', '-1', 'WITHSCORES');
      for (let i = 0; i < flat.length; i += 2) apply(get(flat[i]!), Number(flat[i + 1]));
    };
    await read(key, (c, n) => { c.views += n; });
    for (const source of ['search', 'social', 'direct', 'internal', 'other'] as const) {
      await read(this.key('s', hour, locale, source), (c, n) => { c[source] += n; });
    }
    return counts;
  }
}

interface BucketCounts { views: number; search: number; social: number; direct: number; internal: number; other: number }
