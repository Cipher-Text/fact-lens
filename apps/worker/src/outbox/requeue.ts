// Puts parked outbox rows back in the queue once the cause is fixed.
//   pnpm --filter @fact-lens/worker outbox:requeue              every parked row
//   pnpm --filter @fact-lens/worker outbox:requeue 12 15 19     only these outbox ids
import { loadWorkerEnv } from '@fact-lens/config';
import { Pool } from 'pg';
import { requeueParked } from './dispatcher';

async function main() {
  const ids = process.argv.slice(2);
  if (ids.some((id) => !/^\d+$/.test(id))) throw new Error('The arguments are outbox row ids (numbers).');
  const env = loadWorkerEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
  try {
    const count = await requeueParked(pool, ids.length ? ids : undefined);
    console.log(`requeued ${count} parked outbox row(s)`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
