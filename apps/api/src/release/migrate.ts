import { resolve } from 'node:path';
import { loadDatabaseEnv } from '@fact-lens/config';
import { runner } from 'node-pg-migrate';

/**
 * The database release step (D5, docs/plans/deployment.md). It runs once per release, from the API's image, and the new
 * API starts only after it has exited 0:
 *
 *   docker run --rm -e DATABASE_URL=... <api image> node dist/release/migrate.js
 *
 * It applies the pending migrations in order and stops at the first failure, exiting 1, so a failed migration stops the
 * release. It reads DATABASE_URL and nothing else: the migration step is not a service (docs/plans/deployment/env-matrix.md).
 * The API never migrates on start.
 */
export async function migrateUp(databaseUrl: string, dir: string, log: (message: string) => void = console.log): Promise<string[]> {
  const ran = await runner({
    databaseUrl,
    dir,
    direction: 'up',
    migrationsTable: 'pgmigrations',
    checkOrder: true,
    log,
  });
  return ran.map((migration) => migration.name);
}

/** The migrations shipped with the API: apps/api/migrations, or /app/migrations in the image. */
export const MIGRATIONS_DIR = resolve(__dirname, '../../migrations');

async function main(): Promise<void> {
  const env = loadDatabaseEnv();
  const applied = await migrateUp(env.DATABASE_URL, MIGRATIONS_DIR);
  console.log(applied.length === 0 ? 'Database is up to date.' : `Applied ${applied.length} migration(s): ${applied.join(', ')}`);
}

// Runs only when this file is the entrypoint, so the tests can import migrateUp.
if (require.main === module) {
  main().catch((err: unknown) => {
    console.error('Release migration failed; the release must stop:', err);
    process.exit(1);
  });
}
