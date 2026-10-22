import { jobPayloadSchemas, type JobPayload, type JobType } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import type { ApiClient } from '../api-client';
import { PermanentJobError } from '../errors';
import type { Logger } from '../log';
import type { Enqueue } from '../queues';
import { scanDueSchedules } from '../scan';

export interface Services {
  pool: Pool;
  api: ApiClient;
  log: Logger;
  enqueue: Enqueue;
  cache: CacheInvalidator;
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
