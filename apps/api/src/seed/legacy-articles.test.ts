import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { tiptapBodySchema } from '@fact-lens/contracts';
import { createTestDatabase } from '../db/test-db';
import { categories } from './data';
import { LEGACY_DIR, LEGACY_SECTION_TO_SITE, importLegacyArticles, legacyBody, parseCsv, readLegacyTables, utcTimestamp } from './legacy-articles';
import { seedReferenceData } from './seed';

describe('parseCsv', () => {
  it('reads quoted commas, line breaks, doubled quotes and CRLF line ends', () => {
    const rows = parseCsv('id,title,body\r\n1,"Hello, world","line one\nline ""two"""\r\n2,plain,\r\n');
    expect(rows).toEqual([
      { id: '1', title: 'Hello, world', body: 'line one\nline "two"' },
      { id: '2', title: 'plain', body: '' },
    ]);
  });

  it('returns no rows for an empty file', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('legacyBody', () => {
  it('makes one paragraph per non-empty line and passes the news body contract', () => {
    const doc = legacyBody('First paragraph.\n\n  Second paragraph.  \n');
    expect(doc).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second paragraph.' }] },
      ],
    });
    expect(tiptapBodySchema.safeParse(doc).success).toBe(true);
  });

  it('turns the underlining of the one article that has it into the underline mark', () => {
    expect(legacyBody('<u>Under</u>line')).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [
        { type: 'text', text: 'Under', marks: [{ type: 'underline' }] },
        { type: 'text', text: 'line' },
      ] }],
    });
  });

  it('gives an empty document for an empty article', () => {
    expect(legacyBody('  \n ')).toEqual({ type: 'doc', content: [] });
  });
});

describe('utcTimestamp', () => {
  it('reads a legacy timestamp as UTC, and keeps an explicit offset', () => {
    expect(utcTimestamp('2026-02-01 17:06:07.518000')).toBe('2026-02-01T17:06:07.518000Z');
    expect(utcTimestamp('2026-02-01T17:06:07+06:00')).toBe('2026-02-01T17:06:07+06:00');
    expect(utcTimestamp('')).toBeNull();
  });
});

describe('the legacy export', () => {
  it('maps every section that is used to a site section that exists', () => {
    const siteKeys = new Set<string>(categories.map((c) => c.key));
    for (const [legacy, site] of Object.entries(LEGACY_SECTION_TO_SITE)) {
      expect(legacy).toMatch(/^bn-bd-/);
      if (site !== null) expect(siteKeys.has(site), `${legacy} -> ${site}`).toBe(true);
    }
  });

  it('has the expected article, author and tag counts, and no author email', () => {
    const t = readLegacyTables(LEGACY_DIR);
    expect(t.articles).toHaveLength(2196);
    expect(t.authors).toHaveLength(12);
    expect(t.tags).toHaveLength(292);
    expect(t.categoryLinks).toHaveLength(2184);
    expect(t.authorLinks).toHaveLength(1974);
    expect(t.tagLinks).toHaveLength(3308);
    expect(readFileSync(join(LEGACY_DIR, 'authors.csv'), 'utf8').split('\n')[0]).not.toMatch(/\bemail\b/);
  });
});

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('legacy article import (database)', () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>>;
  let dir: string;

  beforeAll(async () => {
    db = await createTestDatabase(adminUrl!);
    await seedReferenceData(db.pool);
    dir = mkdtempSync(join(tmpdir(), 'legacy-fixture-'));
    mkdirSync(dir, { recursive: true });
    const file = (name: string, text: string) => writeFileSync(join(dir, name), text, 'utf8');
    file('articles.csv', [
      'id,title,slug,sync_key,excerpt,content,is_featured,is_breaking,seo_title,seo_description,reading_time,created_at,updated_at,published_at,created_by_id,updated_by_id,locale',
      '1,"Flood, relief","flood-relief",,"Short","Line one.\nLine two.",false,false,,,1,2026-01-02 10:00:00,2026-01-02 11:00:00,2026-01-02 12:00:00,,,bn-BD',
      '2,Draft piece,draft-piece,,,"Only a draft.",false,false,,,1,2026-01-03 10:00:00,2026-01-03 10:00:00,,,,bn-BD',
      '3,Dup slug,flood-relief,,,"Same slug as item 1.",false,false,,,1,2026-01-04 10:00:00,2026-01-04 10:00:00,2026-01-04 10:00:00,,,bn-BD',
    ].join('\n'));
    file('authors.csv', 'id,name,slug,designation,bio,social_links,created_at,updated_at,created_by_id,updated_by_id,locale\n1,স্টাফ রিপোর্টার,staff-reporter,,,,2026-01-01 00:00:00,2026-01-01 00:00:00,,,bn-BD\n');
    file('articles_author_links.csv', 'id,article_id,author_id,article_order\n1,1,1,1\n');
    file('categories.csv', 'id,name,slug,sync_key,description,order,show_in_menu,created_at,updated_at,created_by_id,updated_by_id,locale\n15,আন্তর্জাতিক,bn-bd-international,,,6,true,2026-01-01 00:00:00,2026-01-01 00:00:00,,,bn-BD\n');
    file('articles_category_links.csv', 'id,article_id,category_id,article_order\n1,1,15,1\n2,2,15,2\n');
    file('tags.csv', 'id,name,slug,sync_key,created_at,updated_at,created_by_id,updated_by_id,locale\n');
    file('articles_tags_links.csv', 'id,article_id,tag_id,tag_order,article_order\n');
  });
  afterAll(async () => {
    await db?.drop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('imports published and draft items once, and a second run adds nothing', async () => {
    const first = await importLegacyArticles(db.pool, dir);
    expect(first).toMatchObject({ articles: 3, published: 2, drafts: 1, withoutSection: 1, contributors: 1 });
    expect(first.slugsRenamed).toEqual(['3: flood-relief-3']);

    const again = await importLegacyArticles(db.pool, dir);
    expect(again).toMatchObject({ articles: 0, alreadyImported: 3, contributors: 0 });

    const { rows } = await db.pool.query<{ status: string; published: boolean; section: string | null }>(
      `SELECT n.status, n.published_revision_id IS NOT NULL AS published,
              (SELECT c.key FROM news_category nc JOIN category c ON c.id = nc.category_id WHERE nc.news_id = n.id AND nc.is_primary) AS section
         FROM news n WHERE n.canonical_key LIKE 'legacy:%' ORDER BY n.canonical_key`);
    expect(rows).toEqual([
      { status: 'PUBLISHED', published: true, section: 'geopolitics' },
      { status: 'DRAFT', published: false, section: 'geopolitics' },
      { status: 'PUBLISHED', published: true, section: null },
    ]);
  });

  it('makes published items searchable and keeps the original publish time', async () => {
    const { rows } = await db.pool.query<{ published_at: Date }>(
      `SELECT published_at FROM news WHERE canonical_key = 'legacy:article:1'`);
    expect(rows[0]!.published_at.toISOString()).toBe('2026-01-02T12:00:00.000Z');
    const search = await db.pool.query('SELECT 1 FROM news_search ns JOIN news n ON n.id = ns.news_id WHERE n.canonical_key = $1', ['legacy:article:1']);
    expect(search.rowCount).toBe(1);
    const draft = await db.pool.query('SELECT 1 FROM news_search ns JOIN news n ON n.id = ns.news_id WHERE n.canonical_key = $1', ['legacy:article:2']);
    expect(draft.rowCount).toBe(0);
  });
});
