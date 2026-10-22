import type { Pool } from 'pg';
import type { Logger } from './log';
import type { Enqueue } from './queues';

const RETRY_WINDOW_MS = 10 * 60 * 1000;

/**
 * Queues a publish job for every pending schedule that is due. The job id carries a ten-minute
 * window: queued again each window while the schedule stays pending (so a job that exhausted its
 * retries is not stuck behind its own failed record), but never twice within one. The API is
 * what makes publishing idempotent; this only avoids piling up duplicates.
 */
export async function scanDueSchedules(pool: Pool, enqueue: Enqueue, log: Logger, now: Date = new Date(), limit = 100): Promise<number> {
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM publishing_schedule WHERE status = 'pending' AND scheduled_for <= $1 ORDER BY scheduled_for LIMIT $2`,
    [now.toISOString(), limit],
  );
  const window = Math.floor(now.getTime() / RETRY_WINDOW_MS);
  for (const { id } of rows) {
    await enqueue({ type: 'news.publish_scheduled', payload: { scheduleId: id }, idempotencyKey: `publish:${id}:${window}` });
  }
  if (rows.length > 0) log.info('schedule.scan', { due: rows.length });
  return rows.length;
}
