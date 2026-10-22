import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { outboxEventSchemas, outboxEventTypes } from '@fact-lens/contracts';
import { silentLogger } from '../log';
import type { JobRequest } from '../queues';
import { createTestDb } from '../test-support';
import { defaultDispatchOptions, dispatchOnce, outboxStats, type DispatchOptions } from './dispatcher';
import { planJobs, UnroutableEventError } from './routes';

const adminUrl = process.env.TEST_DATABASE_URL;
const id = '0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11';
const published = (newsId = id) => ({ newsId, revisionId: id, locales: [{ locale: 'en', slug: 'a' }, { locale: 'bn-BD', slug: 'খ' }] });

describe('event routes', () => {
  it('route every outbox event type the API can write', () => {
    const samples: Record<string, unknown> = {
      'news.published': published(),
      'news.archived': { newsId: id },
      'news.schedule_failed': { newsId: id, scheduleId: id, reason: 'x' },
      'config.flag_changed': { key: 'ads.serving', enabled: true },
    };
    expect(Object.keys(samples).sort()).toEqual([...outboxEventTypes].sort());
    for (const type of outboxEventTypes) {
      expect(outboxEventSchemas[type].safeParse(samples[type]).success).toBe(true);
      expect(planJobs(type, samples[type]).length).toBeGreaterThan(0);
    }
  });

  it('fans a publication out to cache and search, and rejects unknown or malformed events', () => {
    const jobs = planJobs('news.published', published());
    expect(jobs.map((j) => j.type)).toEqual(['cache.invalidate', 'search.index']);
    expect(jobs[0]!.payload).toEqual({ tags: [`news:${id}`, 'locale:en', 'locale:bn-BD', 'home'] });
    expect(() => planJobs('news.exploded', {})).toThrow(UnroutableEventError);
    expect(() => planJobs('news.published', { newsId: 'nope' })).toThrow(UnroutableEventError);
  });
});

describe.skipIf(!adminUrl)('outbox dispatcher (database)', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  const fast: DispatchOptions = { ...defaultDispatchOptions, backoffSeconds: () => 0 };

  beforeAll(async () => {
    db = await createTestDb(adminUrl!);
  });
  afterAll(() => db?.drop());

  const insert = async (type: string, payload: unknown = { newsId: id }) =>
    (await db.pool.query<{ id: string }>(
      `INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type, payload) VALUES ('news', 'x', $1, $2) RETURNING id::text`,
      [type, JSON.stringify(payload)])).rows[0]!.id;
  const row = async (eventId: string) =>
    (await db.pool.query(`SELECT * FROM outbox_event WHERE id = $1`, [eventId])).rows[0];
  const recorder = () => {
    const calls: JobRequest[] = [];
    return { calls, enqueue: async (r: JobRequest) => void calls.push(r) };
  };

  it('turns a row into jobs keyed by the outbox id and marks it dispatched', async () => {
    const eventId = await insert('news.published', published());
    const { calls, enqueue } = recorder();
    const result = await dispatchOnce(db.pool, enqueue, silentLogger);
    expect(result).toMatchObject({ claimed: 1, dispatched: 1, retried: 0, parked: 0 });
    expect(calls.map((c) => c.idempotencyKey)).toEqual([`outbox:${eventId}:cache.invalidate`, `outbox:${eventId}:search.index`]);
    expect(await row(eventId)).toMatchObject({ lease_until: null, last_error: null, attempts: 1 });
    expect((await row(eventId)).dispatched_at).toBeTruthy();
    expect((await dispatchOnce(db.pool, enqueue, silentLogger)).claimed).toBe(0);
  });

  it('retries a failed enqueue later with the same keys', async () => {
    const eventId = await insert('news.archived');
    let fail = true;
    const calls: JobRequest[] = [];
    const enqueue = async (r: JobRequest) => {
      if (fail) throw new Error('redis is down');
      calls.push(r);
    };
    const first = await dispatchOnce(db.pool, enqueue, silentLogger, { ...defaultDispatchOptions, backoffSeconds: () => 3600 });
    expect(first).toMatchObject({ retried: 1, dispatched: 0 });
    const after = await row(eventId);
    expect(after).toMatchObject({ attempts: 1, last_error: 'redis is down', lease_until: null, dispatched_at: null, failed_at: null });
    expect(after.available_at.getTime()).toBeGreaterThan(Date.now() + 3000_000);
    expect((await dispatchOnce(db.pool, enqueue, silentLogger)).claimed).toBe(0);

    fail = false;
    await db.pool.query('UPDATE outbox_event SET available_at = now() WHERE id = $1', [eventId]);
    expect((await dispatchOnce(db.pool, enqueue, silentLogger)).dispatched).toBe(1);
    expect(calls.map((c) => c.idempotencyKey)).toEqual([`outbox:${eventId}:cache.invalidate`, `outbox:${eventId}:search.index`]);
    expect(await row(eventId)).toMatchObject({ attempts: 2, last_error: null });
  });

  it('parks a row after the maximum attempts and keeps it for inspection', async () => {
    const eventId = await insert('news.archived');
    const enqueue = async () => {
      throw new Error('still down');
    };
    const opts = { ...fast, maxAttempts: 2 };
    expect((await dispatchOnce(db.pool, enqueue, silentLogger, opts)).retried).toBe(1);
    expect((await dispatchOnce(db.pool, enqueue, silentLogger, opts)).parked).toBe(1);
    const parked = await row(eventId);
    expect(parked.failed_at).toBeTruthy();
    expect(parked).toMatchObject({ attempts: 2, last_error: 'still down', dispatched_at: null });
    expect((await dispatchOnce(db.pool, enqueue, silentLogger, opts)).claimed).toBe(0);
    expect((await outboxStats(db.pool)).parked).toBeGreaterThanOrEqual(1);
  });

  it('parks an unknown event type or a malformed payload at once, without enqueuing', async () => {
    const unknown = await insert('news.exploded', {});
    const bad = await insert('news.published', { newsId: 'nope' });
    const { calls, enqueue } = recorder();
    const result = await dispatchOnce(db.pool, enqueue, silentLogger);
    expect(result).toMatchObject({ parked: 2, retried: 0 });
    expect(calls).toEqual([]);
    expect((await row(unknown)).last_error).toContain('No route');
    expect((await row(bad)).last_error).toContain('Invalid payload');
  });

  it('never hands one row to two dispatchers at the same time', async () => {
    const ids = await Promise.all(Array.from({ length: 30 }, () => insert('news.archived')));
    const seen = new Map<string, number>();
    const enqueue = async (r: JobRequest) => {
      await new Promise((res) => setTimeout(res, 5));
      seen.set(r.idempotencyKey, (seen.get(r.idempotencyKey) ?? 0) + 1);
    };
    const small = { ...fast, batchSize: 10 };
    const results = await Promise.all([1, 2, 3].map(() => dispatchOnce(db.pool, enqueue, silentLogger, small)));
    expect(results.reduce((n, r) => n + r.claimed, 0)).toBe(30);
    expect(seen.size).toBe(60);
    expect([...seen.values()].every((n) => n === 1)).toBe(true);
    for (const eventId of ids) expect((await row(eventId)).dispatched_at).toBeTruthy();
  });

  it('reclaims a row whose lease expired, but not one still leased', async () => {
    const stuck = await insert('news.archived');
    const live = await insert('news.archived');
    await db.pool.query(`UPDATE outbox_event SET lease_until = now() - interval '1 minute', attempts = 1 WHERE id = $1`, [stuck]);
    await db.pool.query(`UPDATE outbox_event SET lease_until = now() + interval '1 minute', attempts = 1 WHERE id = $1`, [live]);
    const { calls, enqueue } = recorder();
    const result = await dispatchOnce(db.pool, enqueue, silentLogger);
    expect(result.claimed).toBe(1);
    expect(calls.every((c) => c.outboxEventId === Number(stuck))).toBe(true);
    expect((await row(stuck)).attempts).toBe(2);
    expect((await row(live)).dispatched_at).toBeNull();
  });

  it('reports pending depth, dead letters and lag', async () => {
    await db.pool.query(`DELETE FROM outbox_event WHERE dispatched_at IS NOT NULL`);
    const eventId = await insert('news.archived');
    await db.pool.query(`UPDATE outbox_event SET created_at = now() - interval '90 seconds' WHERE id = $1`, [eventId]);
    const stats = await outboxStats(db.pool);
    expect(stats.pending).toBeGreaterThanOrEqual(1);
    expect(stats.oldestPendingSeconds).toBeGreaterThanOrEqual(89);
  });
});
