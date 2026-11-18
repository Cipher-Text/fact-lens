import { loadDatabaseEnv } from '@fact-lens/config';
import { createPool } from '../db/pool';
import { AuditService } from '../audit/audit.service';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { SearchService } from './search.service';

/**
 * Rebuilds the public search documents from the stored published text. Safe to run again at any time: the documents
 * are derived, so a rebuild only changes rows that differ. Run it after a change to how text is indexed.
 */
async function main() {
  const pool = createPool(loadDatabaseEnv().DATABASE_URL);
  try {
    const search = new SearchService(pool, new TaxonomyService(pool, new AuditService(pool)), null, { prefix: 'fl', hashSecret: null, ownHosts: [] });
    const result = await search.reindex();
    console.log('Reindexed search:', result);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
