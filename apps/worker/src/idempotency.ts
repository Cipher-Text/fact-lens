import type { Pool } from 'pg';

/** How long a claim may stand before its worker counts as dead and the job is claimed again. */
export const CLAIM_LEASE_SECONDS = 600;

/** The job is running in another worker right now. The queue should retry it later; it is neither done nor a duplicate. */
export class JobBusyError extends Error {
  constructor(key: string) {
    super(`job ${key} is running in another worker`);
    this.name = 'JobBusyError';
  }
}

/**
 * Runs `work` at most once per key, and holds no database connection while it runs. The key is claimed and committed
 * first, the work runs, then the key is marked finished. A failed work releases its claim, so a retry runs again. A
 * worker that dies mid-work leaves its claim, and the job runs again once that claim is older than the lease. So `work`
 * must be safe to repeat (ADR-056).
 */
export async function runOnce(
  pool: Pool, key: string, jobType: string, work: () => Promise<void>, leaseSeconds = CLAIM_LEASE_SECONDS,
): Promise<'done' | 'duplicate'> {
  const claimed = await pool.query(
    `INSERT INTO processed_job (idempotency_key, job_type, claimed_at) VALUES ($1, $2, now())
     ON CONFLICT (idempotency_key) DO UPDATE SET claimed_at = now(), job_type = EXCLUDED.job_type
       WHERE processed_job.finished_at IS NULL AND processed_job.claimed_at < now() - make_interval(secs => $3)
     RETURNING 1`,
    [key, jobType, leaseSeconds],
  );
  if (claimed.rowCount === 0) {
    const row = await pool.query<{ finished: boolean }>(
      'SELECT finished_at IS NOT NULL AS finished FROM processed_job WHERE idempotency_key = $1', [key]);
    if (row.rows[0]?.finished) return 'duplicate';
    throw new JobBusyError(key);
  }
  try {
    await work();
  } catch (err) {
    // Release the claim so the retry runs. If that fails, the lease releases it later; the original error is what matters.
    await pool.query('DELETE FROM processed_job WHERE idempotency_key = $1 AND finished_at IS NULL', [key]).catch(() => undefined);
    throw err;
  }
  await pool.query('UPDATE processed_job SET finished_at = now() WHERE idempotency_key = $1', [key]);
  return 'done';
}
