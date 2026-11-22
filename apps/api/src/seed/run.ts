import { loadDatabaseEnv } from '@fact-lens/config';
import { createPool } from '../db/pool';
import { importLegacyArticles } from './legacy-articles';
import { seedReferenceData } from './seed';

async function main() {
  const pool = createPool(loadDatabaseEnv().DATABASE_URL);
  try {
    const result = await seedReferenceData(pool);
    console.log('Seeded (new rows):', result);
    const legacy = await importLegacyArticles(pool);
    console.log('Legacy articles (cipher-press export):', legacy);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
