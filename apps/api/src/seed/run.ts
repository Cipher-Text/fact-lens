import { loadDatabaseEnv } from '@fact-lens/config';
import { createPool } from '../db/pool';
import { seedDevAccounts } from './dev-accounts';
import { importLegacyArticles } from './legacy-articles';
import { seedReferenceData } from './seed';

async function main() {
  const env = loadDatabaseEnv();
  const pool = createPool(env.DATABASE_URL);
  try {
    const result = await seedReferenceData(pool);
    console.log('Seeded (new rows):', result);
    const legacy = await importLegacyArticles(pool);
    console.log('Legacy articles (cipher-press export):', legacy);
    // Development only: one account per role for the newsroom's quick sign-in (ADR-064). Off by default and refused in production.
    if (env.DEV_QUICK_LOGIN) console.log('Dev accounts (quick sign-in):', await seedDevAccounts(pool));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
