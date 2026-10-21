import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool } from 'pg';

/** A throwaway database migrated with the API's migrations (the API owns the schema). */
export async function createTestDb(adminUrl: string) {
  const name = `fl_worker_${randomBytes(4).toString('hex')}`;
  const admin = new Pool({ connectionString: adminUrl });
  admin.on('error', () => {});
  await admin.query(`CREATE DATABASE ${name}`);
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  const { runner } = await import('node-pg-migrate');
  await runner({
    databaseUrl: url.toString(), dir: resolve(__dirname, '../../api/migrations'), direction: 'up',
    migrationsTable: 'pgmigrations', log: () => {},
  });
  const pool = new Pool({ connectionString: url.toString() });
  pool.on('error', () => {});
  return {
    pool,
    async drop() {
      await pool.end();
      await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await admin.end();
    },
  };
}

export async function until<T>(check: () => Promise<T | false | undefined> | T | false | undefined, ms = 8000, step = 50): Promise<T> {
  const end = Date.now() + ms;
  for (;;) {
    const v = await check();
    if (v) return v;
    if (Date.now() > end) throw new Error('timed out waiting for condition');
    await new Promise((r) => setTimeout(r, step));
  }
}
