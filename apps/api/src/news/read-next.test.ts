import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;
const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

describe.skipIf(!adminUrl)('read next (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let deskId: string;
  let authorX: string;
  let tag1: string;
  let tag2: string;
  let region1: string;
  let cat1: string;
  let cat2: string;
  let n = 0;

  const made = async (url: string, body: object): Promise<string> => {
    const res = await t.call({ method: 'POST', url, body });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res.body.id as string;
  };
  /** Each item gets a section of its own unless it names one, so a plain item is never related by accident. */
  const ownSection = async (slug: string) => made('/taxonomy/categories', { key: `rn-own-${slug}`, labels: { en: { name: `Rn section ${slug}` } } });

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
    deskId = (await t.db.pool.query(`SELECT id FROM desk WHERE key = 'opinion'`)).rows[0].id;
    authorX = (await t.db.pool.query(`INSERT INTO contributor (display_name) VALUES ('Writer X') RETURNING id`)).rows[0].id;
    tag1 = await made('/taxonomy/tags', { key: 'rn-flood', labels: { en: { name: 'Rn flood' } } });
    tag2 = await made('/taxonomy/tags', { key: 'rn-budget', labels: { en: { name: 'Rn budget' } } });
    region1 = await made('/taxonomy/regions', { key: 'rn-south', labels: { en: { name: 'Rn south' } } });
    cat1 = await made('/taxonomy/categories', { key: 'rn-env', labels: { en: { name: 'Rn environment' } } });
    cat2 = await made('/taxonomy/categories', { key: 'rn-econ', labels: { en: { name: 'Rn economy' } } });
  });
  afterAll(() => t?.close());

  /** A live English item (or English and Bangla), with the given sections, tags, regions, format and author. */
  async function item(slug: string, o: { format?: 'news' | 'analysis' | 'opinion'; cats?: string[]; tags?: string[]; regions?: string[]; authors?: string[]; bn?: boolean } = {}) {
    n += 1;
    const sections = o.cats ?? [await ownSection(slug)];
    const authors = o.authors ?? [(await t.db.pool.query(`INSERT INTO contributor (display_name) VALUES ($1) RETURNING id`, [`Rn writer ${slug}`])).rows[0].id as string];
    const created = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: `Title ${slug}`, slug, deskId } });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const id = created.body.news.id as string;
    const en = await t.call({ method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'], body: { title: `Title ${slug}`, body: doc(`Body ${n}`), slug, expectedVersion: 1 } });
    expect(en.status, JSON.stringify(en.body)).toBe(200);
    if (o.bn) {
      const bn = await t.call({ method: 'PUT', url: `/news/${id}/translations/bn-BD`, roles: ['reporter'], body: { title: `শিরোনাম ${slug}`, body: doc(`বিষয়বস্তু ${n}`), slug: `bn-${slug}`, expectedVersion: null } });
      expect(bn.status, JSON.stringify(bn.body)).toBe(200);
    }
    const meta = await t.call({
      method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'],
      body: { format: o.format ?? 'news', categoryIds: sections, contributors: authors.map((contributorId) => ({ contributorId, role: 'author' })) },
    });
    expect(meta.status, JSON.stringify(meta.body)).toBe(200);
    if (o.tags) expect((await t.call({ method: 'PUT', url: `/news/${id}/tags`, roles: ['reporter'], body: { tagIds: o.tags } })).status).toBe(200);
    if (o.regions) expect((await t.call({ method: 'PUT', url: `/news/${id}/regions`, roles: ['reporter'], body: { regionIds: o.regions } })).status).toBe(200);
    return id;
  }
  async function publish(id: string) {
    const sent = await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: ['reporter'], body: { to: 'EDITOR_REVIEW' } });
    expect(sent.status, JSON.stringify(sent.body)).toBe(201);
    expect((await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: ['fact_checker'], body: { to: 'READY' } })).status).toBe(201);
    const done = await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: ['managing_editor'], body: { to: 'PUBLISHED' } });
    expect(done.status, JSON.stringify(done.body)).toBe(201);
    return id;
  }
  const live = async (o: Parameters<typeof item>[1] & { slug: string }) => publish(await item(o.slug, o));

  const ref = async (id: string) => {
    const { rows } = await t.db.pool.query(`SELECT p.short_id, ss.slug FROM news p JOIN news_slug ss ON ss.news_id = p.id AND ss.locale = 'en' AND ss.is_current WHERE p.id = $1`, [id]);
    return `${rows[0].slug}-${rows[0].short_id}`;
  };
  const relatedOf = async (id: string, query = '', locale = 'en') => {
    const res = await t.anonymous('GET', `/public/news/${locale}/${await ref(id)}/related${query}`);
    return { status: res.statusCode, body: res.json() as any, headers: res.headers };
  };
  const ids = (body: { items: Array<{ id: string }> }) => body.items.map((i) => i.id);

  it('lists the editor picks first, in order, then the best matches', async () => {
    const article = await live({ slug: 'rn-article', tags: [tag1] });
    const pick = await live({ slug: 'rn-pick' });
    const tagged = await live({ slug: 'rn-tagged', tags: [tag1] });
    expect((await t.call({ method: 'PUT', url: `/news/${article}/related`, roles: ['reporter'], body: { related: [{ newsId: pick, position: 1 }] } })).status).toBe(200);
    const res = await relatedOf(article);
    expect(res.status).toBe(200);
    expect(ids(res.body)).toEqual([pick, tagged]);
    expect(res.headers['cache-control']).toBe('public, max-age=60, stale-while-revalidate=300');
    expect(res.body.items[0]).toEqual(expect.objectContaining({ title: 'Title rn-pick', readingMinutes: expect.any(Number) }));
  });

  it('scores a shared tag above a shared region, and a shared region above a shared section', async () => {
    const article = await live({ slug: 'rn-score', tags: [tag2], regions: [region1], cats: [cat2] });
    const sectionOnly = await live({ slug: 'rn-section', cats: [cat2] });
    const regionOnly = await live({ slug: 'rn-region', regions: [region1] });
    const tagOnly = await live({ slug: 'rn-tag', tags: [tag2] });
    const res = await relatedOf(article);
    expect(ids(res.body)).toEqual([tagOnly, regionOnly, sectionOnly]);
  });

  it('puts the newer item first when two items score the same', async () => {
    const article = await live({ slug: 'rn-tie', tags: [tag2] });
    const older = await live({ slug: 'rn-tie-old', tags: [tag2] });
    const newer = await live({ slug: 'rn-tie-new', tags: [tag2] });
    const res = await relatedOf(article, '?limit=3');
    expect(ids(res.body).slice(0, 2)).toEqual([newer, older]);
  });

  it('never lists the article itself, drafts, archived items or items without a version in the locale', async () => {
    const article = await live({ slug: 'rn-exclude', tags: [tag1] });
    const draft = await item('rn-draft', { tags: [tag1] });
    const archived = await live({ slug: 'rn-archived', tags: [tag1] });
    await t.db.pool.query(`UPDATE news SET status = 'ARCHIVED' WHERE id = $1`, [archived]);
    const english = await live({ slug: 'rn-english-only', tags: [tag1] });
    const res = await relatedOf(article);
    expect(ids(res.body)).not.toContain(article);
    expect(ids(res.body)).not.toContain(draft);
    expect(ids(res.body)).not.toContain(archived);
    expect(ids(res.body)).toContain(english);
  });

  it('skips an editor pick that is no longer live', async () => {
    const article = await live({ slug: 'rn-stale-host' });
    const gone = await live({ slug: 'rn-stale-pick' });
    const other = await live({ slug: 'rn-stale-other', tags: [tag2] });
    const host = await live({ slug: 'rn-stale-link', tags: [tag2] });
    expect((await t.call({ method: 'PUT', url: `/news/${host}/related`, roles: ['reporter'], body: { related: [{ newsId: gone, position: 1 }] } })).status).toBe(200);
    await t.db.pool.query(`UPDATE news SET status = 'ARCHIVED' WHERE id = $1`, [gone]);
    const res = await relatedOf(host);
    expect(ids(res.body)).not.toContain(gone);
    expect(ids(res.body)).toContain(other);
    void article;
  });

  it('allows at most one opinion piece, and only one that shares a tag with the article', async () => {
    const article = await live({ slug: 'rn-op-article', tags: [tag1] });
    const opinionOne = await live({ slug: 'rn-op-one', format: 'opinion', tags: [tag1] });
    const opinionTwo = await live({ slug: 'rn-op-two', format: 'opinion', tags: [tag1] });
    const opinionNoTag = await live({ slug: 'rn-op-other', format: 'opinion', tags: [tag2] });
    const res = await relatedOf(article, '?limit=3');
    const opinions = res.body.items.filter((i: { format: string }) => i.format === 'opinion').map((i: { id: string }) => i.id);
    expect(opinions).toEqual([opinionTwo]);
    expect(ids(res.body)).not.toContain(opinionOne);
    expect(ids(res.body)).not.toContain(opinionNoTag);
  });

  it('allows at most two items from the same author', async () => {
    const article = await live({ slug: 'rn-author-article', tags: [tag1] });
    const a1 = await live({ slug: 'rn-author-a1', authors: [authorX], tags: [tag1] });
    const a2 = await live({ slug: 'rn-author-a2', authors: [authorX], tags: [tag1] });
    const a3 = await live({ slug: 'rn-author-a3', authors: [authorX], tags: [tag1] });
    const res = await relatedOf(article, '?limit=3');
    expect(ids(res.body)).toContain(a3);
    expect(ids(res.body)).toContain(a2);
    expect(ids(res.body)).not.toContain(a1);
    expect(res.body.items.filter((i: { id: string }) => [a1, a2, a3].includes(i.id))).toHaveLength(2);
  });

  it('fills the list with the newest items when nothing is related', async () => {
    const article = await live({ slug: 'rn-lonely' });
    const res = await relatedOf(article, '?limit=3');
    expect(res.body.items).toHaveLength(3);
    expect(ids(res.body)).not.toContain(article);
  });

  it('honours the limit', async () => {
    const article = await live({ slug: 'rn-limit', tags: [tag1] });
    await live({ slug: 'rn-limit-a', tags: [tag1] });
    const res = await relatedOf(article, '?limit=1');
    expect(res.body.items).toHaveLength(1);
  });

  it('never shows an English-only item under a Bangla article', async () => {
    const bnArticle = await live({ slug: 'rn-bn-host', tags: [tag1], bn: true });
    const englishOnly = await live({ slug: 'rn-bn-english', tags: [tag1] });
    const bnMatch = await live({ slug: 'rn-bn-match', tags: [tag1], bn: true });
    const res = await relatedOf(bnArticle, '', 'bn-BD');
    expect(res.status).toBe(200);
    expect(ids(res.body)).not.toContain(englishOnly);
    expect(ids(res.body)).toContain(bnMatch);
  });

  it('answers 404 for an unknown address and a bare slug', async () => {
    expect((await t.anonymous('GET', '/public/news/en/no-such-item-abc123/related')).statusCode).toBe(404);
    expect((await t.anonymous('GET', '/public/news/en/rn-limit/related')).statusCode).toBe(404);
    expect((await t.anonymous('GET', '/public/news/zz/rn-limit-abc123/related')).statusCode).toBe(404);
  });
});
