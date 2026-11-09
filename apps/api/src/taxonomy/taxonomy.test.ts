import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
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

  /** A news item with a Bangla and an English version, published with the given category and tags. */
  async function publish(slug: string, categoryId: string | null, tagIds: string[], withBangla = true) {
    const created = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: `T ${slug}`, slug, deskId, categoryId } });
    expect(created.status).toBe(201);
    const id = created.body.news.id as string;
    expect((await t.call({ method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'], body: { title: `T ${slug}`, body: doc('x'), slug, expectedVersion: 1 } })).status).toBe(200);
    if (withBangla) {
      const bn = await t.call({ method: 'PUT', url: `/news/${id}/translations/bn-BD`, roles: ['reporter'], body: { title: `শিরোনাম ${slug}`, body: doc('লেখা'), slug: `bn-${slug}`, expectedVersion: null } });
      expect(bn.status, JSON.stringify(bn.body)).toBeLessThan(300);
    }
    expect((await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } })).status).toBe(200);
    if (tagIds.length) expect((await t.call({ method: 'PUT', url: `/news/${id}/tags`, roles: ['reporter'], body: { tagIds } })).status).toBe(200);
    for (const [to, role] of [['EDITOR_REVIEW', 'reporter'], ['READY', 'fact_checker'], ['PUBLISHED', 'managing_editor']] as const) {
      const r = await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: [role], body: { to } });
      expect(r.status, JSON.stringify(r.body)).toBe(201);
    }
    return id;
  }

  it('is seeded with the site menu (and its labels in English and Bangla) and the tags', async () => {
    const list = await cats();
    expect(list.map((c) => c.key).slice(0, 5)).toEqual(['geopolitics', 'economy', 'security', 'technology', 'history']);
    expect(list[0].labels.map((l: any) => l.locale)).toEqual(['bn-BD', 'en']);
    expect(list[0].labels.map((l: any) => l.name)).toEqual(['ভূরাজনীতি ও কূটনীতি', 'Geopolitics and Diplomacy']);
    // The address is the key in both languages, and there is no description until editors write one.
    expect(list[0].labels.map((l: any) => [l.slug, l.description])).toEqual([['geopolitics', null], ['geopolitics', null]]);
    const tags = (await t.call({ method: 'GET', url: '/taxonomy/tags?limit=500' })).body;
    expect(tags.items).toHaveLength(146);
    expect(tags.items.find((x: any) => x.key === 'india').labels.map((l: any) => l.name).sort()).toEqual(['India', 'ভারত']);
  });

  it('serves the menu per language, in order, and never mixes languages', async () => {
    expect((await nav('en')).slice(0, 2)).toEqual([
      { key: 'geopolitics', name: 'Geopolitics and Diplomacy', slug: 'geopolitics', children: [] },
      { key: 'economy', name: 'Economy and Trade', slug: 'economy', children: [] },
    ]);
    expect((await nav('bn-BD'))[0].name).toBe('ভূরাজনীতি ও কূটনীতি');
    expect((await t.anonymous('GET', '/public/navigation/xx')).statusCode).toBe(404);
  });

  it('creates a category, derives its key and address, and lists it last in the menu', async () => {
    const res = await t.call({ method: 'POST', url: '/taxonomy/categories', roles: ['managing_editor'], body: { labels: { en: { name: 'Culture & Arts' }, 'bn-BD': { name: 'সংস্কৃতি' } } } });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.key).toBe('culture-arts');
    expect(res.body.labels.find((l: any) => l.locale === 'bn-BD').slug).toBe('সংস্কৃতি');
    expect((await nav('en')).at(-1)).toEqual({ key: 'culture-arts', name: 'Culture & Arts', slug: 'culture-arts', children: [] });
    const audit = await t.db.pool.query(`SELECT 1 FROM audit_event WHERE action = 'taxonomy.category_create' AND object_id = $1`, [res.body.id]);
    expect(audit.rowCount).toBe(1);
  });

  it('nests child menus under a parent, two levels only, and hides a child with its parent', async () => {
    const make = async (key: string, parentId?: string) =>
      t.call({ method: 'POST', url: '/taxonomy/categories', body: { key, parentId, labels: { en: { name: key } } } });
    const parent = await make('world');
    expect(parent.status, JSON.stringify(parent.body)).toBe(201);
    expect(parent.body.parentId).toBeNull();
    const child = await make('asia', parent.body.id);
    expect(child.status, JSON.stringify(child.body)).toBe(201);
    expect(child.body.parentId).toBe(parent.body.id);

    const world = (await nav('en')).find((c) => c.key === 'world');
    expect(world.children).toEqual([{ key: 'asia', name: 'asia', slug: 'asia' }]);
    expect((await nav('en')).some((c) => c.key === 'asia')).toBe(false);

    // Two levels only.
    expect((await make('india-news', child.body.id)).status).toBe(400);
    expect((await t.call({ method: 'PUT', url: `/taxonomy/categories/${parent.body.id}`, body: { parentId: child.body.id } })).status).toBe(400);
    expect((await t.call({ method: 'PUT', url: `/taxonomy/categories/${parent.body.id}`, body: { parentId: parent.body.id } })).status).toBe(400);
    expect((await make('ghost', '00000000-0000-4000-8000-000000000000')).status).toBe(400);

    // A parent with children cannot be deleted.
    expect((await t.call({ method: 'DELETE', url: `/taxonomy/categories/${parent.body.id}` })).status).toBe(409);

    // Hiding the parent hides its children from the menu.
    await t.call({ method: 'PUT', url: `/taxonomy/categories/${parent.body.id}`, body: { showInMenu: false } });
    expect((await nav('en')).some((c) => c.key === 'world')).toBe(false);
    await t.call({ method: 'PUT', url: `/taxonomy/categories/${parent.body.id}`, body: { showInMenu: true } });

    // Moving the child to the top level.
    const moved = await t.call({ method: 'PUT', url: `/taxonomy/categories/${child.body.id}`, body: { parentId: null } });
    expect(moved.body.parentId).toBeNull();
    expect((await nav('en')).find((c) => c.key === 'world').children).toEqual([]);
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
    expect((await nav('en')).find((c) => c.key === 'science')).toEqual({ key: 'science', name: 'Science', slug: 'science', children: [] });
  });

  it('keeps the address when a name changes, and reports a taken address as a conflict', async () => {
    const science = (await cats()).find((c) => c.key === 'science');
    const renamed = await t.call({ method: 'PUT', url: `/taxonomy/categories/${science.id}`, body: { labels: { en: { name: 'Science and Technology' } } } });
    expect(renamed.body.labels.find((l: any) => l.locale === 'en')).toMatchObject({ name: 'Science and Technology', slug: 'science' });
    const clash = await t.call({ method: 'PUT', url: `/taxonomy/categories/${science.id}`, body: { labels: { en: { name: 'Geopolitics', slug: 'geopolitics' } } } });
    expect(clash.status).toBe(409);
    expect(clash.body.error.details).toMatchObject({ reason: 'slug_taken', locale: 'en', slug: 'geopolitics' });
  });

  it('hides a category from the menu without deleting it, and reorders', async () => {
    const list = await cats();
    const economy = list.find((c) => c.key === 'economy');
    await t.call({ method: 'PUT', url: `/taxonomy/categories/${economy.id}`, body: { showInMenu: false } });
    expect((await nav('en')).some((c) => c.key === 'economy')).toBe(false);
    const last = list.find((c) => c.key === 'history');
    const reordered = await t.call({ method: 'PUT', url: '/taxonomy/categories/order', body: { ids: [last.id] } });
    expect(reordered.status).toBe(200);
    expect((await nav('en'))[0].key).toBe('history');
    expect((await nav('en'))[1].key).toBe('geopolitics');
  });

  it('only people with taxonomy.manage can change the menu', async () => {
    const res = await t.call({ method: 'POST', url: '/taxonomy/categories', roles: ['reporter'], body: { key: 'nope', labels: { en: { name: 'Nope' } } } });
    expect(res.status).toBe(403);
    expect((await t.anonymous('POST', '/taxonomy/categories', {})).statusCode).toBe(401);
  });

  it('serves tags, category and lists in the language of the page', async () => {
    const [india, usa] = ['india', 'usa'].map(async (k) => (await t.call({ method: 'GET', url: `/taxonomy/tags?query=${k}` })).body.items.find((x: any) => x.key === k));
    const tagIds = [(await india).id, (await usa).id];
    const local = (await cats()).find((c) => c.key === 'geopolitics');
    const id = await publish('flood-report', local.id, tagIds);

    const en = (await t.anonymous('GET', '/public/news/en/flood-report')).json() as any;
    expect(en.category).toEqual({ key: 'geopolitics', name: 'Geopolitics and Diplomacy', slug: 'geopolitics' });
    expect(en.tags.map((x: any) => x.name)).toEqual(['India', 'United States']);
    const bn = (await t.anonymous('GET', '/public/news/bn-BD/bn-flood-report')).json() as any;
    expect(bn.category.name).toBe('ভূরাজনীতি ও কূটনীতি');
    expect(bn.tags.map((x: any) => x.name).sort()).toEqual(['ভারত', 'যুক্তরাষ্ট্র'].sort());

    const byCategory = (await t.anonymous('GET', '/public/news/en?category=geopolitics')).json() as any;
    expect(byCategory.filter).toMatchObject({ type: 'category', name: 'Geopolitics and Diplomacy' });
    expect(byCategory.items.map((i: any) => i.id)).toEqual([id]);
    expect(byCategory.items[0].shortId).toBe(en.shortId);
    const byTagBn = (await t.anonymous('GET', '/public/news/bn-BD?tag=india')).json() as any;
    expect(byTagBn.items.map((i: any) => i.slug)).toEqual(['bn-flood-report']);
    expect((await t.anonymous('GET', '/public/news/en?category=no-such')).statusCode).toBe(404);
    expect((await t.anonymous('GET', '/public/news/en?category=geopolitics&tag=india')).statusCode).toBe(400);
  });

  it('leaves a news item out of a language it was never translated into', async () => {
    const national = (await cats()).find((c) => c.key === 'economy');
    await publish('english-only', national.id, [], false);
    expect(((await t.anonymous('GET', '/public/news/bn-BD?category=economy')).json() as any).items).toEqual([]);
    expect(((await t.anonymous('GET', '/public/news/en?category=economy')).json() as any).items).toHaveLength(1);
  });

  it('does not list unpublished news, and pages with a cursor', async () => {
    const draft = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Hidden', slug: 'hidden', deskId } });
    expect(draft.status).toBe(201);
    const all = (await t.anonymous('GET', '/public/news/en?limit=1')).json() as any;
    expect(all.items).toHaveLength(1);
    expect(all.nextCursor).toBeTruthy();
    const next = (await t.anonymous('GET', `/public/news/en?limit=5&cursor=${all.nextCursor}`)).json() as any;
    expect(next.items.map((i: any) => i.slug)).not.toContain(all.items[0].slug);
    expect([...all.items, ...next.items].map((i: any) => i.slug)).not.toContain('hidden');
    expect((await t.anonymous('GET', '/public/news/en?cursor=%21%21')).statusCode).toBe(400);
  });

  it('replaces the tags of a news item, limits them, and refuses archived or unknown ones', async () => {
    const created = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Tagged', slug: 'tagged', deskId } });
    const id = created.body.news.id;
    const items = (await t.call({ method: 'GET', url: '/reference/tags?limit=40', roles: ['reporter'] })).body.items as any[];
    expect(items).toHaveLength(40);
    const set = await t.call({ method: 'PUT', url: `/news/${id}/tags`, roles: ['reporter'], body: { tagIds: items.slice(0, 3).map((x) => x.id) } });
    expect(set.body).toHaveLength(3);
    const swap = await t.call({ method: 'PUT', url: `/news/${id}/tags`, roles: ['reporter'], body: { tagIds: [items[5]!.id] } });
    expect(swap.body.map((x: any) => x.id)).toEqual([items[5]!.id]);
    expect((await t.call({ method: 'GET', url: `/news/${id}`, roles: ['reporter'] })).body.tags).toHaveLength(1);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/tags`, roles: ['reporter'], body: { tagIds: items.map((x) => x.id) } })).status).toBe(400);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/tags`, roles: ['reporter'], body: { tagIds: ['00000000-0000-4000-8000-000000000000'] } })).status).toBe(400);
    await t.call({ method: 'PUT', url: `/taxonomy/tags/${items[7]!.id}`, body: { status: 'archived' } });
    expect((await t.call({ method: 'PUT', url: `/news/${id}/tags`, roles: ['reporter'], body: { tagIds: [items[7]!.id] } })).status).toBe(400);
    expect((await t.call({ method: 'GET', url: '/reference/tags?limit=500', roles: ['reporter'] })).body.items.some((x: any) => x.id === items[7]!.id)).toBe(false);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/tags`, roles: ['analyst'], body: { tagIds: [] } })).status).toBe(403);
  });

  it('refuses to delete what news use, and deletes what nobody uses', async () => {
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
    const local = (await cats()).find((c) => c.key === 'geopolitics');
    const upd = await t.call({ method: 'PUT', url: `/taxonomy/categories/${local.id}`, body: { labels: { hi: { name: 'स्थानीय', slug: 'sthaniya' } } } });
    expect(upd.status, JSON.stringify(upd.body)).toBe(200);
    expect(await nav('hi')).toEqual([{ key: 'geopolitics', name: 'स्थानीय', slug: 'sthaniya', children: [] }]);
    expect((await nav('en'))[1]).toMatchObject({ key: 'geopolitics', name: 'Geopolitics and Diplomacy' });

    const off = await t.call({ method: 'PUT', url: '/config/locales/hi', body: { active: false } });
    expect(off.body.active).toBe(false);
    expect((await t.anonymous('GET', '/public/navigation/hi')).statusCode).toBe(404);
    expect((await t.call({ method: 'PUT', url: `/taxonomy/categories/${local.id}`, body: { labels: { hi: null } } })).status).toBe(200);
    expect((await t.call({ method: 'GET', url: '/reference/locales', roles: ['reporter'] })).body.map((l: any) => l.code)).not.toContain('hi');
  });

  it('never removes the last name of a category', async () => {
    const business = (await cats()).find((c) => c.key === 'technology');
    const res = await t.call({ method: 'PUT', url: `/taxonomy/categories/${business.id}`, body: { labels: { en: null, 'bn-BD': null } } });
    expect(res.status).toBe(400);
    expect((await cats()).find((c) => c.key === 'technology').labels).toHaveLength(2);
  });

  it('gives a tag a description per language and one picture, shown publicly only while its rights allow the web', async () => {
    const jpeg = await sharp({ create: { width: 900, height: 500, channels: 3, background: '#3366aa' } }).jpeg().toBuffer();
    const up = await t.upload(jpeg, { roles: ['media_editor'] });
    expect(up.status).toBe(201);
    const imageId = up.body.id as string;

    const made = await t.call({
      method: 'POST', url: '/taxonomy/tags',
      body: { key: 'monsoon', imageId, labels: { en: { name: 'Monsoon', description: 'Rain, floods and the season.' }, 'bn-BD': { name: 'বর্ষা', description: 'বৃষ্টি ও বন্যা।' } } },
    });
    expect(made.status, JSON.stringify(made.body)).toBe(201);
    expect(made.body.imageId).toBe(imageId);
    expect(made.body.labels.find((l: any) => l.locale === 'bn-BD').description).toBe('বৃষ্টি ও বন্যা।');
    expect((await t.call({ method: 'POST', url: '/taxonomy/tags', body: { key: 'bad-img', imageId: '00000000-0000-4000-8000-000000000000', labels: { en: { name: 'Bad' } } } })).status).toBe(400);

    // No credit or licence yet: the page has its text but no picture, and the bytes are refused.
    const listUrl = '/public/news/en?tag=monsoon';
    const before = (await t.anonymous('GET', listUrl)).json() as any;
    expect(before.filter).toMatchObject({ type: 'tag', name: 'Monsoon', description: 'Rain, floods and the season.', image: null });
    expect((await t.anonymous('GET', `/public/media/${imageId}/card`)).statusCode).toBe(404);

    await t.call({ method: 'PUT', url: `/media/${imageId}/rights`, roles: ['media_editor'], body: { attribution: 'Photo: A. Photographer', altText: 'Rain over a river', permittedChannels: ['web'] } });
    const after = (await t.anonymous('GET', listUrl)).json() as any;
    expect(after.filter.image).toMatchObject({ id: imageId, alt: 'Rain over a river', urls: { card: `/public/media/${imageId}/card` } });
    expect((await t.anonymous('GET', `/public/media/${imageId}/card`)).statusCode).toBe(200);
    expect((await t.anonymous('GET', '/public/news/bn-BD?tag=' + encodeURIComponent('বর্ষা'))).statusCode).toBe(200);

    // In use as a tag picture, so the image cannot be deleted; removing the picture frees it and stops serving it.
    expect((await t.call({ method: 'DELETE', url: `/media/${imageId}`, roles: ['media_editor'] })).status).toBe(409);
    const cleared = await t.call({ method: 'PUT', url: `/taxonomy/tags/${made.body.id}`, body: { imageId: null } });
    expect(cleared.body.imageId).toBeNull();
    expect((await t.anonymous('GET', `/public/media/${imageId}/card`)).statusCode).toBe(404);

    const edited = await t.call({ method: 'PUT', url: `/taxonomy/tags/${made.body.id}`, body: { labels: { en: { name: 'Monsoon', description: null } } } });
    expect(edited.body.labels.find((l: any) => l.locale === 'en').description).toBeNull();
  });

  it('keeps one news item in several menu sections, with one primary section', async () => {
    const list = await cats();
    const [local, national, politics] = ['geopolitics', 'economy', 'security'].map((k) => list.find((c) => c.key === k));
    const created = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Many', slug: 'many-sections', deskId, categoryIds: [national.id, politics.id] } });
    expect(created.status).toBe(201);
    const id = created.body.news.id as string;
    // The first of the list is the primary section when categoryId is not given.
    expect(created.body.news).toMatchObject({ categoryId: national.id, categoryIds: [national.id, politics.id] });

    // The primary can be named, but only from the list; otherwise the first of the list is used.
    const moved = await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { categoryId: politics.id, categoryIds: [national.id, politics.id, local.id] } });
    expect(moved.body.news).toMatchObject({ categoryId: politics.id });
    expect(moved.body.news.categoryIds[0]).toBe(politics.id);
    expect([...moved.body.news.categoryIds].sort()).toEqual([local.id, national.id, politics.id].sort());
    const dropped = await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { categoryIds: [local.id] } });
    expect(dropped.body.news).toMatchObject({ categoryId: local.id, categoryIds: [local.id] });
    const dup = await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { categoryIds: [local.id, local.id] } });
    expect(dup.status).toBe(400);
    const unknown = await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { categoryIds: ['00000000-0000-4000-8000-000000000000'] } });
    expect(unknown.status).toBe(400);

    // An older caller that sends one categoryId still gets a single section.
    const single = await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { categoryId: national.id } });
    expect(single.body.news).toMatchObject({ categoryId: national.id, categoryIds: [national.id] });
    await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { categoryId: politics.id, categoryIds: [politics.id, local.id] } });

    // Readers: the news appears under each of its sections, and names the primary first.
    const slug = 'many-sections';
    expect((await t.call({ method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'], body: { title: 'Many', body: doc('x'), slug, expectedVersion: 1 } })).status).toBe(200);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } })).status).toBe(200);
    for (const [to, role] of [['EDITOR_REVIEW', 'reporter'], ['READY', 'fact_checker'], ['PUBLISHED', 'managing_editor']] as const) {
      expect((await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: [role], body: { to } })).status).toBe(201);
    }
    const page = (await t.anonymous('GET', `/public/news/en/${slug}`)).json() as any;
    expect(page.category).toEqual({ key: 'security', name: 'Security and Conflict', slug: 'security' });
    expect(page.categories.map((c: any) => c.key)).toEqual(['security', 'geopolitics']);
    for (const c of ['security', 'geopolitics']) {
      expect(((await t.anonymous('GET', `/public/news/en?category=${c}`)).json() as any).items.map((i: any) => i.id)).toContain(id);
    }
    expect(((await t.anonymous('GET', '/public/news/en?category=economy')).json() as any).items.map((i: any) => i.id)).not.toContain(id);

    // Each section counts the item once, and a section in use cannot be removed.
    const after = await cats();
    expect(after.find((c) => c.key === 'security').usageCount).toBeGreaterThanOrEqual(1);
    expect((await t.call({ method: 'DELETE', url: `/taxonomy/categories/${local.id}` })).status).toBe(409);
  });

  it('has three formats (news, analysis, opinion) that readers can list apart', async () => {
    const business = (await cats()).find((c) => c.key === 'technology');
    const plain = await publish('fmt-news', business.id, []);
    const deep = await publish('fmt-analysis', business.id, []);
    const view = await publish('fmt-opinion', business.id, []);
    const setFormat = (id: string, format: string) => t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { format } });

    // News is the default, on the newsroom object and on the public page.
    expect((await t.call({ method: 'GET', url: `/news/${plain}`, roles: ['reporter'] })).body.news.format).toBe('news');
    expect((await setFormat(deep, 'analysis')).body.news.format).toBe('analysis');
    expect((await setFormat(view, 'opinion')).body.news.format).toBe('opinion');
    expect((await setFormat(view, 'explainer')).status).toBe(400);
    expect(((await t.anonymous('GET', '/public/news/en/fmt-opinion')).json() as any).format).toBe('opinion');

    const ids = async (query: string) => ((await t.anonymous('GET', `/public/news/en?category=technology${query}`)).json() as any).items.map((i: any) => [i.id, i.format]);
    expect((await ids('')).map((x: any) => x[0]).sort()).toEqual([plain, deep, view].sort());
    expect(await ids('&format=analysis')).toEqual([[deep, 'analysis']]);
    expect(await ids('&format=opinion')).toEqual([[view, 'opinion']]);
    expect((await ids('&excludeFormat=opinion')).map((x: any) => x[1]).sort()).toEqual(['analysis', 'news']);
    expect((await t.anonymous('GET', '/public/news/en?format=op-ed')).statusCode).toBe(400);

    // It can be chosen when the item is created.
    const made = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'View', slug: 'fmt-created', deskId, format: 'opinion' } });
    expect(made.body.news.format).toBe('opinion');
    expect((await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Bad', slug: 'fmt-bad', deskId, format: 'blog' } })).status).toBe(400);
  });

  it('has regions as their own list, apart from the menu sections, and a news item can be about several', async () => {
    const regs = async () => (await t.call({ method: 'GET', url: '/taxonomy/regions' })).body as any[];
    const list = await regs();
    expect(list.map((r) => r.key)).toEqual(['americas', 'europe', 'russia', 'middle-east', 'south-asia', 'china', 'asia', 'oceania']);
    expect(list[4].labels.map((l: any) => l.name).sort()).toEqual(['South Asia', 'দক্ষিণ এশিয়া'].sort());
    // Regions are not menu sections.
    expect((await cats()).some((c) => c.key === 'south-asia')).toBe(false);
    expect((await nav('en')).some((c) => c.key === 'south-asia')).toBe(false);
    const publicList = (await t.anonymous('GET', '/public/regions/en')).json() as any[];
    expect(publicList.slice(0, 2)).toEqual([{ key: 'americas', name: 'Americas', slug: 'americas', description: null }, { key: 'europe', name: 'Europe', slug: 'europe', description: null }]);
    expect(((await t.anonymous('GET', '/public/regions/bn-BD')).json() as any[])[4].name).toBe('দক্ষিণ এশিয়া');
    expect((await t.anonymous('GET', '/public/regions/xx')).statusCode).toBe(404);

    const [southAsia, china, europe] = ['south-asia', 'china', 'europe'].map((k) => list.find((r) => r.key === k));
    const business = (await cats()).find((c) => c.key === 'technology');
    const id = await publish('regions-story', business.id, []);
    const set = await t.call({ method: 'PUT', url: `/news/${id}/regions`, roles: ['reporter'], body: { regionIds: [southAsia.id, china.id] } });
    expect(set.status, JSON.stringify(set.body)).toBe(200);
    expect(set.body.map((r: any) => r.key)).toEqual(['south-asia', 'china']);
    expect((await t.call({ method: 'GET', url: `/news/${id}`, roles: ['reporter'] })).body.regions.map((r: any) => r.key)).toEqual(['south-asia', 'china']);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/regions`, roles: ['reporter'], body: { regionIds: [china.id, china.id] } })).status).toBe(400);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/regions`, roles: ['reporter'], body: { regionIds: ['00000000-0000-4000-8000-000000000000'] } })).status).toBe(400);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/regions`, roles: ['fact_checker'], body: { regionIds: [] } })).status).toBe(403);

    // Readers: the page names its regions, and each region lists the item (and an unrelated one does not).
    const page = (await t.anonymous('GET', '/public/news/en/regions-story')).json() as any;
    // In the order of the region list, not alphabetical.
    expect(page.regions).toEqual([{ key: 'south-asia', name: 'South Asia', slug: 'south-asia' }, { key: 'china', name: 'China', slug: 'china' }]);
    for (const r of ['china', 'south-asia']) {
      const byRegion = (await t.anonymous('GET', `/public/news/en?region=${r}`)).json() as any;
      expect(byRegion.filter).toMatchObject({ type: 'region', slug: r });
      expect(byRegion.items.map((i: any) => i.id)).toEqual([id]);
    }
    expect(((await t.anonymous('GET', '/public/news/en?region=europe')).json() as any).items).toEqual([]);
    expect((await t.anonymous('GET', '/public/news/en?region=nowhere')).statusCode).toBe(404);
    expect((await t.anonymous('GET', '/public/news/en?region=china&category=technology')).statusCode).toBe(400);

    // Managing the list: add, name in a language, order, archive; a region in use is archived, not deleted.
    const made = await t.call({ method: 'POST', url: '/taxonomy/regions', body: { labels: { en: { name: 'Africa', description: 'The continent.' } } } });
    expect(made.status, JSON.stringify(made.body)).toBe(201);
    expect(made.body).toMatchObject({ key: 'africa', position: 9, usageCount: 0 });
    expect((await t.call({ method: 'POST', url: '/taxonomy/regions', body: { key: 'africa', labels: { en: { name: 'Africa 2' } } } })).status).toBe(409);
    expect((await t.call({ method: 'POST', url: '/taxonomy/regions', roles: ['reporter'], body: { labels: { en: { name: 'No' } } } })).status).toBe(403);
    // Not named in Bangla yet: left out of the Bangla list.
    expect(((await t.anonymous('GET', '/public/regions/bn-BD')).json() as any[]).some((r) => r.key === 'africa')).toBe(false);
    expect(((await t.anonymous('GET', '/public/regions/en')).json() as any[]).some((r) => r.key === 'africa')).toBe(true);
    const ordered = await t.call({ method: 'PUT', url: '/taxonomy/regions/order', body: { ids: [made.body.id] } });
    expect(ordered.body[0].key).toBe('africa');
    expect((await t.call({ method: 'DELETE', url: `/taxonomy/regions/${china.id}` })).status).toBe(409);
    const archived = await t.call({ method: 'PUT', url: `/taxonomy/regions/${europe.id}`, body: { status: 'archived' } });
    expect(archived.body.status).toBe('archived');
    expect(((await t.anonymous('GET', '/public/regions/en')).json() as any[]).some((r) => r.key === 'europe')).toBe(false);
    expect((await t.call({ method: 'GET', url: '/reference/regions', roles: ['reporter'] })).body.some((r: any) => r.key === 'europe')).toBe(false);
    expect((await t.call({ method: 'DELETE', url: `/taxonomy/regions/${made.body.id}` })).status).toBe(204);
    expect((await regs()).find((r) => r.key === 'china').usageCount).toBe(1);
  });

  it('keeps one primary section per news item in the database, not only in the code', async () => {
    const [a, b] = (await cats()).slice(0, 2);
    const made = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Primary', slug: 'primary-check', deskId, categoryIds: [a.id, b.id], categoryId: b.id } });
    const id = made.body.news.id as string;
    expect(made.body.news).toMatchObject({ categoryId: b.id });
    expect(made.body.news.categoryIds).toEqual([b.id, a.id]);
    // Two primaries for one item is refused by the unique index.
    await expect(t.db.pool.query('UPDATE news_category SET is_primary = true WHERE news_id = $1', [id])).rejects.toMatchObject({ code: '23505' });
    // Moving the primary leaves exactly one.
    await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { categoryId: a.id, categoryIds: [a.id, b.id] } });
    const rows = await t.db.pool.query('SELECT category_id FROM news_category WHERE news_id = $1 AND is_primary', [id]);
    expect(rows.rows.map((r) => r.category_id)).toEqual([a.id]);
    // The old column that repeated it is gone.
    const col = await t.db.pool.query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'news' AND column_name = 'category_id'`);
    expect(col.rowCount).toBe(0);
  });

  it('redirects the old address of a renamed section, region or tag, and stops when it is used again', async () => {
    const regs = (await t.call({ method: 'GET', url: '/taxonomy/regions' })).body as any[];
    const oceania = regs.find((r) => r.key === 'oceania');
    const asia = regs.find((r) => r.key === 'asia');
    const local = (await cats()).find((c) => c.key === 'geopolitics');
    const tag = (await t.call({ method: 'GET', url: '/taxonomy/tags?query=india' })).body.items.find((x: any) => x.key === 'india');
    const rename = (kind: string, id: string, slug: string) =>
      t.call({ method: 'PUT', url: `/taxonomy/${kind}/${id}`, body: { labels: { en: { name: 'Renamed', slug } } } });
    const get = (url: string) => t.anonymous('GET', url);

    for (const [kind, param, item, oldSlug, newSlug] of [
      ['regions', 'region', oceania, 'oceania', 'pacific'], ['categories', 'category', local, 'geopolitics', 'local-news'], ['tags', 'tag', tag, 'india', 'india-news'],
    ] as const) {
      expect((await get(`/public/news/en?${param}=${newSlug}`)).statusCode).toBe(404);
      expect((await rename(kind, item.id, newSlug)).status).toBe(200);
      const moved = await get(`/public/news/en?${param}=${oldSlug}&limit=5`);
      expect(moved.statusCode, `${param} ${oldSlug}`).toBe(301);
      expect(moved.headers.location).toBe(`/public/news/en?limit=5&${param}=${newSlug}`);
      expect((await get(`/public/news/en?${param}=${newSlug}`)).statusCode).toBe(200);
      expect((await get(`/public/news/en?${param}=never-used-${param}`)).statusCode).toBe(404);
    }

    // Used again: the address serves the item itself, and the one it replaced now redirects.
    expect((await rename('regions', oceania.id, 'oceania')).status).toBe(200);
    expect((await get('/public/news/en?region=oceania')).statusCode).toBe(200);
    expect((await get('/public/news/en?region=pacific')).statusCode).toBe(301);
    // Taking another region's old address frees it, so it no longer points at the first.
    expect((await rename('regions', asia.id, 'pacific')).status).toBe(200);
    expect((await get('/public/news/en?region=pacific')).statusCode).toBe(200);

    // A deleted region takes its history with it.
    const gone = await t.call({ method: 'POST', url: '/taxonomy/regions', body: { key: 'antarctica', labels: { en: { name: 'Antarctica' } } } });
    await rename('regions', gone.body.id, 'south-pole');
    expect(await t.db.pool.query('SELECT 1 FROM taxonomy_slug_history WHERE region_id = $1', [gone.body.id])).toHaveProperty('rowCount', 1);
    expect((await t.call({ method: 'DELETE', url: `/taxonomy/regions/${gone.body.id}` })).status).toBe(204);
    expect(await t.db.pool.query('SELECT 1 FROM taxonomy_slug_history WHERE region_id = $1', [gone.body.id])).toHaveProperty('rowCount', 0);
  });

  it('sets a lead image on the open revision, and shows it on the public lists while it is cleared for the web', async () => {
    const economy = (await cats()).find((c) => c.key === 'economy');
    const jpeg = await sharp({ create: { width: 800, height: 450, channels: 3, background: '#2255aa' } }).jpeg().toBuffer();
    const up = await t.upload(jpeg, { roles: ['media_editor'] });
    expect(up.status).toBe(201);
    const imageId = up.body.id as string;

    const created = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Lead', slug: 'lead-image', deskId, categoryIds: [economy.id] } });
    const id = created.body.news.id as string;
    expect((await t.call({ method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'], body: { title: 'Lead', body: doc('x'), slug: 'lead-image', expectedVersion: 1 } })).status).toBe(200);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } })).status).toBe(200);

    // Set, replace by nothing, set again; an unknown picture and a missing news item are refused.
    const set = await t.call({ method: 'PUT', url: `/news/${id}/lead-image`, roles: ['reporter'], body: { mediaAssetId: imageId } });
    expect(set.status, JSON.stringify(set.body)).toBe(200);
    expect(set.body.media.filter((m: any) => m.role === 'lead').map((m: any) => m.id)).toEqual([imageId]);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/lead-image`, roles: ['reporter'], body: { mediaAssetId: null } })).body.media.filter((m: any) => m.role === 'lead')).toEqual([]);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/lead-image`, roles: ['reporter'], body: { mediaAssetId: imageId } })).status).toBe(200);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/lead-image`, roles: ['reporter'], body: { mediaAssetId: '00000000-0000-4000-8000-000000000000' } })).status).toBe(400);
    expect((await t.call({ method: 'PUT', url: '/news/00000000-0000-4000-8000-000000000000/lead-image', roles: ['reporter'], body: { mediaAssetId: null } })).status).toBe(404);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/lead-image`, roles: ['fact_checker'], body: { mediaAssetId: null } })).status).toBe(403);
    // The picture is in use, so it cannot be deleted from the library.
    expect((await t.call({ method: 'DELETE', url: `/media/${imageId}`, roles: ['media_editor'] })).status).toBe(409);

    // Publishing needs a credit or licence on every picture of the revision, the lead image included.
    for (const [to, role] of [['EDITOR_REVIEW', 'reporter'], ['READY', 'fact_checker']] as const) {
      expect((await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: [role], body: { to } })).status).toBe(201);
    }
    expect((await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: ['managing_editor'], body: { to: 'PUBLISHED' } })).status).toBe(422);
    const rights = (body: object) => t.call({ method: 'PUT', url: `/media/${imageId}/rights`, roles: ['media_editor'], body });
    expect((await rights({ attribution: 'Photo: Studio', altText: 'A blue field', permittedChannels: ['web'] })).status).toBe(200);
    expect((await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: ['managing_editor'], body: { to: 'PUBLISHED' } })).status).toBe(201);
    // Submitted: locked until a new revision is opened.
    expect((await t.call({ method: 'PUT', url: `/news/${id}/lead-image`, roles: ['reporter'], body: { mediaAssetId: null } })).status).toBe(409);

    // Cleared for the web, it is on the lists with its derivatives; take the web channel away and it is not offered.
    const imageOf = async () => ((await t.anonymous('GET', '/public/news/en?category=economy')).json() as any).items.find((i: any) => i.id === id).image;
    expect(await imageOf()).toMatchObject({ id: imageId, alt: 'A blue field', attribution: 'Photo: Studio', urls: { card: `/public/media/${imageId}/card` } });
    expect((await t.anonymous('GET', `/public/media/${imageId}/card`)).statusCode).toBe(200);
    expect((await rights({ attribution: 'Photo: Studio', altText: 'A blue field', permittedChannels: ['print'] })).status).toBe(200);
    expect(await imageOf()).toBeNull();
    expect((await t.anonymous('GET', `/public/media/${imageId}/card`)).statusCode).toBe(404);
    // A news item with no lead image has image: null on every list.
    const plain = await publish('no-lead-image', economy.id, []);
    const items = ((await t.anonymous('GET', '/public/news/en?category=economy')).json() as any).items;
    expect(items.find((i: any) => i.id === plain).image).toBeNull();
  });
});
