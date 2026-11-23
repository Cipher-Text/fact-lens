import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pruneOnce } from './retention';
import { createTestDb } from './test-support';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('retention (database)', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  beforeAll(async () => {
    db = await createTestDb(adminUrl!);
  });
  afterAll(() => db?.drop());

  it('deletes only what is past its window, and never a parked row or an unfinished claim', async () => {
    const event = (created: string, dispatched: string | null, failed = false) =>
      db.pool.query(
        `INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type, payload, created_at, dispatched_at, failed_at)
         VALUES ('news', 'x', 'news.archived', '{}', now() - interval '${created}', ${dispatched ? `now() - interval '${dispatched}'` : 'NULL'}, ${failed ? 'now()' : 'NULL'})`);
    await event('9 days', '8 days');                // expired: dispatched 8 days ago
    await event('2 days', '1 day');                 // kept: within the window
    await event('9 days', null, true);              // kept: parked, for inspection
    const job = (claimed: string, finished: string | null, key: string) =>
      db.pool.query(
        `INSERT INTO processed_job (idempotency_key, job_type, claimed_at, finished_at)
         VALUES ($1, 't', now() - interval '${claimed}', ${finished ? `now() - interval '${finished}'` : 'NULL'})`, [key]);
    await job('31 days', '31 days', 'old-finished');   // expired
    await job('29 days', '29 days', 'recent-finished'); // kept
    await job('31 days', null, 'old-unfinished');       // kept: its worker may still be alive

    expect(await pruneOnce(db.pool)).toEqual({ outbox: 1, processedJobs: 1 });
    expect((await db.pool.query('SELECT count(*)::int AS n FROM outbox_event')).rows[0].n).toBe(2);
    const keys = (await db.pool.query('SELECT idempotency_key FROM processed_job ORDER BY 1')).rows.map((r) => r.idempotency_key);
    expect(keys).toEqual(['old-unfinished', 'recent-finished']);
  });
});
