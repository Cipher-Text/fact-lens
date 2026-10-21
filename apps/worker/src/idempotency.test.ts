import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runOnce } from './idempotency';
import { createTestDb } from './test-support';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('runOnce (database)', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  beforeAll(async () => {
    db = await createTestDb(adminUrl!);
  });
  afterAll(() => db?.drop());

  it('runs the work once per key and skips repeats', async () => {
    let runs = 0;
    const work = async () => void runs++;
    expect(await runOnce(db.pool, 'k1', 'cache.invalidate', work)).toBe('done');
    expect(await runOnce(db.pool, 'k1', 'cache.invalidate', work)).toBe('duplicate');
    expect(await runOnce(db.pool, 'k2', 'cache.invalidate', work)).toBe('done');
    expect(runs).toBe(2);
  });

  it('forgets the key when the work fails, so a retry runs again', async () => {
    await expect(runOnce(db.pool, 'k3', 't', async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect((await db.pool.query(`SELECT 1 FROM processed_job WHERE idempotency_key = 'k3'`)).rowCount).toBe(0);
    expect(await runOnce(db.pool, 'k3', 't', async () => {})).toBe('done');
  });

  it('lets only one of several concurrent deliveries run', async () => {
    let runs = 0;
    const work = async () => {
      runs++;
      await new Promise((r) => setTimeout(r, 30));
    };
    const outcomes = await Promise.all([1, 2, 3, 4].map(() => runOnce(db.pool, 'k4', 't', work)));
    expect(outcomes.filter((o) => o === 'done')).toHaveLength(1);
    expect(runs).toBe(1);
  });

  it('keeps work and key in one transaction', async () => {
    await expect(
      runOnce(db.pool, 'k5', 't', async (c) => {
        await c.query(`INSERT INTO desk (key, name) VALUES ('tx-desk', 'x')`);
        throw new Error('late failure');
      }),
    ).rejects.toThrow();
    expect((await db.pool.query(`SELECT 1 FROM desk WHERE key = 'tx-desk'`)).rowCount).toBe(0);
  });
});
