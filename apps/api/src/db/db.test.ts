import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import * as c from '@fact-lens/contracts';
import { seedReferenceData } from '../seed/seed';
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
    admin.on('error', () => {});
    await admin.query(`CREATE DATABASE ${dbName}`);
    const u = new URL(adminUrl!);
    u.pathname = `/${dbName}`;
    dbUrl = u.toString();
    await migrate('up', Infinity);
    pool = new Pool({ connectionString: dbUrl });
    pool.on('error', () => {});
  });

  afterAll(async () => {
    await pool?.end();
    await admin?.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
    await admin?.end();
  });

  const expectCode = async (p: Promise<unknown>, code: string) =>
    expect(p).rejects.toMatchObject({ code });

  async function newNews(key = `k-${randomBytes(3).toString('hex')}`) {
    const { rows } = await pool.query('INSERT INTO news (canonical_key) VALUES ($1) RETURNING id', [key]);
    return rows[0].id as string;
  }

  it('seeds the supported locales', async () => {
    const { rows } = await pool.query('SELECT code FROM locale ORDER BY code');
    expect(rows.map((r) => r.code)).toEqual(['bn-BD', 'en']);
  });

  it('rejects an invalid news status and a duplicate canonical key', async () => {
    await expectCode(pool.query(`INSERT INTO news (canonical_key, status) VALUES ('s1', 'NOPE')`), '23514');
    await pool.query(`INSERT INTO news (canonical_key) VALUES ('dup')`);
    await expectCode(pool.query(`INSERT INTO news (canonical_key) VALUES ('dup')`), '23505');
  });

  it('keeps revision numbers unique per news and translations unique per locale', async () => {
    const newsId = await newNews();
    const rev = await pool.query(
      `INSERT INTO news_revision (news_id, revision_no, changed_by) VALUES ($1, 1, 'u1') RETURNING id`,
      [newsId],
    );
    await expectCode(
      pool.query(`INSERT INTO news_revision (news_id, revision_no, changed_by) VALUES ($1, 1, 'u1')`, [newsId]),
      '23505',
    );
    const insertT = (locale: string) =>
      pool.query(`INSERT INTO news_translation (revision_id, locale, title, slug) VALUES ($1, $2, 't', 's')`, [
        rev.rows[0].id,
        locale,
      ]);
    await insertT('en');
    await expectCode(insertT('en'), '23505');
    await expectCode(insertT('fr'), '23503');
  });

  it('only lets a news item publish one of its own revisions', async () => {
    const a = await newNews();
    const b = await newNews();
    const revB = await pool.query(
      `INSERT INTO news_revision (news_id, revision_no, changed_by) VALUES ($1, 1, 'u1') RETURNING id`,
      [b],
    );
    await expectCode(pool.query('UPDATE news SET published_revision_id = $1 WHERE id = $2', [revB.rows[0].id, a]), '23503');
    await pool.query('UPDATE news SET published_revision_id = $1 WHERE id = $2', [revB.rows[0].id, b]);
  });

  it('enforces slug uniqueness per locale and one current slug per news and locale', async () => {
    const a = await newNews();
    const b = await newNews();
    const ins = (news: string, locale: string, slug: string, current = true) =>
      pool.query('INSERT INTO news_slug (news_id, locale, slug, is_current) VALUES ($1, $2, $3, $4)', [
        news, locale, slug, current,
      ]);
    await ins(a, 'en', 'hello');
    await expectCode(ins(b, 'en', 'hello'), '23505');
    await ins(b, 'bn-BD', 'hello');
    await ins(a, 'en', 'hello-old', false);
    await expectCode(ins(a, 'en', 'another-current'), '23505');
  });

  it('keeps category and tag slugs unique per locale', async () => {
    const c1 = await pool.query(`INSERT INTO category (key) VALUES ('test-cat-a') RETURNING id`);
    const c2 = await pool.query(`INSERT INTO category (key) VALUES ('test-cat-b') RETURNING id`);
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
      `INSERT INTO audit_event (actor_type, action, object_type, object_id) VALUES ('human', 'news.create', 'news', '1') RETURNING id`,
    );
    await expectCode(pool.query('UPDATE audit_event SET action = $1 WHERE id = $2', ['x', rows[0].id]), '23001');
    await expectCode(pool.query('DELETE FROM audit_event WHERE id = $1', [rows[0].id]), '23001');
    await expectCode(pool.query('TRUNCATE audit_event'), '23001');
    await expectCode(
      pool.query(`INSERT INTO audit_event (actor_type, action, object_type, object_id) VALUES ('bot', 'a', 'b', 'c')`),
      '23514',
    );
  });

  async function newRevision(newsId: string, no = 1, isCorrection = false) {
    const { rows } = await pool.query(
      `INSERT INTO news_revision (news_id, revision_no, changed_by, is_correction) VALUES ($1, $2, 'u1', $3) RETURNING id`,
      [newsId, no, isCorrection],
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

  it('links a news item to a source once', async () => {
    const newsId = await newNews();
    const src = await pool.query(`INSERT INTO source (title) VALUES ('t') RETURNING id`);
    const link = () =>
      pool.query('INSERT INTO news_source (news_id, source_id) VALUES ($1, $2)', [newsId, src.rows[0].id]);
    await link();
    await expectCode(link(), '23505');
  });

  it('requires completed_at exactly when an assignment is done', async () => {
    const newsId = await newNews();
    const ins = (status: string, completed: string | null) =>
      pool.query(
        `INSERT INTO editorial_assignment (news_id, assignee, role, status, completed_at) VALUES ($1, 'u1', 'editor', $2, $3)`,
        [newsId, status, completed],
      );
    await ins('open', null);
    await ins('done', new Date().toISOString());
    await expectCode(ins('done', null), '23514');
    await expectCode(ins('open', new Date().toISOString()), '23514');
  });

  it('keeps comments on revisions of their own news and requires resolved_at when resolved', async () => {
    const a = await newNews();
    const b = await newNews();
    const revB = await newRevision(b);
    const ins = (news: string, rev: string | null, status = 'open', resolvedAt: string | null = null) =>
      pool.query(
        `INSERT INTO editorial_comment (news_id, revision_id, author, body, status, resolved_at) VALUES ($1, $2, 'u1', 'note', $3, $4)`,
        [news, rev, status, resolvedAt],
      );
    await ins(a, null);
    await ins(b, revB);
    await expectCode(ins(a, revB), '23503');
    await expectCode(ins(a, null, 'resolved'), '23514');
    await expectCode(
      pool.query(`INSERT INTO editorial_comment (news_id, author, body) VALUES ($1, 'u1', '   ')`, [a]),
      '23514',
    );
  });

  it('only records a correction against a correction revision of the same news', async () => {
    const a = await newNews();
    const b = await newNews();
    const plain = await newRevision(a, 1, false);
    const fix = await newRevision(a, 2, true);
    const otherFix = await newRevision(b, 1, true);
    const ins = (news: string, rev: string) =>
      pool.query(
        `INSERT INTO correction (news_id, revision_id, reason, requested_by, approved_by) VALUES ($1, $2, 'typo', 'u1', 'u2') RETURNING id`,
        [news, rev],
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
    const newsId = await newNews();
    const ins = (key: string) =>
      pool.query(
        `INSERT INTO publishing_schedule (news_id, scheduled_for, time_zone, idempotency_key, created_by) VALUES ($1, now(), 'Asia/Dhaka', $2, 'u1')`,
        [newsId, key],
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
        `INSERT INTO media_asset (object_key, mime_type, byte_size, sha256) VALUES ($1, 'image/jpeg', 10, md5(random()::text)) RETURNING id`,
        [key],
      );
    const photo = await media('photo.jpg');
    const card = await media('card.jpg');
    const newsId = await newNews();
    const rev = await newRevision(newsId);
    const ins = (output: string, source: string, news = newsId, revision = rev) =>
      pool.query(
        `INSERT INTO generated_card (media_asset_id, source_media_asset_id, template_id, news_id, revision_id, created_by) VALUES ($1, $2, $3, $4, $5, 'u1')`,
        [output, source, t1.rows[0].id, news, revision],
      );
    await expectCode(ins(photo.rows[0].id, photo.rows[0].id), '23514');
    const otherNews = await newNews();
    await expectCode(ins(card.rows[0].id, photo.rows[0].id, otherNews, rev), '23503');
    await ins(card.rows[0].id, photo.rows[0].id);
    await expectCode(ins(card.rows[0].id, photo.rows[0].id), '23505');
  });

  describe('advertising', () => {
    async function adSetup(allowed: string[] = ['image', 'html']) {
      const adv = await pool.query(`INSERT INTO advertiser (name) VALUES ('Acme') RETURNING id`);
      const camp = await pool.query(`INSERT INTO ad_campaign (advertiser_id, name) VALUES ($1, 'c') RETURNING id`, [
        adv.rows[0].id,
      ]);
      const place = await pool.query(
        `INSERT INTO ad_placement (key, name, allowed_formats) VALUES ($1, 'p', $2) RETURNING id`,
        [`pl-${randomBytes(3).toString('hex')}`, allowed],
      );
      const media = await pool.query(
        `INSERT INTO media_asset (object_key, mime_type, byte_size, sha256) VALUES ($1, 'image/png', 1, md5(random()::text)) RETURNING id`,
        [`ad-${randomBytes(3).toString('hex')}.png`],
      );
      return { campaign: camp.rows[0].id as string, placement: place.rows[0].id as string, media: media.rows[0].id as string };
    }
    const insertAd = (
      s: { campaign: string; placement: string },
      o: { format?: string; media?: string | null; html?: string | null; url?: string; weight?: number } = {},
    ) =>
      pool.query(
        `INSERT INTO ad (campaign_id, placement_id, title, format, media_asset_id, html, target_url, weight)
         VALUES ($1, $2, 't', $3, $4, $5, $6, $7) RETURNING id`,
        [s.campaign, s.placement, o.format ?? 'html', o.media ?? null, o.html ?? '<b>hi</b>', o.url ?? 'https://example.com', o.weight ?? 1],
      );

    it('rejects a campaign that ends before it starts and a negative budget', async () => {
      const adv = await pool.query(`INSERT INTO advertiser (name) VALUES ('A') RETURNING id`);
      const ins = (start: string, end: string, budget = 100) =>
        pool.query(
          `INSERT INTO ad_campaign (advertiser_id, name, start_at, end_at, budget) VALUES ($1, 'c', $2, $3, $4)`,
          [adv.rows[0].id, start, end, budget],
        );
      await ins('2026-01-01', '2026-02-01');
      await expectCode(ins('2026-02-01', '2026-01-01'), '23514');
      await expectCode(ins('2026-01-01', '2026-02-01', -1), '23514');
    });

    it('keeps placement keys unique and requires valid allowed formats', async () => {
      await pool.query(`INSERT INTO ad_placement (key, name) VALUES ('home-top', 'Top')`);
      await expectCode(pool.query(`INSERT INTO ad_placement (key, name) VALUES ('home-top', 'Dup')`), '23505');
      await expectCode(pool.query(`INSERT INTO ad_placement (key, name, allowed_formats) VALUES ('k1', 'n', '{}')`), '23514');
      await expectCode(pool.query(`INSERT INTO ad_placement (key, name, allowed_formats) VALUES ('k2', 'n', '{video}')`), '23514');
    });

    it('requires an image for image ads and markup for html ads', async () => {
      const s = await adSetup();
      await insertAd(s, { format: 'image', media: s.media, html: null });
      await expectCode(insertAd(s, { format: 'image', media: null, html: null }), '23514');
      await insertAd(s, { format: 'html', html: '<b>x</b>' });
      await expectCode(insertAd(s, { format: 'html', html: '   ' }), '23514');
    });

    it('only allows formats the placement accepts', async () => {
      const s = await adSetup(['image']);
      await expectCode(insertAd(s, { format: 'html' }), '23514');
      await insertAd(s, { format: 'image', media: s.media, html: null });
    });

    it('rejects non-http target URLs and non-positive weights', async () => {
      const s = await adSetup();
      await expectCode(insertAd(s, { url: 'javascript:alert(1)' }), '23514');
      await expectCode(insertAd(s, { url: 'data:text/html,x' }), '23514');
      await expectCode(insertAd(s, { weight: 0 }), '23514');
    });

    it('targets categories once per ad', async () => {
      const s = await adSetup();
      const ad = await insertAd(s);
      const cat = await pool.query(`INSERT INTO category (key) VALUES ($1) RETURNING id`, [`c-${randomBytes(3).toString('hex')}`]);
      const link = () =>
        pool.query('INSERT INTO ad_category_target (ad_id, category_id) VALUES ($1, $2)', [ad.rows[0].id, cat.rows[0].id]);
      await link();
      await expectCode(link(), '23505');
    });

    it('records events, caps untrusted field lengths and blocks deleting an ad with events', async () => {
      const s = await adSetup();
      const ad = await insertAd(s);
      const ev = (type: string, extra: Record<string, string> = {}) =>
        pool.query(
          `INSERT INTO ad_event (event_type, ad_id, path, user_agent) VALUES ($1, $2, $3, $4)`,
          [type, ad.rows[0].id, extra.path ?? '/', extra.ua ?? 'ua'],
        );
      await ev('impression');
      await ev('click');
      await expectCode(ev('view'), '23514');
      await expectCode(ev('click', { path: '/' + 'a'.repeat(3000) }), '23514');
      await expectCode(ev('click', { ua: 'u'.repeat(600) }), '23514');
      await expectCode(pool.query('DELETE FROM ad WHERE id = $1', [ad.rows[0].id]), '23503');
    });
  });

  it('keeps contract enums in sync with the database CHECK constraints', async () => {
    const pairs: Array<[string, string, readonly string[]]> = [
      ['news', 'status', c.newsStatuses],
      ['news_translation', 'translation_status', c.translationStatuses],
      ['category', 'status', c.taxonomyStatuses],
      ['tag', 'status', c.taxonomyStatuses],
      ['contributor', 'kind', c.contributorKinds],
      ['news_contributor', 'role', c.contributorRoles],
      ['locale', 'direction', c.localeDirections],
      ['media_asset', 'processing_state', c.mediaProcessingStates],
      ['revision_media', 'role', c.revisionMediaRoles],
      ['source', 'kind', c.sourceKinds],
      ['source', 'validation_status', c.sourceValidationStatuses],
      ['source', 'ingest_channel', c.ingestChannels],
      ['news_source', 'relation', c.sourceRelations],
      ['news_source', 'use_type', c.sourceUseTypes],
      ['editorial_assignment', 'role', c.assignmentRoles],
      ['editorial_assignment', 'status', c.assignmentStatuses],
      ['editorial_comment', 'status', c.commentStatuses],
      ['publishing_schedule', 'status', c.scheduleStatuses],
      ['card_template', 'aspect_ratio', c.cardAspectRatios],
      ['card_template', 'status', c.cardTemplateStatuses],
      ['advertiser', 'status', c.advertiserStatuses],
      ['ad_campaign', 'status', c.campaignStatuses],
      ['ad', 'format', c.adFormats],
      ['ad', 'device_target', c.adDeviceTargets],
      ['ad_event', 'event_type', c.adEventTypes],
      ['audit_event', 'actor_type', c.auditActorTypes],
      ['app_role_capability', 'capability', c.capabilities],
    ];
    for (const [table, column, values] of pairs) {
      const { rows } = await pool.query(
        `SELECT pg_get_constraintdef(con.oid) AS def
           FROM pg_constraint con
           JOIN pg_class t ON t.oid = con.conrelid
           JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (con.conkey)
          WHERE con.contype = 'c' AND t.relname = $1 AND a.attname = $2 AND cardinality(con.conkey) = 1`,
        [table, column],
      );
      expect(rows.length, `${table}.${column} has a CHECK constraint`).toBeGreaterThan(0);
      const inDb = [...rows[0].def.matchAll(/'([^']+)'::text/g)].map((m) => m[1]).sort();
      expect(inDb, `${table}.${column}`).toEqual([...values].sort());
    }
  });

  it('seeds reference data once and never overwrites later edits', async () => {
    const first = await seedReferenceData(pool);
    expect(first.categories).toBe(9);
    expect(first.tags).toBe(146);
    expect(first.featureFlags).toBe(c.featureFlagKeys.length);
    expect(first.desks).toBeGreaterThan(0);

    await pool.query(`UPDATE feature_flag SET enabled = true WHERE key = 'ads.serving'`);
    await pool.query(`UPDATE configuration SET value = '{"limit":1,"windowSeconds":1}' WHERE key = 'rate_limit.search'`);
    await pool.query(`UPDATE category_label SET name = 'Edited' WHERE slug = 'local' AND locale = 'en'`);

    const second = await seedReferenceData(pool);
    expect(second).toEqual({ desks: 0, categories: 0, tags: 0, configuration: 0, featureFlags: 0, roles: 0 });
    expect(first.roles).toBe(8);

    const flag = await pool.query(`SELECT enabled FROM feature_flag WHERE key = 'ads.serving'`);
    expect(flag.rows[0].enabled).toBe(true);
    const cfg = await pool.query(`SELECT value FROM configuration WHERE key = 'rate_limit.search'`);
    expect(cfg.rows[0].value).toEqual({ limit: 1, windowSeconds: 1 });
    const label = await pool.query(`SELECT name FROM category_label WHERE slug = 'local' AND locale = 'en'`);
    expect(label.rows[0].name).toBe('Edited');
    const bn = await pool.query(`SELECT count(*)::int AS n FROM category_label WHERE locale = 'bn-BD'`);
    expect(bn.rows[0].n).toBe(9);
    const tagNames = await pool.query(`SELECT count(*)::int AS n FROM tag_label`);
    expect(tagNames.rows[0].n).toBe(292);
  });

  it('stores seeded configuration that passes its contract schema', async () => {
    const { rows } = await pool.query("SELECT key, value FROM configuration WHERE updated_by = 'seed'");
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      if (r.key === 'rate_limit.search') continue; // edited by the previous test
      expect(() => c.parseConfigValue(r.key, r.value), r.key).not.toThrow();
    }
  });

  it('keeps one media asset per checksum', async () => {
    const ins = (key: string) =>
      pool.query(`INSERT INTO media_asset (object_key, mime_type, byte_size, sha256) VALUES ($1, 'image/png', 1, 'same-checksum')`, [key]);
    await ins('originals/a.png');
    await expectCode(ins('originals/b.png'), '23505');
  });

  it('limits media rights fields', async () => {
    const ins = (extra: string, value: unknown) =>
      pool.query(`INSERT INTO media_asset (object_key, mime_type, byte_size, sha256, ${extra}) VALUES ($1, 'image/png', 1, md5(random()::text), $2)`, [`originals/${extra}-${Math.random()}.png`, value]);
    await expectCode(ins('source_url', 'javascript:alert(1)'), '23514');
    await expectCode(ins('permitted_channels', ['web', 'fax']), '23514');
    await ins('permitted_channels', ['web', 'print']);
    await expectCode(ins('alt_text', 'a'.repeat(501)), '23514');
  });

  describe('withTransaction', () => {
    it('commits the change, audit event and outbox event together', async () => {
      await withTransaction(pool, async (c) => {
        await c.query(`INSERT INTO news (canonical_key) VALUES ('tx-ok')`);
        await c.query(`INSERT INTO audit_event (actor_type, action, object_type, object_id) VALUES ('system', 'news.create', 'news', 'tx-ok')`);
        await c.query(`INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type) VALUES ('news', 'tx-ok', 'news.created')`);
      });
      const counts = await pool.query(
        `SELECT (SELECT count(*) FROM news WHERE canonical_key = 'tx-ok')::int AS s,
                (SELECT count(*) FROM audit_event WHERE object_id = 'tx-ok')::int AS a,
                (SELECT count(*) FROM outbox_event WHERE aggregate_id = 'tx-ok')::int AS o`,
      );
      expect(counts.rows[0]).toEqual({ s: 1, a: 1, o: 1 });
    });

    it('rolls everything back on error and releases the client', async () => {
      await expect(
        withTransaction(pool, async (c) => {
          await c.query(`INSERT INTO news (canonical_key) VALUES ('tx-bad')`);
          await c.query(`INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type) VALUES ('news', 'tx-bad', 'news.created')`);
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');
      const counts = await pool.query(
        `SELECT (SELECT count(*) FROM news WHERE canonical_key = 'tx-bad')::int AS s,
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
    pool.on('error', () => {});
    const { rows: locales } = await pool.query('SELECT count(*)::int AS n FROM locale');
    expect(locales[0].n).toBe(2);
  });
});
