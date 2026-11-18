import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INTERNAL_TOKEN_HEADER } from '@fact-lens/contracts';
import { startTestApp, TEST_INTERNAL_TOKEN } from '../test-harness';
import { plainTextOf, SearchService } from './search.service';

const adminUrl = process.env.TEST_DATABASE_URL;
const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

describe('plainTextOf', () => {
  it('joins the text of every block with spaces and keeps words whole', () => {
    const body = { type: 'doc', content: [
      { type: 'heading', content: [{ type: 'text', text: 'Floods' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'বাংলা শব্দ' }, { type: 'text', text: ' end' }] },
    ] };
    expect(plainTextOf(body)).toBe('Floods বাংলা শব্দ end');
  });
});

describe.skipIf(!adminUrl)('public search (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let deskId: string;
  let catEnv: string;
  let catEcon: string;
  let n = 0;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!, { internalToken: TEST_INTERNAL_TOKEN });
    deskId = (await t.db.pool.query(`SELECT id FROM desk WHERE key = 'opinion'`)).rows[0].id;
    catEnv = (await t.call({ method: 'POST', url: '/taxonomy/categories', body: { key: 'sr-env', labels: { en: { name: 'Sr environment' } } } })).body.id;
    catEcon = (await t.call({ method: 'POST', url: '/taxonomy/categories', body: { key: 'sr-econ', labels: { en: { name: 'Sr economy' } } } })).body.id;
  });
  afterAll(() => t?.close());

  /** Calls the internal endpoint the worker uses. */
  const index = (id: string, operation: 'upsert' | 'delete' = 'upsert') =>
    t.app.inject({ method: 'POST', url: `/internal/search/${id}`, headers: { [INTERNAL_TOKEN_HEADER]: TEST_INTERNAL_TOKEN }, payload: { operation } });

  /** A news item with an English version (and optionally a Bangla one), published, and indexed. */
  async function published(slug: string, o: { title: string; body: string; cat?: string; bn?: { title: string; body: string } } | { title: string; body: string; cat?: string; bn?: undefined }) {
    n += 1;
    const author = (await t.db.pool.query(`INSERT INTO contributor (display_name) VALUES ($1) RETURNING id`, [`Search writer ${n}`])).rows[0].id as string;
    const created = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: o.title, slug, deskId } });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const id = created.body.news.id as string;
    const en = await t.call({ method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'], body: { title: o.title, body: doc(o.body), slug, expectedVersion: 1 } });
    expect(en.status, JSON.stringify(en.body)).toBe(200);
    if (o.bn) {
      const bn = await t.call({ method: 'PUT', url: `/news/${id}/translations/bn-BD`, roles: ['reporter'], body: { title: o.bn.title, body: doc(o.bn.body), slug: `bn-${slug}`, expectedVersion: null } });
      expect(bn.status, JSON.stringify(bn.body)).toBe(200);
    }
    const meta = await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { format: 'news', categoryIds: [o.cat ?? catEnv], contributors: [{ contributorId: author, role: 'author' }] } });
    expect(meta.status, JSON.stringify(meta.body)).toBe(200);
    for (const [who, to] of [['reporter', 'EDITOR_REVIEW'], ['fact_checker', 'READY'], ['managing_editor', 'PUBLISHED']] as const) {
      const r = await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: [who], body: { to } });
      expect(r.status, JSON.stringify(r.body)).toBe(201);
    }
    expect((await index(id)).statusCode).toBe(200);
    return id;
  }

  const search = async (q: string, query = '') => {
    const res = await t.anonymous('GET', `/public/search/en?q=${encodeURIComponent(q)}${query}`);
    return { status: res.statusCode, body: res.json() as any, headers: res.headers };
  };
  const ids = (body: { items: Array<{ id: string }> }) => body.items.map((i) => i.id);

  it('finds a published item by a word in its body, and never a draft', async () => {
    const hit = await published('sr-harbour', { title: 'Harbour works begin', body: 'Dredging the lagoon channel this month.' });
    const draft = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Lagoon draft only', slug: 'sr-draft-lagoon', deskId } });
    expect(draft.status).toBe(201);
    const res = await search('lagoon');
    expect(res.status).toBe(200);
    expect(ids(res.body)).toEqual([hit]);
    expect(res.headers['cache-control']).toBe('public, max-age=30, stale-while-revalidate=120');
  });

  it('ranks a title match above a body-only match', async () => {
    const bodyOnly = await published('sr-rank-body', { title: 'Unrelated headline', body: 'Reservoir levels rose after rain.' });
    const titled = await published('sr-rank-title', { title: 'Reservoir repairs finished', body: 'Crews worked nights.' });
    const res = await search('reservoir');
    expect(ids(res.body).slice(0, 2)).toEqual([titled, bodyOnly]);
  });

  it('finds a title with a typo', async () => {
    const id = await published('sr-typo', { title: 'Flood warning issued', body: 'Water rising in the delta.' });
    const res = await search('Flod');
    expect(ids(res.body)).toContain(id);
  });

  it('keeps languages apart: a Bangla search finds Bangla text only, and English search never shows Bangla items', async () => {
    const bn = await published('sr-bn', { title: 'Bangla rivers', body: 'English words here.', bn: { title: 'নদীর খবর', body: 'বাংলা পাঠ্য এখানে।' } });
    const englishOnly = await published('sr-bn-en', { title: 'Rivers in English', body: 'Only English text.' });
    const bnRes = await t.anonymous('GET', `/public/search/bn-BD?q=${encodeURIComponent('নদীর')}`);
    expect(bnRes.statusCode).toBe(200);
    expect(ids(bnRes.json())).toEqual([bn]);
    expect(ids(bnRes.json())).not.toContain(englishOnly);
    const enRes = await search('নদীর');
    expect(enRes.body.items).toEqual([]);
    expect(ids((await search('Bangla')).body)).toContain(bn);
  });

  it('removes an item when it is archived and reindexed', async () => {
    const id = await published('sr-archive', { title: 'Glacier retreat report', body: 'Ice loss over a decade.' });
    expect(ids((await search('glacier')).body)).toContain(id);
    await t.db.pool.query(`UPDATE news SET status = 'ARCHIVED' WHERE id = $1`, [id]);
    expect((await index(id, 'delete')).statusCode).toBe(200);
    expect(ids((await search('glacier')).body)).not.toContain(id);
  });

  it('filters by section', async () => {
    const econ = await published('sr-econ-item', { title: 'Tariff talks widen', body: 'Trade ministers met.', cat: catEcon });
    const env = await published('sr-env-item', { title: 'Tariff on river water', body: 'Environment desk report.', cat: catEnv });
    const res = await search('tariff', '&category=sr-economy');
    expect(ids(res.body)).toContain(econ);
    expect(ids(res.body)).not.toContain(env);
  });

  it('pages with a cursor, without repeats', async () => {
    const a = await published('sr-page-a', { title: 'Monsoon pages one', body: 'Monsoon monsoon.' });
    const b = await published('sr-page-b', { title: 'Monsoon pages two', body: 'Monsoon monsoon.' });
    const first = await search('monsoon', '&limit=1');
    expect(first.body.items).toHaveLength(1);
    expect(first.body.nextCursor).not.toBeNull();
    const second = await search('monsoon', `&limit=1&cursor=${encodeURIComponent(first.body.nextCursor)}`);
    expect(second.body.items).toHaveLength(1);
    expect(second.body.items[0].id).not.toBe(first.body.items[0].id);
    expect([a, b]).toContain(second.body.items[0].id);
  });

  it('returns nothing for an empty or one-letter query, refuses an over-long query, and a bad cursor or limit', async () => {
    expect((await search('')).body.items).toEqual([]);
    expect((await search('x')).body.items).toEqual([]);
    expect((await search('a'.repeat(201))).status).toBe(400);
    expect((await search('flood', '&cursor=%%%')).status).toBe(400);
    expect((await search('flood', '&limit=500')).status).toBe(400);
    expect((await t.anonymous('GET', '/public/search/zz?q=flood')).statusCode).toBe(404);
  });

  it('rebuilds the documents from the stored text, removing stray rows', async () => {
    const id = await published('sr-reindex', { title: 'Reindex keeps text', body: 'Persistent words.' });
    const archived = await published('sr-reindex-gone', { title: 'Gone soon', body: 'Stray words.' });
    await t.db.pool.query(`UPDATE news SET status = 'ARCHIVED' WHERE id = $1`, [archived]);
    const service = t.app.get(SearchService);
    const result = await service.reindex();
    expect(result.indexed).toBeGreaterThan(0);
    expect(result.removed).toBeGreaterThanOrEqual(1);
    expect(ids((await search('persistent')).body)).toContain(id);
    expect(ids((await search('stray')).body)).not.toContain(archived);
    const again = await service.reindex();
    expect(again.removed).toBe(0);
  });
});
