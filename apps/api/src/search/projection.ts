import { searchConfigFor, type SearchIndexResult } from '@fact-lens/contracts';
import type { Pool, PoolClient } from 'pg';

/** The text of a Tiptap document, with a space between blocks. Words are kept whole; the text configuration splits them. */
export function plainTextOf(node: unknown): string {
  const parts: string[] = [];
  const walk = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    const n = value as { text?: unknown; content?: unknown };
    if (typeof n.text === 'string') parts.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
    parts.push(' ');
  };
  walk(node);
  return parts.join('').replace(/\s+/g, ' ').trim();
}

export type SearchDb = Pool | PoolClient;

/**
 * Makes the search document of one news item match its published version (upsert), or removes it. Idempotent: the
 * same published version always gives the same rows. Takes the database handle so it can run inside a transaction
 * (the API's projection and the seed's legacy import both use it). Plain module: no framework imports.
 */
export async function projectNewsSearch(db: SearchDb, newsId: string, operation: 'upsert' | 'delete', liveStatuses: readonly string[]): Promise<SearchIndexResult> {
  const { rows } = await db.query<{ status: string; published_revision_id: string | null }>(
    'SELECT status, published_revision_id FROM news WHERE id = $1', [newsId]);
  const news = rows[0];
  const live = operation === 'upsert' && !!news?.published_revision_id && liveStatuses.includes(news.status);
  if (!live || !news) {
    await db.query('DELETE FROM news_search WHERE news_id = $1', [newsId]);
    return { indexed: false };
  }
  const translations = await db.query<{ locale: string; title: string; body: unknown }>(
    'SELECT locale, title, body FROM news_translation WHERE revision_id = $1', [news.published_revision_id]);
  const locales = translations.rows.map((t) => t.locale);
  await db.query('DELETE FROM news_search WHERE news_id = $1 AND NOT (locale = ANY($2::text[]))', [newsId, locales]);
  for (const t of translations.rows) {
    await db.query(
      `INSERT INTO news_search (news_id, locale, revision_id, title, body_text, document, indexed_at)
       VALUES ($1, $2, $3, $4, $5,
               setweight(to_tsvector($6::regconfig, $4), 'A') || setweight(to_tsvector($6::regconfig, $5), 'B'), now())
       ON CONFLICT (news_id, locale) DO UPDATE SET revision_id = EXCLUDED.revision_id, title = EXCLUDED.title,
         body_text = EXCLUDED.body_text, document = EXCLUDED.document, indexed_at = now()`,
      [newsId, t.locale, news.published_revision_id, t.title, plainTextOf(t.body), searchConfigFor(t.locale)],
    );
  }
  return { indexed: true };
}
