import { createServer, type Server } from 'node:http';
import type { Pool } from 'pg';
import { outboxStats } from './outbox/dispatcher';
import type { QueueRegistry } from './queues';

/** The dispatcher has not completed a pass for this long, so the worker is not moving outbox rows (ADR-053). */
export const DISPATCHER_STALE_MS = 60_000;

export function isDispatcherStale(lastPassAt: number, now: number = Date.now()): boolean {
  return now - lastPassAt > DISPATCHER_STALE_MS;
}

/** Queue depth, dead letters, outbox lag and dispatcher liveness in one place for probes and dashboards. */
export async function snapshot(pool: Pool, queues: QueueRegistry, lastPassAt: () => number, now: number = Date.now()) {
  const [outbox, counts] = await Promise.all([
    outboxStats(pool),
    Promise.all(queues.all().map(async ([name, q]) => [name, await q.getJobCounts('waiting', 'active', 'delayed', 'failed')] as const)),
  ]);
  const pass = lastPassAt();
  return {
    status: isDispatcherStale(pass, now) ? ('degraded' as const) : ('ok' as const),
    dispatcher: { secondsSincePass: Math.round((now - pass) / 1000) },
    outbox,
    queues: Object.fromEntries(counts),
  };
}

/** Listens on `host` (loopback by default): the endpoint shows queue depth and needs no sign-in, so it is not for the open network. */
export function startHealthServer(pool: Pool, queues: QueueRegistry, port: number, host: string, lastPassAt: () => number): Server {
  const server = createServer(async (req, res) => {
    if (req.method !== 'GET' || req.url?.split('?')[0] !== '/health') {
      res.writeHead(404).end();
      return;
    }
    try {
      const body = await snapshot(pool, queues, lastPassAt);
      res.writeHead(body.status === 'ok' ? 200 : 503, { 'content-type': 'application/json' }).end(JSON.stringify(body));
    } catch {
      res.writeHead(503, { 'content-type': 'application/json' }).end(JSON.stringify({ status: 'degraded' }));
    }
  });
  server.listen(port, host);
  return server;
}
