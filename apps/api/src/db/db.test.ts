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

  async function newRevision(storyId: string, no = 1, isCorrection = false) {
    const { rows } = await pool.query(
      `INSERT INTO story_revision (story_id, revision_no, changed_by, is_correction) VALUES ($1, $2, 'u1', $3) RETURNING id`,
      [storyId, no, isCorrection],
    );
    return rows[0].id as string;
  }

  it('deduplicates sources by canonical URL and by channel and external id', async () => {
    const ins = (canonical: string | null, channel: string | null, ext: string | null) =>
      pool.query(
        `INSERT INTO source (title, canonical_url, ingest_channel, external_id) VALUES ('t', $1, $2, $3)`,
        [canonical, channel, ext],
      );
    await ins('https://example.com/a', null, null);
    await expectCode(ins('https://example.com/a', null, null), '23505');
    await ins(null, 'telegram', '42');
    await expectCode(ins(null, 'telegram', '42'), '23505');
    await ins(null, 'rss', '42');
    await expectCode(ins(null, 'rss', null), '23514');
  });

  it('rejects non-http source URLs', async () => {
    await expectCode(
      pool.query(`INSERT INTO source (title, url) VALUES ('t', 'javascript:alert(1)')`),
      '23514',
    );
  });

  it('links a story to a source once', async () => {
    const storyId = await newStory();
    const src = await pool.query(`INSERT INTO source (title) VALUES ('t') RETURNING id`);
    const link = () =>
      pool.query('INSERT INTO story_source (story_id, source_id) VALUES ($1, $2)', [storyId, src.rows[0].id]);
    await link();
    await expectCode(link(), '23505');
  });

  it('requires completed_at exactly when an assignment is done', async () => {
    const storyId = await newStory();
    const ins = (status: string, completed: string | null) =>
      pool.query(
        `INSERT INTO editorial_assignment (story_id, assignee, role, status, completed_at) VALUES ($1, 'u1', 'editor', $2, $3)`,
        [storyId, status, completed],
      );
    await ins('open', null);
    await ins('done', new Date().toISOString());
    await expectCode(ins('done', null), '23514');
    await expectCode(ins('open', new Date().toISOString()), '23514');
  });

  it('keeps comments on revisions of their own story and requires resolved_at when resolved', async () => {
    const a = await newStory();
    const b = await newStory();
    const revB = await newRevision(b);
    const ins = (story: string, rev: string | null, status = 'open', resolvedAt: string | null = null) =>
      pool.query(
        `INSERT INTO editorial_comment (story_id, revision_id, author, body, status, resolved_at) VALUES ($1, $2, 'u1', 'note', $3, $4)`,
        [story, rev, status, resolvedAt],
      );
    await ins(a, null);
    await ins(b, revB);
    await expectCode(ins(a, revB), '23503');
    await expectCode(ins(a, null, 'resolved'), '23514');
    await expectCode(
      pool.query(`INSERT INTO editorial_comment (story_id, author, body) VALUES ($1, 'u1', '   ')`, [a]),
      '23514',
    );
  });

  it('only records a correction against a correction revision of the same story', async () => {
    const a = await newStory();
    const b = await newStory();
    const plain = await newRevision(a, 1, false);
    const fix = await newRevision(a, 2, true);
    const otherFix = await newRevision(b, 1, true);
    const ins = (story: string, rev: string) =>
      pool.query(
        `INSERT INTO correction (story_id, revision_id, reason, requested_by, approved_by) VALUES ($1, $2, 'typo', 'u1', 'u2') RETURNING id`,
        [story, rev],
      );
    await expectCode(ins(a, plain), '23514');
    await expectCode(ins(a, otherFix), '23503');
    const ok = await ins(a, fix);
    await expectCode(ins(a, fix), '23505');
    await pool.query(`INSERT INTO correction_notice (correction_id, locale, notice) VALUES ($1, 'en', 'Fixed a typo')`, [
      ok.rows[0].id,
    ]);
  });

  it('keeps publishing schedule idempotency keys unique', async () => {
    const storyId = await newStory();
    const ins = (key: string) =>
      pool.query(
        `INSERT INTO publishing_schedule (story_id, scheduled_for, time_zone, idempotency_key, created_by) VALUES ($1, now(), 'Asia/Dhaka', $2, 'u1')`,
        [storyId, key],
      );
    await ins('k1');
    await expectCode(ins('k1'), '23505');
  });

  it('versions card templates and links a generated card to its inputs', async () => {
    const tpl = (version: number) =>
      pool.query(
        `INSERT INTO card_template (key, version, name, aspect_ratio, width, height) VALUES ('brand', $1, 'Brand', 'square', 1080, 1080) RETURNING id`,
        [version],
      );
    const t1 = await tpl(1);
    await expectCode(tpl(1), '23505');
    await expectCode(
      pool.query(`INSERT INTO card_template (key, version, name, aspect_ratio, width, height) VALUES ('x', 1, 'x', 'round', 1, 1)`),
      '23514',
    );

    const media = (key: string) =>
      pool.query(
        `INSERT INTO media_asset (object_key, mime_type, byte_size, sha256) VALUES ($1, 'image/jpeg', 10, 'abc') RETURNING id`,
        [key],
      );
    const photo = await media('photo.jpg');
    const card = await media('card.jpg');
    const storyId = await newStory();
    const rev = await newRevision(storyId);
    const ins = (output: string, source: string, story = storyId, revision = rev) =>
      pool.query(
        `INSERT INTO generated_card (media_asset_id, source_media_asset_id, template_id, story_id, revision_id, created_by) VALUES ($1, $2, $3, $4, $5, 'u1')`,
        [output, source, t1.rows[0].id, story, revision],
      );
    await expectCode(ins(photo.rows[0].id, photo.rows[0].id), '23514');
    const otherStory = await newStory();
    await expectCode(ins(card.rows[0].id, photo.rows[0].id, otherStory, rev), '23503');
    await ins(card.rows[0].id, photo.rows[0].id);
    await expectCode(ins(card.rows[0].id, photo.rows[0].id), '23505');
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
