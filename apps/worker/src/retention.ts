import type { Pool } from 'pg';
import { errorFields, type Logger } from './log';

/** Dispatched outbox rows are kept this long, for inspection and replay (ADR-057). */
export const OUTBOX_RETENTION_DAYS = 7;
/** A finished job key is kept this long: a redelivery arrives far inside the retry window. */
export const PROCESSED_JOB_RETENTION_DAYS = 30;
export const PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000;
const BATCH = 1000;

async function deleteInBatches(pool: Pool, sql: string, days: number): Promise<number> {
  let total = 0;
  for (;;) {
    const { rowCount } = await pool.query(sql, [days, BATCH]);
    total += rowCount ?? 0;
    if (!rowCount || rowCount < BATCH) return total;
  }
}

/**
 * One pass. Parked outbox rows (kept for inspection) and unfinished claims (a job that is running or whose worker died)
 * are never deleted, whatever their age.
 */
export async function pruneOnce(pool: Pool): Promise<{ outbox: number; processedJobs: number }> {
  const outbox = await deleteInBatches(pool,
    `DELETE FROM outbox_event WHERE id IN (
       SELECT id FROM outbox_event
        WHERE dispatched_at IS NOT NULL AND dispatched_at < now() - make_interval(days => $1)
        ORDER BY id LIMIT $2)`,
    OUTBOX_RETENTION_DAYS);
  const processedJobs = await deleteInBatches(pool,
    `DELETE FROM processed_job WHERE idempotency_key IN (
       SELECT idempotency_key FROM processed_job
        WHERE finished_at IS NOT NULL AND finished_at < now() - make_interval(days => $1)
        LIMIT $2)`,
    PROCESSED_JOB_RETENTION_DAYS);
  return { outbox, processedJobs };
}

/** Runs a pass at start-up and then on an interval. A failed pass is logged and tried again at the next interval. */
export function startRetention(pool: Pool, log: Logger, intervalMs = PRUNE_INTERVAL_MS) {
  const run = async () => {
    try {
      const result = await pruneOnce(pool);
      if (result.outbox > 0 || result.processedJobs > 0) log.info('retention.pruned', result);
    } catch (err) {
      log.error('retention.failed', errorFields(err));
    }
  };
  const timer = setInterval(() => void run(), intervalMs);
  timer.unref();
  void run();
  return {
    stop() {
      clearInterval(timer);
    },
  };
}
