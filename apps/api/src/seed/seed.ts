import { featureFlagKeys, parseConfigValue } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import { tags } from './tags';
import { categories, configuration, desks, featureFlags, roles } from './data';
import { withTransaction } from '../db/transaction';

export interface SeedResult {
  desks: number;
  categories: number;
  tags: number;
  configuration: number;
  featureFlags: number;
  roles: number;
}

/** Inserts reference data in one transaction. Existing rows are left as they are. */
export async function seedReferenceData(pool: Pool): Promise<SeedResult> {
  // Validate before touching the database: a bad value must not half-seed.
  for (const c of configuration) parseConfigValue(c.key, c.value);
  for (const f of featureFlags) {
    if (!featureFlagKeys.includes(f.key)) throw new Error(`Unknown feature flag: ${f.key}`);
  }

  return withTransaction(pool, async (db) => {
    const count = async (sql: string, params: unknown[]) => (await db.query(sql, params)).rowCount ?? 0;
    const result: SeedResult = { desks: 0, categories: 0, tags: 0, configuration: 0, featureFlags: 0, roles: 0 };

    for (const d of desks) {
      result.desks += await count('INSERT INTO desk (key, name) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [d.key, d.name]);
    }

    for (const [i, c] of categories.entries()) {
      const inserted = await db.query(
        'INSERT INTO category (key, position) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING RETURNING id',
        [c.key, i + 1],
      );
      if (inserted.rowCount === 0) continue; // already seeded; keep any edited labels
      result.categories += 1;
      for (const [locale, name, description] of [['en', c.en, c.enDescription], ['bn-BD', c.bn, c.bnDescription]] as const) {
        await db.query('INSERT INTO category_label (category_id, locale, name, slug, description) VALUES ($1, $2, $3, $4, $5)', [
          inserted.rows[0].id, locale, name, c.key, description,
        ]);
      }
    }

    for (const t of tags) {
      const inserted = await db.query('INSERT INTO tag (key) VALUES ($1) ON CONFLICT (key) DO NOTHING RETURNING id', [t.key]);
      if (inserted.rowCount === 0) continue; // already seeded; keep any edited labels
      result.tags += 1;
      await db.query('INSERT INTO tag_label (tag_id, locale, name, slug) VALUES ($1, $2, $3, $4)', [inserted.rows[0].id, 'en', t.en, t.key]);
      if (t.bn && t.bnSlug) {
        await db.query('INSERT INTO tag_label (tag_id, locale, name, slug) VALUES ($1, $2, $3, $4)', [inserted.rows[0].id, 'bn-BD', t.bn, t.bnSlug]);
      }
    }

    for (const c of configuration) {
      result.configuration += await count(
        'INSERT INTO configuration (key, scope, value, updated_by) VALUES ($1, $2, $3, $4) ON CONFLICT (key, scope) DO NOTHING',
        [c.key, c.scope, JSON.stringify(c.value), 'seed'],
      );
    }

    for (const f of featureFlags) {
      result.featureFlags += await count(
        'INSERT INTO feature_flag (key, enabled, description, updated_by) VALUES ($1, false, $2, $3) ON CONFLICT (key) DO NOTHING',
        [f.key, f.description, 'seed'],
      );
    }

    for (const r of roles) {
      const inserted = await db.query(
        'INSERT INTO app_role (key, name) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
        [r.key, r.name],
      );
      if (inserted.rowCount === 0) continue; // already seeded; keep edited capabilities
      result.roles += 1;
      for (const capability of r.capabilities) {
        await db.query('INSERT INTO app_role_capability (role_key, capability) VALUES ($1, $2)', [r.key, capability]);
      }
    }

    return result;
  });
}
