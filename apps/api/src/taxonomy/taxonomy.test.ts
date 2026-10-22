import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;
const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

describe.skipIf(!adminUrl)('multilingual categories and tags (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let deskId: string;
  let authorId: string;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
    deskId = (await t.db.pool.query(`SELECT id FROM desk WHERE key = 'opinion'`)).rows[0].id;
    authorId = (await t.db.pool.query(`INSERT INTO contributor (display_name) VALUES ('A. Writer') RETURNING id`)).rows[0].id;
  });
  afterAll(() => t?.close());

  const cats = async () => (await t.call({ method: 'GET', url: '/taxonomy/categories' })).body as any[];
  const nav = async (locale: string) => (await t.anonymous('GET', `/public/navigation/${locale}`)).json() as any[];

  /** A story with a Bangla and an English version, published with the given category and tags. */
  async function publish(slug: string, categoryId: string | null, tagIds: string[], withBangla = true) {
    const created = await t.call({ method: 'POST', url: '/stories', roles: ['reporter'], body: { locale: 'en', title: `T ${slug}`, slug, deskId, categoryId } });
    expect(created.status).toBe(201);
    const id = created.body.story.id as string;
    expect((await t.call({ method: 'PUT', url: `/stories/${id}/translations/en`, roles: ['reporter'], body: { title: `T ${slug}`, body: doc('x'), slug, expectedVersion: 1 } })).status).toBe(200);
    if (withBangla) {
      const bn = await t.call({ method: 'PUT', url: `/stories/${id}/translations/bn-BD`, roles: ['reporter'], body: { title: `শিরোনাম ${slug}`, body: doc('লেখা'), slug: `bn-${slug}`, expectedVersion: null } });
      expect(bn.status, JSON.stringify(bn.body)).toBeLessThan(300);
    }
    expect((await t.call({ method: 'PUT', url: `/stories/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } })).status).toBe(200);
    if (tagIds.length) expect((await t.call({ method: 'PUT', url: `/stories/${id}/tags`, roles: ['reporter'], body: { tagIds } })).status).toBe(200);
    for (const [to, role] of [['EDITOR_REVIEW', 'reporter'], ['READY', 'fact_checker'], ['PUBLISHED', 'managing_editor']] as const) {
      const r = await t.call({ method: 'POST', url: `/stories/${id}/transitions`, roles: [role], body: { to } });
      expect(r.status, JSON.stringify(r.body)).toBe(201);
    }
    return id;
  }

  it('is seeded with the cipher-press menu and tags in English and Bangla', async () => {
    const list = await cats();
    expect(list.map((c) => c.key).slice(0, 3)).toEqual(['local', 'national', 'politics']);
    expect(list[0].labels.map((l: any) => l.locale)).toEqual(['bn-BD', 'en']);
    expect(list[0].labels.find((l: any) => l.locale === 'en').description).toMatch(/Jessore/);
    const tags = (await t.call({ method: 'GET', url: '/taxonomy/tags?limit=500' })).body;
    expect(tags.items).toHaveLength(146);
    expect(tags.items.find((x: any) => x.key === 'india').labels.map((l: any) => l.name).sort()).toEqual(['India', 'ভারত']);
  });

  it('serves the menu per language, in order, and never mixes languages', async () => {
    expect((await nav('en')).slice(0, 2)).toEqual([
      { key: 'local', name: 'Local', slug: 'local' }, { key: 'national', name: 'National', slug: 'national' },
    ]);
    expect((await nav('bn-BD'))[0].name).toBe('স্থানীয়');
    expect((await t.anonymous('GET', '/public/navigation/xx')).statusCode).toBe(404);
  });

  it('creates a category, derives its key and address, and lists it last in the menu', async () => {
    const res = await t.call({ method: 'POST', url: '/taxonomy/categories', roles: ['managing_editor'], body: { labels: { en: { name: 'Culture & Arts' }, 'bn-BD': { name: 'সংস্কৃতি' } } } });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.key).toBe('culture-arts');
    expect(res.body.labels.find((l: any) => l.locale === 'bn-BD').slug).toBe('সংস্কৃতি');
    expect((await nav('en')).at(-1)).toEqual({ key: 'culture-arts', name: 'Culture & Arts', slug: 'culture-arts' });
    const audit = await t.db.pool.query(`SELECT 1 FROM audit_event WHERE action = 'taxonomy.category_create' AND object_id = $1`, [res.body.id]);
    expect(audit.rowCount).toBe(1);
  });

  it('needs an explicit key when no name is in Latin letters, and rejects unknown languages', async () => {
    const noKey = await t.call({ method: 'POST', url: '/taxonomy/categories', body: { labels: { 'bn-BD': { name: 'বিজ্ঞান' } } } });
    expect(noKey.status).toBe(400);
    const ok = await t.call({ method: 'POST', url: '/taxonomy/categories', body: { key: 'science', labels: { 'bn-BD': { name: 'বিজ্ঞান' } } } });
    expect(ok.status).toBe(201);
    const bad = await t.call({ method: 'POST', url: '/taxonomy/categories', body: { key: 'x1', labels: { zz: { name: 'X' } } } });
    expect(bad.status).toBe(400);
  });

  it('omits a category from a language it has no name in, and shows it once named', async () => {
    const science = (await cats()).find((c) => c.key === 'science');
    expect((await nav('en')).some((c) => c.key === 'science')).toBe(false);
    const named = await t.call({ method: 'PUT', url: `/taxonomy/categories/${science.id}`, body: { labels: { en: { name: 'Science' } } } });
    expect(named.status).toBe(200);
    expect((await nav('en')).find((c) => c.key === 'science')).toEqual({ key: 'science', name: 'Science', slug: 'science' });
  });

  it('keeps the address when a name changes, and reports a taken address as a conflict', async () => {
    const science = (await cats()).find((c) => c.key === 'science');
    const renamed = await t.call({ method: 'PUT', url: `/taxonomy/categories/${science.id}`, body: { labels: { en: { name: 'Science and Technology' } } } });
    expect(renamed.body.labels.find((l: any) => l.locale === 'en')).toMatchObject({ name: 'Science and Technology', slug: 'science' });
    const clash = await t.call({ method: 'PUT', url: `/taxonomy/categories/${science.id}`, body: { labels: { en: { name: 'Local', slug: 'local' } } } });
    expect(clash.status).toBe(409);
    expect(clash.body.error.details).toMatchObject({ reason: 'slug_taken', locale: 'en', slug: 'local' });
  });

  it('hides a category from the menu without deleting it, and reorders', async () => {
    const list = await cats();
    const sports = list.find((c) => c.key === 'sports');
    await t.call({ method: 'PUT', url: `/taxonomy/categories/${sports.id}`, body: { showInMenu: false } });
    expect((await nav('en')).some((c) => c.key === 'sports')).toBe(false);
    const last = list.find((c) => c.key === 'health');
    const reordered = await t.call({ method: 'PUT', url: '/taxonomy/categories/order', body: { ids: [last.id] } });
    expect(reordered.status).toBe(200);
    expect((await nav('en'))[0].key).toBe('health');
    expect((await nav('en'))[1].key).toBe('local');
  });

  it('only people with taxonomy.manage can change the menu', async () => {
    const res = await t.call({ method: 'POST', url: '/taxonomy/categories', roles: ['reporter'], body: { key: 'nope', labels: { en: { name: 'Nope' } } } });
    expect(res.status).toBe(403);
    expect((await t.anonymous('POST', '/taxonomy/categories', {})).statusCode).toBe(401);
  });

  it('serves tags, category and lists in the language of the page', async () => {
    const [india, usa] = ['india', 'usa'].map(async (k) => (await t.call({ method: 'GET', url: `/taxonomy/tags?query=${k}` })).body.items.find((x: any) => x.key === k));
    const tagIds = [(await india).id, (await usa).id];
    const local = (await cats()).find((c) => c.key === 'local');
    const id = await publish('flood-report', local.id, tagIds);

    const en = (await t.anonymous('GET', '/public/stories/en/flood-report')).json() as any;
    expect(en.category).toEqual({ key: 'local', name: 'Local', slug: 'local' });
    expect(en.tags.map((x: any) => x.name)).toEqual(['India', 'United States']);
    const bn = (await t.anonymous('GET', '/public/stories/bn-BD/bn-flood-report')).json() as any;
    expect(bn.category.name).toBe('স্থানীয়');
    expect(bn.tags.map((x: any) => x.name).sort()).toEqual(['ভারত', 'যুক্তরাষ্ট্র'].sort());

    const byCategory = (await t.anonymous('GET', '/public/stories/en?category=local')).json() as any;
    expect(byCategory.filter).toMatchObject({ type: 'category', name: 'Local' });
    expect(byCategory.items.map((i: any) => i.id)).toEqual([id]);
    const byTagBn = (await t.anonymous('GET', '/public/stories/bn-BD?tag=india')).json() as any;
    expect(byTagBn.items.map((i: any) => i.slug)).toEqual(['bn-flood-report']);
    expect((await t.anonymous('GET', '/public/stories/en?category=no-such')).statusCode).toBe(404);
    expect((await t.anonymous('GET', '/public/stories/en?category=local&tag=india')).statusCode).toBe(400);
  });

  it('leaves a story out of a language it was never translated into', async () => {
    const national = (await cats()).find((c) => c.key === 'national');
    await publish('english-only', national.id, [], false);
    expect(((await t.anonymous('GET', '/public/stories/bn-BD?category=national')).json() as any).items).toEqual([]);
    expect(((await t.anonymous('GET', '/public/stories/en?category=national')).json() as any).items).toHaveLength(1);
  });

  it('does not list unpublished stories, and pages with a cursor', async () => {
    const draft = await t.call({ method: 'POST', url: '/stories', roles: ['reporter'], body: { locale: 'en', title: 'Hidden', slug: 'hidden', deskId } });
    expect(draft.status).toBe(201);
    const all = (await t.anonymous('GET', '/public/stories/en?limit=1')).json() as any;
    expect(all.items).toHaveLength(1);
    expect(all.nextCursor).toBeTruthy();
    const next = (await t.anonymous('GET', `/public/stories/en?limit=5&cursor=${all.nextCursor}`)).json() as any;
    expect(next.items.map((i: any) => i.slug)).not.toContain(all.items[0].slug);
    expect([...all.items, ...next.items].map((i: any) => i.slug)).not.toContain('hidden');
    expect((await t.anonymous('GET', '/public/stories/en?cursor=%21%21')).statusCode).toBe(400);
  });

  it('replaces the tags of a story, limits them, and refuses archived or unknown ones', async () => {
    const created = await t.call({ method: 'POST', url: '/stories', roles: ['reporter'], body: { locale: 'en', title: 'Tagged', slug: 'tagged', deskId } });
    const id = created.body.story.id;
    const items = (await t.call({ method: 'GET', url: '/reference/tags?limit=40', roles: ['reporter'] })).body.items as any[];
    expect(items).toHaveLength(40);
    const set = await t.call({ method: 'PUT', url: `/stories/${id}/tags`, roles: ['reporter'], body: { tagIds: items.slice(0, 3).map((x) => x.id) } });
    expect(set.body).toHaveLength(3);
    const swap = await t.call({ method: 'PUT', url: `/stories/${id}/tags`, roles: ['reporter'], body: { tagIds: [items[5]!.id] } });
    expect(swap.body.map((x: any) => x.id)).toEqual([items[5]!.id]);
    expect((await t.call({ method: 'GET', url: `/stories/${id}`, roles: ['reporter'] })).body.tags).toHaveLength(1);
    expect((await t.call({ method: 'PUT', url: `/stories/${id}/tags`, roles: ['reporter'], body: { tagIds: items.map((x) => x.id) } })).status).toBe(400);
    expect((await t.call({ method: 'PUT', url: `/stories/${id}/tags`, roles: ['reporter'], body: { tagIds: ['00000000-0000-4000-8000-000000000000'] } })).status).toBe(400);
    await t.call({ method: 'PUT', url: `/taxonomy/tags/${items[7]!.id}`, body: { status: 'archived' } });
    expect((await t.call({ method: 'PUT', url: `/stories/${id}/tags`, roles: ['reporter'], body: { tagIds: [items[7]!.id] } })).status).toBe(400);
    expect((await t.call({ method: 'GET', url: '/reference/tags?limit=500', roles: ['reporter'] })).body.items.some((x: any) => x.id === items[7]!.id)).toBe(false);
    expect((await t.call({ method: 'PUT', url: `/stories/${id}/tags`, roles: ['analyst'], body: { tagIds: [] } })).status).toBe(403);
  });

  it('refuses to delete what stories use, and deletes what nobody uses', async () => {
    const used = (await t.call({ method: 'GET', url: '/taxonomy/tags?query=india' })).body.items.find((x: any) => x.key === 'india');
    expect(used.usageCount).toBeGreaterThan(0);
    const refused = await t.call({ method: 'DELETE', url: `/taxonomy/tags/${used.id}` });
    expect(refused.status).toBe(409);
    expect(refused.body.error.details.reason).toBe('in_use');
    const fresh = await t.call({ method: 'POST', url: '/taxonomy/tags', body: { labels: { en: { name: 'Temporary' } } } });
    expect(fresh.status).toBe(201);
    expect((await t.call({ method: 'DELETE', url: `/taxonomy/tags/${fresh.body.id}` })).status).toBe(204);
    expect((await t.call({ method: 'DELETE', url: `/taxonomy/tags/${fresh.body.id}` })).status).toBe(404);
  });

  it('adds a third language with no code change, and uses it everywhere', async () => {
    expect((await t.call({ method: 'POST', url: '/config/locales', roles: ['managing_editor'], body: { code: 'hi', displayName: 'हिन्दी', direction: 'ltr' } })).status).toBe(403);
    const added = await t.call({ method: 'POST', url: '/config/locales', body: { code: 'hi', displayName: 'हिन्दी', direction: 'ltr' } });
    expect(added.status, JSON.stringify(added.body)).toBe(201);
    expect((await t.call({ method: 'POST', url: '/config/locales', body: { code: 'hi', displayName: 'again' } })).status).toBe(409);
    expect((await t.call({ method: 'POST', url: '/config/locales', body: { code: 'Not Valid', displayName: 'x' } })).status).toBe(400);

    expect((await nav('hi'))).toEqual([]);
    const local = (await cats()).find((c) => c.key === 'local');
    const upd = await t.call({ method: 'PUT', url: `/taxonomy/categories/${local.id}`, body: { labels: { hi: { name: 'स्थानीय', slug: 'sthaniya' } } } });
    expect(upd.status, JSON.stringify(upd.body)).toBe(200);
    expect(await nav('hi')).toEqual([{ key: 'local', name: 'स्थानीय', slug: 'sthaniya' }]);
    expect((await nav('en'))[1]).toMatchObject({ key: 'local', name: 'Local' });

    const off = await t.call({ method: 'PUT', url: '/config/locales/hi', body: { active: false } });
    expect(off.body.active).toBe(false);
    expect((await t.anonymous('GET', '/public/navigation/hi')).statusCode).toBe(404);
    expect((await t.call({ method: 'PUT', url: `/taxonomy/categories/${local.id}`, body: { labels: { hi: null } } })).status).toBe(200);
    expect((await t.call({ method: 'GET', url: '/reference/locales', roles: ['reporter'] })).body.map((l: any) => l.code)).not.toContain('hi');
  });

  it('never removes the last name of a category', async () => {
    const business = (await cats()).find((c) => c.key === 'business');
    const res = await t.call({ method: 'PUT', url: `/taxonomy/categories/${business.id}`, body: { labels: { en: null, 'bn-BD': null } } });
    expect(res.status).toBe(400);
    expect((await cats()).find((c) => c.key === 'business').labels).toHaveLength(2);
  });
});
