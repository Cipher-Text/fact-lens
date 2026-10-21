import { createServer, type Server } from 'node:http';
import type { Pool } from 'pg';
import { outboxStats } from './outbox/dispatcher';
import type { QueueRegistry } from './queues';

/** Queue depth, dead letters and outbox lag in one place for probes and dashboards. */
export async function snapshot(pool: Pool, queues: QueueRegistry) {
  const [outbox, counts] = await Promise.all([
    outboxStats(pool),
    Promise.all(queues.all().map(async ([name, q]) => [name, await q.getJobCounts('waiting', 'active', 'delayed', 'failed')] as const)),
  ]);
  return { status: 'ok' as const, outbox, queues: Object.fromEntries(counts) };
}

export function startHealthServer(pool: Pool, queues: QueueRegistry, port: number): Server {
  const server = createServer(async (req, res) => {
    if (req.method !== 'GET' || req.url?.split('?')[0] !== '/health') {
      res.writeHead(404).end();
      return;
    }
    try {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(await snapshot(pool, queues)));
    } catch {
      res.writeHead(503, { 'content-type': 'application/json' }).end(JSON.stringify({ status: 'degraded' }));
    }
  });
  server.listen(port);
  return server;
}
