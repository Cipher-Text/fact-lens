import { jobPayloadSchemas, type JobPayload, type JobType } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import type { ApiClient } from '../api-client';
import { PermanentJobError } from '../errors';
import { FeedFetchError } from '../feeds/safe-fetch';
import type { Logger } from '../log';
import type { Enqueue } from '../queues';
import { scanDueSchedules } from '../scan';
import { parseFeed } from '../feeds/parse';
import { scanDueFeeds } from '../feeds/scan';
import type { FeedFetcher } from '../feeds/safe-fetch';

export interface Services {
  pool: Pool;
  api: ApiClient;
  log: Logger;
  enqueue: Enqueue;
  cache: CacheInvalidator;
  /** Fetches one approved feed address, safely. */
  feeds: FeedFetcher;
}

/** Purges what the public site has cached. The real implementation arrives with the public cache. */
export interface CacheInvalidator {
  invalidate(tags: string[]): Promise<void>;
}

export const loggingCacheInvalidator = (log: Logger): CacheInvalidator => ({
  async invalidate(tags) {
    log.info('cache.invalidate', { tags, stub: true });
  },
});

export interface Handler<T extends JobType> {
  /** Record the idempotency key so a repeated delivery is skipped. False when the work is idempotent on its own. */
  receipt: boolean;
  run(payload: JobPayload<T>, services: Services): Promise<void>;
}

type Handlers = { [T in JobType]: Handler<T> };

const notBuilt = (name: string): Handler<never> => ({
  receipt: false,
  async run() {
    // Failing loudly beats a stub that reports success for work nobody did.
    throw new PermanentJobError(`${name} is not implemented yet`);
  },
});

export const handlers: Handlers = {
  'news.publish_scheduled': {
    receipt: false, // the API makes this idempotent: a second call returns the first outcome
    async run({ scheduleId }, { api, log }) {
      const res = await api.publishSchedule(scheduleId);
      log.info('news.publish_scheduled', { scheduleId, ...res });
    },
  },
  'cache.invalidate': {
    receipt: true,
    async run({ tags }, { cache }) {
      await cache.invalidate(tags);
    },
  },
  'search.index': {
    receipt: true,
    async run(payload, { log }) {
      // The search projection is not built yet; keep the queue flowing and say so.
      log.info('search.index', { ...payload, stub: true });
    },
  },
  'notification.send': {
    receipt: true,
    async run(payload, { log }) {
      log.warn('notification.send', { ...payload, stub: true });
    },
  },
  'media.variant': notBuilt('media.variant'),
  'media.card_generate': notBuilt('media.card_generate'),
  'feed.scan': {
    receipt: false,
    async run(_payload, { pool, enqueue, log }) {
      await scanDueFeeds(pool, enqueue, log);
    },
  },
  'feed.fetch': {
    receipt: false, // storing an item is idempotent in the API: an item is kept once per feed
    async run({ feedId }, { pool, api, feeds, log }) {
      const { rows } = await pool.query<{ url: string; active: boolean; etag: string | null; last_modified: string | null }>(
        'SELECT url, active, etag, last_modified FROM feed WHERE id = $1', [feedId]);
      const feed = rows[0];
      if (!feed?.active) return; // removed or paused since it was queued
      // A feed that fails is reported, not retried at once: the next poll is its retry, and the editor sees the reason.
      try {
        const got = await feeds(feed.url, { etag: feed.etag, lastModified: feed.last_modified });
        if (got.status === 304) {
          await api.ingestFeed(feedId, { status: 'not_modified', items: [] });
          return;
        }
        const items = parseFeed(got.body);
        const res = await api.ingestFeed(feedId, { status: 'ok', etag: got.etag, lastModified: got.lastModified, items });
        log.info('feed.fetch', { feedId, items: items.length, ...res });
      } catch (e) {
        if (!(e instanceof FeedFetchError)) throw e;
        log.warn('feed.fetch_failed', { feedId, reason: e.message });
        await api.ingestFeed(feedId, { status: 'error', error: e.message.slice(0, 300), items: [] });
      }
    },
  },
  'schedule.scan': {
    receipt: false,
    async run(_payload, { pool, enqueue, log }) {
      await scanDueSchedules(pool, enqueue, log);
    },
  },
};

export function parsePayload<T extends JobType>(type: T, payload: unknown): JobPayload<T> {
  const parsed = jobPayloadSchemas[type].safeParse(payload);
  if (!parsed.success) throw new PermanentJobError(`Invalid ${type} payload: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
  return parsed.data as JobPayload<T>;
}
