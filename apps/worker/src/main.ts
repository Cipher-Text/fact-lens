import { loadWorkerEnv } from '@fact-lens/config';
import { Pool } from 'pg';
import { createApiClient } from './api-client';
import { startHealthServer } from './health';
import { createLogger, errorFields } from './log';
import { startDispatcher } from './outbox/dispatcher';
import { loggingCacheInvalidator } from './processors';
import { createFeedFetcher } from './feeds/safe-fetch';
import { QueueRegistry } from './queues';
import { redisOptionsFromUrl } from './redis';
import { startWorkers } from './runtime';

async function main() {
  const env = loadWorkerEnv();
  const log = createLogger(env.LOG_LEVEL);
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  pool.on('error', (err) => log.error('db.pool_error', errorFields(err)));

  const connection = redisOptionsFromUrl(env.REDIS_URL);
  const queues = new QueueRegistry(connection);
  const services = {
    pool, log, enqueue: queues.enqueue, cache: loggingCacheInvalidator(log),
    api: createApiClient(env.API_BASE_URL, env.INTERNAL_API_TOKEN),
    feeds: createFeedFetcher({ allowPrivate: env.FEED_ALLOW_PRIVATE_HOSTS }),
  };

  const workers = startWorkers(services, { connection, prefix: queues.prefix, concurrency: env.JOB_CONCURRENCY });
  const dispatcher = startDispatcher(pool, queues.enqueue, log, env.OUTBOX_POLL_MS);
  // One repeatable scheduler in Redis, so several worker instances never scan twice per tick.
  await queues.queue('maintenance').upsertJobScheduler(
    'schedule-scan', { every: env.SCHEDULE_SCAN_MS },
    { name: 'schedule.scan', data: { id: crypto.randomUUID(), type: 'schedule.scan', version: 1, idempotencyKey: 'schedule.scan', occurredAt: new Date().toISOString(), payload: {} } },
  );
  await queues.queue('maintenance').upsertJobScheduler(
    'feed-scan', { every: env.FEED_SCAN_MS },
    { name: 'feed.scan', data: { id: crypto.randomUUID(), type: 'feed.scan', version: 1, idempotencyKey: 'feed.scan', occurredAt: new Date().toISOString(), payload: {} } },
  );
  await queues.queue('maintenance').upsertJobScheduler(
    'analytics-rollup', { every: env.ANALYTICS_ROLLUP_MS },
    { name: 'analytics.rollup', data: { id: crypto.randomUUID(), type: 'analytics.rollup', version: 1, idempotencyKey: 'analytics.rollup', occurredAt: new Date().toISOString(), payload: {} } },
  );
  const health = startHealthServer(pool, queues, env.WORKER_HEALTH_PORT);
  log.info('worker.started', { queues: workers.map((w) => w.name), healthPort: env.WORKER_HEALTH_PORT });

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    log.info('worker.stopping', { signal });
    health.close();
    await dispatcher.stop();
    await Promise.all(workers.map((w) => w.close()));
    await queues.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
