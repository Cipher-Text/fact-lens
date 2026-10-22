import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { ScheduledPublishResult } from '@fact-lens/contracts';
import type { Worker } from 'bullmq';
import { PermanentJobError } from './errors';
import { silentLogger } from './log';
import { dispatchOnce } from './outbox/dispatcher';
import type { ApiClient } from './api-client';
import type { CacheInvalidator, Services } from './processors';
import { QueueRegistry } from './queues';
import { redisOptionsFromUrl } from './redis';
import { startWorkers } from './runtime';
import { scanDueSchedules } from './scan';
import { createTestDb, until } from './test-support';

const adminUrl = process.env.TEST_DATABASE_URL;
const redisUrl = process.env.TEST_REDIS_URL;
const id = '0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11';

describe.skipIf(!adminUrl || !redisUrl)('workers with Redis and PostgreSQL', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  let queues: QueueRegistry;
  let workers: Worker[];
  let invalidated: string[][];
  let published: string[];
  let cacheFailures: number;
  let apiResult: ScheduledPublishResult;

  const cache: CacheInvalidator = {
    async invalidate(tags) {
      if (cacheFailures > 0) {
        cacheFailures--;
        throw new Error('cache purge unavailable');
      }
      invalidated.push(tags);
    },
  };
  type PublishApi = Pick<ApiClient, 'publishSchedule'>;
  const defaultApi: PublishApi = {
    async publishSchedule(scheduleId) {
      published.push(scheduleId);
      return apiResult;
    },
  };
  let apiImpl: PublishApi = defaultApi;
  const api: ApiClient = {
    publishSchedule: (scheduleId) => apiImpl.publishSchedule(scheduleId),
    ingestFeed: async () => ({ inserted: 0, duplicates: 0, skipped: 0 }),
  };

  beforeAll(async () => {
    db = await createTestDb(adminUrl!);
  });
  afterAll(async () => {
    await db?.drop();
  });

  beforeEach(async () => {
    invalidated = [];
    published = [];
    cacheFailures = 0;
    apiResult = { result: 'published', newsId: id };
    apiImpl = defaultApi;
    queues = new QueueRegistry(redisOptionsFromUrl(redisUrl!), `t${randomBytes(4).toString('hex')}`);
    const services: Services = { pool: db.pool, api, log: silentLogger, enqueue: queues.enqueue, cache, feeds: async () => { throw new Error('feeds are not used here'); } };
    workers = startWorkers(services, { connection: queues.connection, prefix: queues.prefix, concurrency: 3 });
    await Promise.all(workers.map((w) => w.waitUntilReady()));
    return async () => {
      await Promise.all(workers.map((w) => w.close(true)));
      for (const [, q] of queues.all()) await q.obliterate({ force: true }).catch(() => {});
      await queues.close();
    };
  });

  const outboxRow = async (type: string, payload: unknown) =>
    (await db.pool.query<{ id: string }>(
      `INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type, payload) VALUES ('news', 'x', $1, $2) RETURNING id::text`,
      [type, JSON.stringify(payload)])).rows[0]!.id;
  const receipts = async (key: string) => (await db.pool.query('SELECT 1 FROM processed_job WHERE idempotency_key = $1', [key])).rowCount;

  it('carries an outbox row through BullMQ to its handlers', async () => {
    const eventId = await outboxRow('news.published', { newsId: id, revisionId: id, locales: [{ locale: 'en', slug: 'a' }] });
    expect((await dispatchOnce(db.pool, queues.enqueue, silentLogger)).dispatched).toBe(1);

    await until(() => invalidated.length === 1);
    expect(invalidated[0]).toEqual([`news:${id}`, 'locale:en', 'home']);
    await until(async () => (await receipts(`outbox:${eventId}:search.index`)) === 1);
    expect(await receipts(`outbox:${eventId}:cache.invalidate`)).toBe(1);
  });

  it('queues a job once per idempotency key, and runs a redelivered one once', async () => {
    const request = { type: 'cache.invalidate' as const, payload: { tags: ['a'] }, idempotencyKey: 'dup-key' };
    await Promise.all([queues.enqueue(request), queues.enqueue(request), queues.enqueue(request)]);
    await until(() => invalidated.length >= 1);
    await new Promise((r) => setTimeout(r, 300));
    expect(invalidated).toEqual([['a']]);

    // Same operation under a different job id (as if Redis had been flushed): the receipt still stops it.
    await queues.enqueue({ ...request, idempotencyKey: 'dup-key' });
    const counts = await queues.queue('cache').getJobCounts('completed', 'failed');
    expect(counts.failed).toBe(0);
    expect(invalidated).toHaveLength(1);
  });

  it('retries a transient failure with backoff and records the receipt only on success', async () => {
    cacheFailures = 1;
    await queues.enqueue({ type: 'cache.invalidate', payload: { tags: ['retry'] }, idempotencyKey: 'retry-key' });
    await until(async () => (await queues.queue('cache').getJobCounts('delayed')).delayed === 1 || invalidated.length === 1);
    expect(await receipts('retry-key')).toBe(0);
    await until(() => invalidated.length === 1, 10_000);
    expect(invalidated).toEqual([['retry']]);
    await until(async () => (await receipts('retry-key')) === 1);
  });

  it('fails a permanent error at once and keeps the failed job for inspection', async () => {
    await queues.enqueue({ type: 'media.variant', payload: { mediaAssetId: id }, idempotencyKey: 'media-1' });
    const job = await until(async () => {
      const failed = await queues.queue('media').getFailed();
      return failed[0];
    });
    expect(job.attemptsMade).toBe(1);
    expect(job.failedReason).toContain('not implemented');
  });

  it('rejects a job whose envelope or payload is malformed without retrying', async () => {
    await queues.queue('cache').add('cache.invalidate', { nonsense: true }, { jobId: 'bad-envelope', attempts: 5 });
    await queues.queue('cache').add(
      'cache.invalidate',
      { id, type: 'cache.invalidate', version: 1, idempotencyKey: 'bad-payload', occurredAt: new Date().toISOString(), payload: { tags: [] } },
      { jobId: 'bad-payload', attempts: 5 },
    );
    const failed = await until(async () => {
      const f = await queues.queue('cache').getFailed();
      return f.length === 2 ? f : false;
    });
    expect(failed.map((j) => j.attemptsMade)).toEqual([1, 1]);
    expect(invalidated).toEqual([]);
  });

  it('turns a due schedule into one API call and logs the outcome', async () => {
    const newsId = (await db.pool.query(`INSERT INTO news (canonical_key) VALUES ('sched-news') RETURNING id`)).rows[0].id;
    const scheduleId = (await db.pool.query(
      `INSERT INTO publishing_schedule (news_id, scheduled_for, time_zone, idempotency_key, created_by)
       VALUES ($1, now() - interval '1 minute', 'UTC', gen_random_uuid()::text, 'u') RETURNING id`, [newsId])).rows[0].id as string;

    await scanDueSchedules(db.pool, queues.enqueue, silentLogger);
    await scanDueSchedules(db.pool, queues.enqueue, silentLogger);
    await until(() => published.length >= 1);
    await new Promise((r) => setTimeout(r, 300));
    expect(published).toEqual([scheduleId]);
    await db.pool.query(`UPDATE publishing_schedule SET status = 'cancelled' WHERE id = $1`, [scheduleId]);
  });

  it('retries the publish call while the API is unavailable', async () => {
    let calls = 0;
    apiImpl = {
      async publishSchedule() {
        calls++;
        if (calls === 1) throw new Error('API answered 503');
        return { result: 'published', newsId: id };
      },
    };
    await queues.enqueue({ type: 'news.publish_scheduled', payload: { scheduleId: id }, idempotencyKey: 'publish:flaky:1' });
    await until(() => calls >= 2, 12_000);
    expect(calls).toBe(2);
    expect((await queues.queue('publish').getFailed()).length).toBe(0);
  }, 20_000);

  it('stops retrying the publish call when the API response can never succeed', async () => {
    let calls = 0;
    apiImpl = {
      async publishSchedule() {
        calls++;
        throw new PermanentJobError('The API rejected the internal token');
      },
    };
    await queues.enqueue({ type: 'news.publish_scheduled', payload: { scheduleId: id }, idempotencyKey: 'publish:wrong:1' });
    const failed = await until(async () => (await queues.queue('publish').getFailed())[0]);
    expect(failed.attemptsMade).toBe(1);
    expect(calls).toBe(1);
  });
});
