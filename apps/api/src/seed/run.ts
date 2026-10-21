import { loadDatabaseEnv } from '@fact-lens/config';
import { createPool } from '../db/pool';
import { seedReferenceData } from './seed';

async function main() {
  const pool = createPool(loadDatabaseEnv().DATABASE_URL);
  try {
    const result = await seedReferenceData(pool);
    console.log('Seeded (new rows):', result);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
