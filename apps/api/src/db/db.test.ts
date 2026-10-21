import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { withTransaction } from './transaction';

// Needs a PostgreSQL server. Set TEST_DATABASE_URL to any database on it (for example the
// `pnpm infra:up` one); each run creates and drops its own database.
const adminUrl = process.env.TEST_DATABASE_URL;
const migrationsDir = resolve(__dirname, '../../migrations');

describe.skipIf(!adminUrl)('database schema', () => {
  const dbName = `fl_test_${randomBytes(4).toString('hex')}`;
  let admin: Pool;
  let pool: Pool;
  let dbUrl: string;

  async function migrate(direction: 'up' | 'down', count: number) {
    const { runner } = await import('node-pg-migrate');
    await runner({
      databaseUrl: dbUrl,
      dir: migrationsDir,
      direction,
      count,
      migrationsTable: 'pgmigrations',
      log: () => {},
    });
  }

  beforeAll(async () => {
    admin = new Pool({ connectionString: adminUrl });
    await admin.query(`CREATE DATABASE ${dbName}`);
    const u = new URL(adminUrl!);
    u.pathname = `/${dbName}`;
    dbUrl = u.toString();
    await migrate('up', Infinity);
    pool = new Pool({ connectionString: dbUrl });
  });

  afterAll(async () => {
    await pool?.end();
    await admin?.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
    await admin?.end();
  });

  const expectCode = async (p: Promise<unknown>, code: string) =>
    expect(p).rejects.toMatchObject({ code });

  async function newStory(key = `k-${randomBytes(3).toString('hex')}`) {
    const { rows } = await pool.query('INSERT INTO story (canonical_key) VALUES ($1) RETURNING id', [key]);
    return rows[0].id as string;
  }

  it('seeds the supported locales', async () => {
    const { rows } = await pool.query('SELECT code FROM locale ORDER BY code');
    expect(rows.map((r) => r.code)).toEqual(['bn-BD', 'en']);
  });

  it('rejects an invalid story status and a duplicate canonical key', async () => {
    await expectCode(pool.query(`INSERT INTO story (canonical_key, status) VALUES ('s1', 'NOPE')`), '23514');
    await pool.query(`INSERT INTO story (canonical_key) VALUES ('dup')`);
    await expectCode(pool.query(`INSERT INTO story (canonical_key) VALUES ('dup')`), '23505');
  });

  it('keeps revision numbers unique per story and translations unique per locale', async () => {
    const storyId = await newStory();
    const rev = await pool.query(
      `INSERT INTO story_revision (story_id, revision_no, changed_by) VALUES ($1, 1, 'u1') RETURNING id`,
      [storyId],
    );
    await expectCode(
      pool.query(`INSERT INTO story_revision (story_id, revision_no, changed_by) VALUES ($1, 1, 'u1')`, [storyId]),
      '23505',
    );
    const insertT = (locale: string) =>
      pool.query(`INSERT INTO story_translation (revision_id, locale, title, slug) VALUES ($1, $2, 't', 's')`, [
        rev.rows[0].id,
        locale,
      ]);
    await insertT('en');
    await expectCode(insertT('en'), '23505');
    await expectCode(insertT('fr'), '23503');
  });

  it('only lets a story publish one of its own revisions', async () => {
    const a = await newStory();
    const b = await newStory();
    const revB = await pool.query(
      `INSERT INTO story_revision (story_id, revision_no, changed_by) VALUES ($1, 1, 'u1') RETURNING id`,
      [b],
    );
    await expectCode(pool.query('UPDATE story SET published_revision_id = $1 WHERE id = $2', [revB.rows[0].id, a]), '23503');
    await pool.query('UPDATE story SET published_revision_id = $1 WHERE id = $2', [revB.rows[0].id, b]);
  });

  it('enforces slug uniqueness per locale and one current slug per story and locale', async () => {
    const a = await newStory();
    const b = await newStory();
    const ins = (story: string, locale: string, slug: string, current = true) =>
      pool.query('INSERT INTO story_slug (story_id, locale, slug, is_current) VALUES ($1, $2, $3, $4)', [
        story, locale, slug, current,
      ]);
    await ins(a, 'en', 'hello');
    await expectCode(ins(b, 'en', 'hello'), '23505');
    await ins(b, 'bn-BD', 'hello');
    await ins(a, 'en', 'hello-old', false);
    await expectCode(ins(a, 'en', 'another-current'), '23505');
  });

  it('keeps category and tag slugs unique per locale', async () => {
    const c1 = await pool.query(`INSERT INTO category (key) VALUES ('politics') RETURNING id`);
    const c2 = await pool.query(`INSERT INTO category (key) VALUES ('sports') RETURNING id`);
    const label = (id: string) =>
      pool.query(`INSERT INTO category_label (category_id, locale, name, slug) VALUES ($1, 'en', 'n', 'same')`, [id]);
    await label(c1.rows[0].id);
    await expectCode(label(c2.rows[0].id), '23505');
  });

  it('allows one configuration value per key and scope', async () => {
    await pool.query(`INSERT INTO configuration (key, scope, value) VALUES ('rate.limit', 'global', '{"rpm":60}')`);
    await pool.query(`INSERT INTO configuration (key, scope, value) VALUES ('rate.limit', 'desk:1', '{"rpm":30}')`);
    await expectCode(
      pool.query(`INSERT INTO configuration (key, scope, value) VALUES ('rate.limit', 'global', '{}')`),
      '23505',
    );
  });

  it('makes audit_event append-only', async () => {
    const { rows } = await pool.query(
      `INSERT INTO audit_event (actor_type, action, object_type, object_id) VALUES ('human', 'story.create', 'story', '1') RETURNING id`,
    );
    await expectCode(pool.query('UPDATE audit_event SET action = $1 WHERE id = $2', ['x', rows[0].id]), '23001');
    await expectCode(pool.query('DELETE FROM audit_event WHERE id = $1', [rows[0].id]), '23001');
    await expectCode(pool.query('TRUNCATE audit_event'), '23001');
    await expectCode(
      pool.query(`INSERT INTO audit_event (actor_type, action, object_type, object_id) VALUES ('bot', 'a', 'b', 'c')`),
      '23514',
    );
  });

  describe('withTransaction', () => {
    it('commits the change, audit event and outbox event together', async () => {
      await withTransaction(pool, async (c) => {
        await c.query(`INSERT INTO story (canonical_key) VALUES ('tx-ok')`);
        await c.query(`INSERT INTO audit_event (actor_type, action, object_type, object_id) VALUES ('system', 'story.create', 'story', 'tx-ok')`);
        await c.query(`INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type) VALUES ('story', 'tx-ok', 'story.created')`);
      });
      const counts = await pool.query(
        `SELECT (SELECT count(*) FROM story WHERE canonical_key = 'tx-ok')::int AS s,
                (SELECT count(*) FROM audit_event WHERE object_id = 'tx-ok')::int AS a,
                (SELECT count(*) FROM outbox_event WHERE aggregate_id = 'tx-ok')::int AS o`,
      );
      expect(counts.rows[0]).toEqual({ s: 1, a: 1, o: 1 });
    });

    it('rolls everything back on error and releases the client', async () => {
      await expect(
        withTransaction(pool, async (c) => {
          await c.query(`INSERT INTO story (canonical_key) VALUES ('tx-bad')`);
          await c.query(`INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type) VALUES ('story', 'tx-bad', 'story.created')`);
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');
      const counts = await pool.query(
        `SELECT (SELECT count(*) FROM story WHERE canonical_key = 'tx-bad')::int AS s,
                (SELECT count(*) FROM outbox_event WHERE aggregate_id = 'tx-bad')::int AS o`,
      );
      expect(counts.rows[0]).toEqual({ s: 0, o: 0 });
      expect(pool.idleCount).toBe(pool.totalCount);
    });
  });

  it('migrates down to nothing and back up', async () => {
    await pool.end();
    await migrate('down', Infinity);
    const probe = new Pool({ connectionString: dbUrl });
    const { rows } = await probe.query(
      `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name <> 'pgmigrations'`,
    );
    expect(rows[0].n).toBe(0);
    await probe.end();
    await migrate('up', Infinity);
    pool = new Pool({ connectionString: dbUrl });
    const { rows: locales } = await pool.query('SELECT count(*)::int AS n FROM locale');
    expect(locales[0].n).toBe(2);
  });
});
