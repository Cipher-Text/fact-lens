import type { Pool, PoolClient } from 'pg';

/**
 * Runs `work` in one transaction: commit on success, rollback on any error.
 * Write the change, its audit event and its outbox event inside the same call
 * so they commit or roll back together.
 */
export async function withTransaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The original error is the one worth reporting.
    }
    throw err;
  } finally {
    client.release();
  }
}
