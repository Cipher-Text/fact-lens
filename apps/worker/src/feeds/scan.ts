import type { Pool } from 'pg';
import type { Logger } from '../log';
import type { Enqueue } from '../queues';

const WINDOW_MS = 5 * 60 * 1000;

/**
 * Queues a fetch for every active feed that is due: never fetched, or last fetched longer ago than its
 * own interval. The job id carries a five-minute window, so a feed is queued at most once per window.
 */
export async function scanDueFeeds(pool: Pool, enqueue: Enqueue, log: Logger, now: Date = new Date(), limit = 50): Promise<number> {
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM feed
      WHERE active AND (last_fetched_at IS NULL OR last_fetched_at <= $1::timestamptz - poll_minutes * interval '1 minute')
      ORDER BY last_fetched_at NULLS FIRST LIMIT $2`,
    [now.toISOString(), limit],
  );
  const window = Math.floor(now.getTime() / WINDOW_MS);
  for (const { id } of rows) await enqueue({ type: 'feed.fetch', payload: { feedId: id }, idempotencyKey: `feed:${id}:${window}` });
  if (rows.length > 0) log.info('feed.scan', { due: rows.length });
  return rows.length;
}
