import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { silentLogger } from './log';
import type { JobRequest } from './queues';
import { scanDueSchedules } from './scan';
import { createTestDb } from './test-support';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('schedule scan (database)', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  let newsId: string;
  beforeAll(async () => {
    db = await createTestDb(adminUrl!);
    newsId = (await db.pool.query(`INSERT INTO news (canonical_key) VALUES ('s') RETURNING id`)).rows[0].id;
  });
  afterAll(() => db?.drop());

  const schedule = async (when: string, status = 'pending') =>
    (await db.pool.query(
      `INSERT INTO publishing_schedule (news_id, scheduled_for, time_zone, idempotency_key, created_by, status)
       VALUES ($1, $2, 'UTC', gen_random_uuid()::text, 'u', $3) RETURNING id`, [newsId, when, status])).rows[0].id as string;

  it('queues only pending schedules that are due, once per window', async () => {
    const now = new Date('2026-10-21T10:00:00Z');
    const due = await schedule('2026-10-21T09:59:00Z');
    await schedule('2026-10-21T10:30:00Z');
    await schedule('2026-10-21T09:00:00Z', 'cancelled');
    await schedule('2026-10-21T09:00:00Z', 'published');

    const calls: JobRequest[] = [];
    const enqueue = async (r: JobRequest) => void calls.push(r);
    expect(await scanDueSchedules(db.pool, enqueue, silentLogger, now)).toBe(1);
    expect(calls).toEqual([{ type: 'news.publish_scheduled', payload: { scheduleId: due }, idempotencyKey: expect.stringMatching(new RegExp(`^publish:${due}:\\d+$`)) }]);

    await scanDueSchedules(db.pool, enqueue, silentLogger, new Date(now.getTime() + 60_000));
    expect(calls[1]!.idempotencyKey).toBe(calls[0]!.idempotencyKey);
    await scanDueSchedules(db.pool, enqueue, silentLogger, new Date(now.getTime() + 11 * 60_000));
    expect(calls[2]!.idempotencyKey).not.toBe(calls[0]!.idempotencyKey);
  });

  it('does nothing when nothing is due', async () => {
    await db.pool.query(`UPDATE publishing_schedule SET status = 'cancelled'`);
    const calls: JobRequest[] = [];
    expect(await scanDueSchedules(db.pool, async (r) => void calls.push(r), silentLogger, new Date('2030-01-01'))).toBe(0);
    expect(calls).toEqual([]);
  });
});
