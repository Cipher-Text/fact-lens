import type { Pool, PoolClient } from 'pg';

/**
 * Runs `work` at most once per key. The key is recorded in the same transaction as `work`, so a
 * failure rolls the record back and a retry runs again. Work with effects outside the database
 * can still repeat after a crash between the effect and the commit, so it must be safe to repeat.
 */
export async function runOnce(
  pool: Pool, key: string, jobType: string, work: (db: PoolClient) => Promise<void>,
): Promise<'done' | 'duplicate'> {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const claimed = await db.query('INSERT INTO processed_job (idempotency_key, job_type) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING 1', [key, jobType]);
    if (claimed.rowCount === 0) {
      await db.query('ROLLBACK');
      return 'duplicate';
    }
    await work(db);
    await db.query('COMMIT');
    return 'done';
  } catch (err) {
    try {
      await db.query('ROLLBACK');
    } catch {
      // keep the original error
    }
    throw err;
  } finally {
    db.release();
  }
}
