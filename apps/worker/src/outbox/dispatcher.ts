import type { Pool } from 'pg';
import { errorFields, type Logger } from '../log';
import type { Enqueue } from '../queues';
import { planJobs, UnroutableEventError } from './routes';

export interface DispatchOptions {
  batchSize: number;
  leaseSeconds: number;
  /** Tries before a row is parked in the dead-letter set. */
  maxAttempts: number;
  /** Retry delay for a row's nth failed try, in seconds. */
  backoffSeconds: (attempt: number) => number;
}

export const defaultDispatchOptions: DispatchOptions = {
  batchSize: 50,
  leaseSeconds: 60,
  maxAttempts: 8,
  // 2s, 4s, 8s ... capped at 5 minutes, with up to 50% jitter.
  backoffSeconds: (attempt) => Math.min(300, 2 ** attempt) * (0.5 + Math.random() * 0.5),
};

export interface DispatchResult {
  claimed: number;
  dispatched: number;
  retried: number;
  parked: number;
}

interface Claimed {
  id: string;
  event_type: string;
  aggregate_id: string;
  payload: unknown;
  attempts: number;
}

/**
 * One pass: lease a batch of due rows (SKIP LOCKED, so several workers never take the same
 * row), turn each into jobs, then mark it dispatched, schedule a retry, or park it.
 * Jobs carry the outbox id in their idempotency key, so a row delivered twice queues once.
 */
export async function dispatchOnce(pool: Pool, enqueue: Enqueue, log: Logger, opts: DispatchOptions = defaultDispatchOptions): Promise<DispatchResult> {
  const claimed = await pool.query<Claimed>(
    `WITH due AS (
       SELECT id FROM outbox_event
        WHERE dispatched_at IS NULL AND failed_at IS NULL AND available_at <= now()
          AND (lease_until IS NULL OR lease_until < now())
        ORDER BY id LIMIT $1 FOR UPDATE SKIP LOCKED)
     UPDATE outbox_event o
        SET lease_until = now() + make_interval(secs => $2), attempts = o.attempts + 1
       FROM due WHERE o.id = due.id
     RETURNING o.id::text, o.event_type, o.aggregate_id, o.payload, o.attempts`,
    [opts.batchSize, opts.leaseSeconds],
  );
  const result: DispatchResult = { claimed: claimed.rowCount ?? 0, dispatched: 0, retried: 0, parked: 0 };

  for (const row of claimed.rows.sort((a, b) => Number(a.id) - Number(b.id))) {
    try {
      const jobs = planJobs(row.event_type, row.payload);
      for (const j of jobs) {
        await enqueue({ type: j.type, payload: j.payload, idempotencyKey: `outbox:${row.id}:${j.type}`, outboxEventId: Number(row.id) });
      }
      await pool.query('UPDATE outbox_event SET dispatched_at = now(), lease_until = NULL, last_error = NULL WHERE id = $1', [row.id]);
      result.dispatched++;
      log.debug('outbox.dispatched', { outboxEventId: Number(row.id), eventType: row.event_type, jobs: jobs.map((j) => j.type) });
    } catch (err) {
      const message = (err instanceof Error ? err.message : String(err)).slice(0, 1000);
      if (err instanceof UnroutableEventError || row.attempts >= opts.maxAttempts) {
        await pool.query('UPDATE outbox_event SET failed_at = now(), lease_until = NULL, last_error = $2 WHERE id = $1', [row.id, message]);
        result.parked++;
        log.error('outbox.parked', { outboxEventId: Number(row.id), eventType: row.event_type, attempts: row.attempts, ...errorFields(err) });
      } else {
        await pool.query(
          `UPDATE outbox_event SET lease_until = NULL, last_error = $2, available_at = now() + make_interval(secs => $3) WHERE id = $1`,
          [row.id, message, opts.backoffSeconds(row.attempts)],
        );
        result.retried++;
        log.warn('outbox.retry', { outboxEventId: Number(row.id), eventType: row.event_type, attempts: row.attempts, ...errorFields(err) });
      }
    }
  }
  return result;
}

export interface OutboxStats {
  pending: number;
  parked: number;
  oldestPendingSeconds: number | null;
}

/** Backlog numbers for health checks and alerts: pending depth, dead-letter size, and lag. */
export async function outboxStats(pool: Pool): Promise<OutboxStats> {
  const { rows } = await pool.query<{ pending: number; parked: number; oldest: number | null }>(
    `SELECT count(*) FILTER (WHERE dispatched_at IS NULL AND failed_at IS NULL)::int AS pending,
            count(*) FILTER (WHERE failed_at IS NOT NULL)::int AS parked,
            EXTRACT(EPOCH FROM now() - min(created_at) FILTER (WHERE dispatched_at IS NULL AND failed_at IS NULL))::float AS oldest
       FROM outbox_event`,
  );
  const r = rows[0]!;
  return { pending: r.pending, parked: r.parked, oldestPendingSeconds: r.oldest };
}

/** Polls until stopped. Draining a full batch loops again at once instead of sleeping. */
export function startDispatcher(pool: Pool, enqueue: Enqueue, log: Logger, pollMs: number, opts: DispatchOptions = defaultDispatchOptions) {
  let stopped = false;
  let wake: (() => void) | undefined;
  const done = (async () => {
    while (!stopped) {
      let again = false;
      try {
        const r = await dispatchOnce(pool, enqueue, log, opts);
        again = r.claimed >= opts.batchSize;
      } catch (err) {
        log.error('outbox.pass_failed', errorFields(err));
      }
      if (!again && !stopped) await new Promise<void>((resolve) => { wake = resolve; setTimeout(resolve, pollMs).unref(); });
    }
  })();
  return {
    async stop() {
      stopped = true;
      wake?.();
      await done;
    },
  };
}
