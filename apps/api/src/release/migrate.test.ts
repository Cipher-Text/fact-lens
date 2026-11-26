import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MIGRATIONS_DIR, migrateUp } from './migrate';

const adminUrl = process.env.TEST_DATABASE_URL;

/** A migration file in node-pg-migrate's format (SQL with Up and Down sections). */
function migration(up: string): string {
  return `-- Up Migration\n${up}\n\n-- Down Migration\nselect 1;\n`;
}

describe.skipIf(!adminUrl)('release migration (D5)', () => {
  let admin: Pool;
  let databaseUrl: string;
  let name: string;

  beforeAll(async () => {
    name = `fl_release_${randomBytes(4).toString('hex')}`;
    admin = new Pool({ connectionString: adminUrl });
    admin.on('error', () => {});
    await admin.query(`CREATE DATABASE ${name}`);
    const url = new URL(adminUrl!);
    url.pathname = `/${name}`;
    databaseUrl = url.toString();
  });

  afterAll(async () => {
    await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.end();
  });

  it('applies the shipped migrations once, then reports nothing to do', async () => {
    const first = await migrateUp(databaseUrl, MIGRATIONS_DIR, () => {});
    expect(first.length).toBeGreaterThan(0);
    expect(await migrateUp(databaseUrl, MIGRATIONS_DIR, () => {})).toEqual([]);
  });

  it('stops at a failing migration and leaves it unrecorded, so the release can stop', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-release-'));
    writeFileSync(join(dir, '1700000000001_ok.sql'), migration('create table release_probe (id int);'));
    writeFileSync(join(dir, '1700000000002_broken.sql'), migration('select * from table_that_does_not_exist;'));
    const probeUrl = databaseUrl.replace(/\/[^/]*$/, `/${name}_probe`);
    await admin.query(`CREATE DATABASE ${name}_probe`);
    try {
      await expect(migrateUp(probeUrl, dir, () => {})).rejects.toThrow();
      const probe = new Pool({ connectionString: probeUrl });
      try {
        const rows = await probe.query('select name from pgmigrations order by name');
        expect(rows.rows.map((r: { name: string }) => r.name)).toEqual(['1700000000001_ok']);
      } finally {
        await probe.end();
      }
    } finally {
      await admin.query(`DROP DATABASE IF EXISTS ${name}_probe WITH (FORCE)`);
    }
  });
});
