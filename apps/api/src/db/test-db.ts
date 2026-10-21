import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool } from 'pg';

/** Creates a throwaway migrated database on the server named by TEST_DATABASE_URL. */
export async function createTestDatabase(adminUrl: string) {
  const name = `fl_test_${randomBytes(4).toString('hex')}`;
  const admin = new Pool({ connectionString: adminUrl });
  await admin.query(`CREATE DATABASE ${name}`);
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  const { runner } = await import('node-pg-migrate');
  await runner({
    databaseUrl: url.toString(),
    dir: resolve(__dirname, '../../migrations'),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    log: () => {},
  });
  const pool = new Pool({ connectionString: url.toString() });
  return {
    pool,
    async drop() {
      await pool.end();
      await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await admin.end();
    },
  };
}
