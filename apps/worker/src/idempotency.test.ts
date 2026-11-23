import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JobBusyError, runOnce } from './idempotency';
import { createTestDb } from './test-support';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('runOnce (database)', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  beforeAll(async () => {
    db = await createTestDb(adminUrl!);
  });
  afterAll(() => db?.drop());

  const claimOf = async (key: string) =>
    (await db.pool.query(`SELECT 1 FROM processed_job WHERE idempotency_key = $1`, [key])).rowCount;

  it('runs the work once per key and skips repeats', async () => {
    let runs = 0;
    const work = async () => void runs++;
    expect(await runOnce(db.pool, 'k1', 'cache.invalidate', work)).toBe('done');
    expect(await runOnce(db.pool, 'k1', 'cache.invalidate', work)).toBe('duplicate');
    expect(await runOnce(db.pool, 'k2', 'cache.invalidate', work)).toBe('done');
    expect(runs).toBe(2);
  });

  it('forgets the claim when the work fails, so a retry runs again', async () => {
    await expect(runOnce(db.pool, 'k3', 't', async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(await claimOf('k3')).toBe(0);
    expect(await runOnce(db.pool, 'k3', 't', async () => {})).toBe('done');
  });

  it('lets one of several concurrent deliveries run, and the rest are told to retry later', async () => {
    let runs = 0;
    const work = async () => {
      runs++;
      await new Promise((r) => setTimeout(r, 50));
    };
    const results = await Promise.allSettled([1, 2, 3, 4].map(() => runOnce(db.pool, 'k4', 't', work)));
    expect(results.filter((r) => r.status === 'fulfilled' && r.value === 'done')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected' && r.reason instanceof JobBusyError)).toHaveLength(3);
    expect(runs).toBe(1);
    expect(await runOnce(db.pool, 'k4', 't', work)).toBe('duplicate');
  });

  it('holds no connection while the work runs, so the work can use the pool', async () => {
    // With a pool of one connection, the work can only finish if runOnce has let go of its connection.
    const small = new Pool({ connectionString: db.url, max: 1 });
    try {
      const key = `pool-${randomUUID()}`;
      expect(await runOnce(small, key, 't', async () => {
        await small.query('SELECT 1');
      })).toBe('done');
    } finally {
      await small.end();
    }
  });

  it('runs a job again once its worker died and the claim is older than the lease', async () => {
    const key = `dead-${randomUUID()}`;
    await db.pool.query(`INSERT INTO processed_job (idempotency_key, job_type, claimed_at) VALUES ($1, 't', now() - interval '1 hour')`, [key]);
    let runs = 0;
    expect(await runOnce(db.pool, key, 't', async () => void runs++)).toBe('done');
    expect(runs).toBe(1);
  });

  it('waits, and does not run, while another worker holds a fresh claim', async () => {
    const key = `live-${randomUUID()}`;
    await db.pool.query(`INSERT INTO processed_job (idempotency_key, job_type, claimed_at) VALUES ($1, 't', now())`, [key]);
    let runs = 0;
    await expect(runOnce(db.pool, key, 't', async () => void runs++)).rejects.toBeInstanceOf(JobBusyError);
    expect(runs).toBe(0);
  });

  it('never runs a job that already finished, even after its lease', async () => {
    const key = `old-${randomUUID()}`;
    await db.pool.query(
      `INSERT INTO processed_job (idempotency_key, job_type, claimed_at, finished_at) VALUES ($1, 't', now() - interval '1 hour', now() - interval '1 hour')`, [key]);
    let runs = 0;
    expect(await runOnce(db.pool, key, 't', async () => void runs++)).toBe('duplicate');
    expect(runs).toBe(0);
  });
});
