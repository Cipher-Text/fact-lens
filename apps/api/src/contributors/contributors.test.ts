import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { startTestApp } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;
const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

describe.skipIf(!adminUrl)('contributor profiles (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let deskId: string;
  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
    deskId = (await t.db.pool.query(`SELECT id FROM desk WHERE key = 'opinion'`)).rows[0].id;
  });
  afterAll(() => t?.close());

  const create = (body: unknown, roles = ['reporter']) => t.call({ method: 'POST', url: '/contributors', roles, body });
  let shade = 0;
  /** Each picture differs, because the library keeps one copy of identical bytes. */
  const image = async () => {
    const jpeg = await sharp({ create: { width: 400, height: 400, channels: 3, background: { r: 20 + (shade += 7), g: 100, b: 60 } } }).jpeg().toBuffer();
    const up = await t.upload(jpeg, { roles: ['media_editor'] });
    expect(up.status).toBe(201);
    return up.body.id as string;
  };

  it('creates a person with a picture, a bio, a private email and social links, and lists them by name', async () => {
    const imageId = await image();
    const res = await create({
      displayName: 'Nadia Rahman', bio: 'Reports on rivers.', contactEmail: 'nadia@example.com', imageId,
      socialLinks: { x: 'https://x.com/nadia', facebook: 'https://www.facebook.com/nadia', youtube: '' },
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body).toMatchObject({
      kind: 'person', displayName: 'Nadia Rahman', contactEmail: 'nadia@example.com', imageId, usageCount: 0,
      socialLinks: { facebook: 'https://www.facebook.com/nadia', youtube: null, x: 'https://x.com/nadia', instagram: null, linkedin: null },
    });
    await create({ displayName: 'Aziz Khan' });
    const list = (await t.call({ method: 'GET', url: '/contributors/directory', roles: ['reporter'] })).body;
    expect(list.items.map((p: any) => p.displayName)).toEqual(['Aziz Khan', 'Nadia Rahman']);
    const found = (await t.call({ method: 'GET', url: '/contributors/directory?query=nad', roles: ['reporter'] })).body;
    expect(found.items.map((p: any) => p.id)).toEqual([res.body.id]);
    const paged = (await t.call({ method: 'GET', url: '/contributors/directory?limit=1', roles: ['reporter'] })).body;
    expect(paged.items).toHaveLength(1);
    expect(paged.nextCursor).toBeTruthy();
    const next = (await t.call({ method: 'GET', url: `/contributors/directory?limit=1&cursor=${paged.nextCursor}`, roles: ['reporter'] })).body;
    expect(next.items.map((p: any) => p.displayName)).toEqual(['Nadia Rahman']);
    expect((await t.call({ method: 'GET', url: `/contributors/${res.body.id}`, roles: ['reporter'] })).body.displayName).toBe('Nadia Rahman');
    expect(await t.db.pool.query(`SELECT 1 FROM audit_event WHERE action = 'contributor.create' AND object_id = $1`, [res.body.id])).toHaveProperty('rowCount', 1);
  });

  it('refuses bad input: a link off its network, an unknown image, a bad email, an empty name', async () => {
    expect((await create({ displayName: 'X', socialLinks: { x: 'https://example.com/x' } })).status).toBe(400);
    expect((await create({ displayName: 'X', socialLinks: { x: 'http://x.com/x' } })).status).toBe(400);
    expect((await create({ displayName: 'X', socialLinks: { tiktok: 'https://tiktok.com/x' } })).status).toBe(400);
    expect((await create({ displayName: 'X', imageId: '00000000-0000-4000-8000-000000000000' })).status).toBe(400);
    expect((await create({ displayName: 'X', contactEmail: 'not-an-email' })).status).toBe(400);
    expect((await create({ displayName: '   ' })).status).toBe(400);
    expect((await t.anonymous('GET', '/contributors/directory')).statusCode).toBe(401);
  });

  it('changes only what is sent, and removes a link, the picture or the email when emptied', async () => {
    const imageId = await image();
    const made = await create({ displayName: 'Rima', bio: 'Old', imageId, contactEmail: 'rima@example.com', socialLinks: { x: 'https://x.com/rima', linkedin: 'https://www.linkedin.com/in/rima' } });
    const id = made.body.id as string;
    const put = (body: unknown) => t.call({ method: 'PUT', url: `/contributors/${id}`, roles: ['reporter'], body });

    const renamed = await put({ displayName: 'Rima Akter' });
    expect(renamed.body).toMatchObject({ displayName: 'Rima Akter', bio: 'Old', imageId, contactEmail: 'rima@example.com', socialLinks: { x: 'https://x.com/rima', linkedin: 'https://www.linkedin.com/in/rima' } });
    const links = await put({ socialLinks: { x: '', instagram: 'https://www.instagram.com/rima' } });
    expect(links.body.socialLinks).toEqual({ facebook: null, youtube: null, x: null, instagram: 'https://www.instagram.com/rima', linkedin: null });
    const cleared = await put({ imageId: null, bio: null, contactEmail: null });
    expect(cleared.body).toMatchObject({ imageId: null, bio: null, contactEmail: null, displayName: 'Rima Akter' });
    expect((await put({})).status).toBe(400);
    expect((await put({ socialLinks: { x: 'https://evil.test/x' } })).status).toBe(400);
    expect((await t.call({ method: 'PUT', url: '/contributors/00000000-0000-4000-8000-000000000000', roles: ['reporter'], body: { bio: 'x' } })).status).toBe(404);

    // A picture in use cannot be deleted from the library.
    await put({ imageId });
    expect((await t.call({ method: 'DELETE', url: `/media/${imageId}`, roles: ['media_editor'] })).status).toBe(409);
  });

  it('shows a byline with picture and links on a published news item, never the email', async () => {
    const imageId = await image();
    const made = await create({
      displayName: 'Tania Islam', contactEmail: 'tania@example.com', imageId,
      socialLinks: { linkedin: 'https://www.linkedin.com/in/tania', x: 'https://x.com/tania' },
    });
    const personId = made.body.id as string;
    const slug = 'byline-check';
    const news = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Byline', slug, deskId } });
    const id = news.body.news.id as string;
    expect((await t.call({ method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'], body: { title: 'Byline', body: doc('x'), slug, expectedVersion: 1 } })).status).toBe(200);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: personId, role: 'author' }] } })).status).toBe(200);
    for (const [to, role] of [['EDITOR_REVIEW', 'reporter'], ['READY', 'fact_checker'], ['PUBLISHED', 'managing_editor']] as const) {
      expect((await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: [role], body: { to } })).status).toBe(201);
    }
    const before = (await t.anonymous('GET', `/public/news/en/${slug}`)).json() as any;
    const by = before.contributors[0].contributor;
    expect(by).toMatchObject({ displayName: 'Tania Islam', image: null });
    expect(by.socialLinks).toEqual([{ network: 'x', url: 'https://x.com/tania' }, { network: 'linkedin', url: 'https://www.linkedin.com/in/tania' }]);
    expect(JSON.stringify(before)).not.toContain('tania@example.com');
    expect((await t.anonymous('GET', `/public/media/${imageId}/card`)).statusCode).toBe(404);

    await t.call({ method: 'PUT', url: `/media/${imageId}/rights`, roles: ['media_editor'], body: { attribution: 'Photo: Studio', altText: 'Tania Islam', permittedChannels: ['web'] } });
    const after = (await t.anonymous('GET', `/public/news/en/${slug}`)).json() as any;
    expect(after.contributors[0].contributor.image).toMatchObject({ id: imageId, alt: 'Tania Islam', urls: { card: `/public/media/${imageId}/card` } });
    expect((await t.anonymous('GET', `/public/media/${imageId}/card`)).statusCode).toBe(200);
    expect((await t.call({ method: 'GET', url: `/contributors/${personId}`, roles: ['reporter'] })).body.usageCount).toBe(1);
  });
});
