import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { searchLiveStatuses, tiptapBodySchema } from '@fact-lens/contracts';
import type { Pool, PoolClient } from 'pg';
import { withTransaction } from '../db/transaction';
import { projectNewsSearch } from '../search/projection';

/**
 * Imports the articles, authors and their links from the cipher-press export kept in `apps/api/seed-data/legacy`
 * (docs/14). Each article gets one news item with the stable key `legacy:article:<id>`, so running the import again
 * adds nothing that is already there. It writes the rows directly, as the reference seed does: the imported items are
 * already published or drafts, and the publish rules are not run against them. Tags are matched to the existing tag
 * records seeded from cipher-press, so no tag is created. Emails are not in the export and are never imported.
 */

export const LEGACY_DIR = resolve(__dirname, '../../seed-data/legacy');

/** Legacy sections (by their Bangla slug) to the site's five menu sections; null means the article has no section. */
export const LEGACY_SECTION_TO_SITE: Readonly<Record<string, string | null>> = {
  'bn-bd-international': 'geopolitics',
  'bn-bd-politics': 'geopolitics',
  'bn-bd-national': 'security',
  'bn-bd-economy': 'economy',
  'bn-bd-business': 'economy',
  'bn-bd-technology': 'technology',
  'bn-bd-health': 'history',
  'bn-bd-local': null,
  'bn-bd-sports': null,
  'bn-bd-analysis': null,
};

/** The one legacy section whose articles are imported as the analysis format instead of news. */
const ANALYSIS_SECTION = 'bn-bd-analysis';

export type Row = Record<string, string>;

/** RFC 4180 CSV: quoted fields may hold commas, line breaks and doubled quotes. The first line is the header. */
export function parseCsv(text: string): Row[] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { record.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      record.push(field); field = '';
      records.push(record); record = [];
    } else field += c;
  }
  if (field !== '' || record.length > 0) { record.push(field); records.push(record); }
  const [header, ...body] = records;
  if (!header) return [];
  return body
    .filter((r) => r.length > 1 || (r[0] ?? '') !== '')
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

/**
 * Text of one paragraph as Tiptap text nodes. The export is plain text, except that one article keeps its underlining as
 * `<u>...</u>`; those spans become the underline mark. No other markup occurs in the export.
 */
function inlineNodes(text: string): Array<Record<string, unknown>> {
  const nodes: Array<Record<string, unknown>> = [];
  let underline = false;
  for (const part of text.split(/(<\/?u>)/)) {
    if (part === '<u>') { underline = true; continue; }
    if (part === '</u>') { underline = false; continue; }
    if (part === '') continue;
    nodes.push(underline ? { type: 'text', text: part, marks: [{ type: 'underline' }] } : { type: 'text', text: part });
  }
  return nodes;
}

/** Splits a plain-text article into paragraphs and checks the result against the news body contract. */
export function legacyBody(content: string): unknown {
  const paragraphs = content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((text) => ({ type: 'paragraph', content: inlineNodes(text) }))
    .filter((p) => p.content.length > 0);
  const doc = { type: 'doc', content: paragraphs };
  const parsed = tiptapBodySchema.safeParse(doc);
  if (!parsed.success) throw new Error(`body does not match the contract: ${parsed.error.issues[0]?.message ?? 'invalid'}`);
  return doc;
}

/** Legacy timestamps are UTC (Strapi). Parsed explicitly so the database session's time zone does not matter. */
export function utcTimestamp(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  return `${v.replace(' ', 'T')}${/[zZ]|[+-]\d\d:?\d\d$/.test(v) ? '' : 'Z'}`;
}

const nullIfEmpty = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export interface LegacyImportReport {
  articles: number;
  alreadyImported: number;
  published: number;
  drafts: number;
  analysis: number;
  withoutSection: number;
  slugsRenamed: string[];
  contributors: number;
  tagLinks: number;
  unmatchedTags: number;
  authorLinksSkipped: number;
}

export function readLegacyTables(dir: string = LEGACY_DIR) {
  const read = (name: string) => parseCsv(readFileSync(join(dir, name), 'utf8'));
  return {
    articles: read('articles.csv'),
    authors: read('authors.csv'),
    authorLinks: read('articles_author_links.csv'),
    categories: read('categories.csv'),
    categoryLinks: read('articles_category_links.csv'),
    tags: read('tags.csv'),
    tagLinks: read('articles_tags_links.csv'),
  };
}

/** Desks and editorial teams are organizations; everyone else is a person. */
const isOrganization = (name: string) => /ডেস্ক|বিভাগ|Desk/.test(name);

export async function importLegacyArticles(pool: Pool, dir: string = LEGACY_DIR): Promise<LegacyImportReport> {
  const t = readLegacyTables(dir);
  return withTransaction(pool, (db) => runImport(db, t));
}

async function runImport(db: PoolClient, t: ReturnType<typeof readLegacyTables>): Promise<LegacyImportReport> {
  const report: LegacyImportReport = {
    articles: 0, alreadyImported: 0, published: 0, drafts: 0, analysis: 0, withoutSection: 0,
    slugsRenamed: [], contributors: 0, tagLinks: 0, unmatchedTags: 0, authorLinksSkipped: 0,
  };

  // Sections: the legacy category id to its site section key.
  // Only the sections that articles use are checked; the English twins of the menu have no articles.
  const usedSectionIds = new Set(t.categoryLinks.map((l) => l.category_id!));
  const legacySlugById = new Map(t.categories.map((c) => [c.id!, c.slug!]));
  const sectionKeyById = new Map<string, string | null>();
  for (const id of usedSectionIds) {
    const slug = legacySlugById.get(id);
    if (!slug || !(slug in LEGACY_SECTION_TO_SITE)) throw new Error(`legacy section id ${id} (${slug ?? 'unknown'}) has no site section in LEGACY_SECTION_TO_SITE`);
    sectionKeyById.set(id, LEGACY_SECTION_TO_SITE[slug]!);
  }
  const sectionIds = new Map<string, string>();
  for (const key of new Set(Object.values(LEGACY_SECTION_TO_SITE).filter((k): k is string => !!k))) {
    const { rows } = await db.query<{ id: string }>('SELECT id FROM category WHERE key = $1', [key]);
    if (!rows[0]) throw new Error(`site section "${key}" is missing: run the seed first`);
    sectionIds.set(key, rows[0].id);
  }

  // Contributors: one per legacy author, matched on the display name so an existing contributor is reused.
  const contributorByAuthor = new Map<string, string>();
  for (const a of t.authors) {
    const name = a.name!.trim();
    const existing = await db.query<{ id: string }>(
      'SELECT id FROM contributor WHERE display_name = $1 ORDER BY created_at LIMIT 1', [name]);
    let id = existing.rows[0]?.id;
    if (!id) {
      const inserted = await db.query<{ id: string }>(
        'INSERT INTO contributor (kind, display_name, bio) VALUES ($1, $2, $3) RETURNING id',
        [isOrganization(name) ? 'organization' : 'person', name, nullIfEmpty(a.bio)]);
      id = inserted.rows[0]!.id;
      report.contributors += 1;
    }
    contributorByAuthor.set(a.id!, id);
  }

  // Tags: a legacy tag row and its partner in the other language share a sync_key. The English slug ("en-<key>")
  // names the tag that the seed already created.
  const tagIdByLegacy = new Map<string, string>();
  const englishSlugBySync = new Map(t.tags.filter((r) => r.locale === 'en').map((r) => [r.sync_key!, r.slug!]));
  for (const row of t.tags) {
    const enSlug = englishSlugBySync.get(row.sync_key!);
    if (!enSlug?.startsWith('en-')) continue;
    const { rows } = await db.query<{ id: string }>('SELECT id FROM tag WHERE key = $1', [enSlug.slice(3)]);
    if (rows[0]) tagIdByLegacy.set(row.id!, rows[0].id);
  }

  const linksByArticle = (rows: Row[], key: string) => {
    const map = new Map<string, Row[]>();
    for (const r of rows) map.set(r[key]!, [...(map.get(r[key]!) ?? []), r]);
    return map;
  };
  const authorsOf = linksByArticle(t.authorLinks, 'article_id');
  const tagsOf = linksByArticle(t.tagLinks, 'article_id');
  const sectionOf = new Map(t.categoryLinks.map((l) => [l.article_id!, l.category_id!]));

  for (const a of t.articles) {
    const legacyId = a.id!;
    const canonicalKey = `legacy:article:${legacyId}`;
    const existing = await db.query('SELECT 1 FROM news WHERE canonical_key = $1', [canonicalKey]);
    if ((existing.rowCount ?? 0) > 0) { report.alreadyImported += 1; continue; }

    const createdAt = utcTimestamp(a.created_at!)!;
    const updatedAt = utcTimestamp(a.updated_at!) ?? createdAt;
    const publishedAt = utcTimestamp(a.published_at!);
    const sectionCode = sectionOf.get(legacyId);
    const legacySection = sectionCode ? legacySlugById.get(sectionCode) : undefined;
    const sectionKey = sectionCode ? sectionKeyById.get(sectionCode) ?? null : null;
    const sectionId = sectionKey ? sectionIds.get(sectionKey)! : null;
    const isAnalysis = legacySection === ANALYSIS_SECTION;
    if (!sectionId) report.withoutSection += 1;
    if (isAnalysis) report.analysis += 1;

    // The slug is unique per language. A clash with another item keeps the item and gets the legacy id appended.
    let slug = a.slug!.trim();
    const clash = await db.query<{ news_id: string }>(
      'SELECT news_id FROM news_slug WHERE locale = $1 AND slug = $2', ['bn-BD', slug]);
    if (clash.rows[0]) { slug = `${slug}-${legacyId}`; report.slugsRenamed.push(`${legacyId}: ${slug}`); }

    const { rows: newsRows } = await db.query<{ id: string }>(
      `INSERT INTO news (canonical_key, status, published_at, created_at, updated_at, short_id, format)
       VALUES ($1, $2, $3, $4, $5, new_short_id($4::timestamptz), $6) RETURNING id`,
      [canonicalKey, publishedAt ? 'PUBLISHED' : 'DRAFT', publishedAt, createdAt, updatedAt, isAnalysis ? 'analysis' : 'news']);
    const newsId = newsRows[0]!.id;

    const { rows: revisionRows } = await db.query<{ id: string }>(
      `INSERT INTO news_revision (news_id, revision_no, changed_by, changed_at, change_reason, approved_at, approved_by, created_at)
       VALUES ($1, 1, 'legacy-import', $2, 'imported from the cipher-press export', $3, $4, $2) RETURNING id`,
      [newsId, updatedAt, publishedAt, publishedAt ? 'legacy-import' : null]);
    const revisionId = revisionRows[0]!.id;

    await db.query(
      `INSERT INTO news_translation (revision_id, locale, title, dek, body, slug, seo_title, seo_description, translation_status, created_at, updated_at)
       VALUES ($1, 'bn-BD', $2, $3, $4, $5, $6, $7, 'original', $8, $9)`,
      [revisionId, a.title!.trim(), nullIfEmpty(a.excerpt), JSON.stringify(legacyBody(a.content ?? '')), slug,
        nullIfEmpty(a.seo_title), nullIfEmpty(a.seo_description), createdAt, updatedAt]);
    await db.query('INSERT INTO news_slug (news_id, locale, slug, is_current) VALUES ($1, $2, $3, true)', [newsId, 'bn-BD', slug]);

    if (sectionId) {
      await db.query('INSERT INTO news_category (news_id, category_id, is_primary) VALUES ($1, $2, true)', [newsId, sectionId]);
    }

    for (const link of authorsOf.get(legacyId) ?? []) {
      const contributorId = contributorByAuthor.get(link.author_id!);
      if (!contributorId) { report.authorLinksSkipped += 1; continue; }
      await db.query(
        `INSERT INTO news_contributor (news_id, contributor_id, role, position) VALUES ($1, $2, 'author', $3)
         ON CONFLICT DO NOTHING`,
        [newsId, contributorId, Number(link.article_order) || 0]);
    }

    for (const link of tagsOf.get(legacyId) ?? []) {
      const tagId = tagIdByLegacy.get(link.tag_id!);
      if (!tagId) { report.unmatchedTags += 1; continue; }
      await db.query('INSERT INTO news_tag (news_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [newsId, tagId]);
      report.tagLinks += 1;
    }

    if (publishedAt) {
      await db.query('UPDATE news SET published_revision_id = $2 WHERE id = $1', [newsId, revisionId]);
      await projectNewsSearch(db, newsId, 'upsert', searchLiveStatuses);
      report.published += 1;
    } else {
      report.drafts += 1;
    }
    report.articles += 1;
  }
  return report;
}
