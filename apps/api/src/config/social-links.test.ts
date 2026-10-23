import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('social links (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
  });
  afterAll(() => t?.close());

  const put = (body: unknown, roles?: string[]) => t.call({ method: 'PUT', url: '/config/social-links', body, ...(roles ? { roles } : {}) });
  const publicLinks = async () => (await t.anonymous('GET', '/public/site/social-links')).json() as { links: Array<{ network: string; url: string }> };

  it('starts with nothing set, so the site keeps its default links', async () => {
    expect((await t.call({ method: 'GET', url: '/config/social-links' })).body).toEqual({ facebook: null, youtube: null, x: null, instagram: null, linkedin: null });
    expect(await publicLinks()).toEqual({ links: [] });
  });

  it('lets only configuration managers read and change them', async () => {
    expect((await t.call({ method: 'GET', url: '/config/social-links', roles: ['reporter'] })).status).toBe(403);
    expect((await put({ x: 'https://x.com/factlens' }, ['managing_editor'])).status).toBe(403);
  });

  it('saves addresses, serves only the ones set, in the site order, and keeps a version and an audit record', async () => {
    const res = await put({ youtube: ' https://www.youtube.com/@factlens ', facebook: 'https://www.facebook.com/factlens', x: '', instagram: null });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body).toEqual({ facebook: 'https://www.facebook.com/factlens', youtube: 'https://www.youtube.com/@factlens', x: null, instagram: null, linkedin: null });
    expect(await publicLinks()).toEqual({ links: [
      { network: 'facebook', url: 'https://www.facebook.com/factlens' },
      { network: 'youtube', url: 'https://www.youtube.com/@factlens' },
    ] });
    expect((await t.anonymous('GET', '/public/site/social-links')).headers['cache-control']).toContain('public');

    await put({ facebook: 'https://www.facebook.com/factlens' }); // a second save: youtube goes back to the default
    expect((await publicLinks()).links).toHaveLength(1);
    const row = (await t.db.pool.query(`SELECT version FROM configuration WHERE key = 'site.social_links'`)).rows[0];
    expect(row.version).toBe(2);
    expect((await t.db.pool.query(`SELECT 1 FROM audit_event WHERE action = 'config.social_links_update'`)).rowCount).toBe(2);
  });

  it('refuses an address that is not https, not on the network, or has a password in it', async () => {
    for (const body of [
      { facebook: 'http://www.facebook.com/factlens' },
      { facebook: 'https://evil.example/facebook.com' },
      { facebook: 'https://facebook.com.evil.example/x' },
      { x: 'https://www.facebook.com/factlens' },
      { linkedin: 'javascript:alert(1)' },
      { instagram: 'https://user:pw@instagram.com/x' },
      { tiktok: 'https://tiktok.com/@x' },
    ]) {
      expect((await put(body)).status, JSON.stringify(body)).toBe(400);
    }
  });
});
