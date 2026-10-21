import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('reference data (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
  });
  afterAll(() => t?.close());

  const get = (url: string, roles = ['reporter']) => t.call({ method: 'GET', url, roles });

  it('lists desks, locales and categories for editorial staff only', async () => {
    const desks = await get('/reference/desks');
    expect(desks.status).toBe(200);
    expect(desks.body.map((d: any) => d.key)).toEqual(['data-research', 'health-science', 'jessore-news', 'opinion']);
    expect((await get('/reference/locales')).body.map((l: any) => l.code)).toEqual(['bn-BD', 'en']);

    const cats = await get('/reference/categories');
    expect(cats.body).toHaveLength(9);
    expect(cats.body[0]).toMatchObject({ key: 'local', labels: [{ locale: 'bn-BD', name: 'স্থানীয়' }, { locale: 'en', name: 'Local' }] });

    for (const url of ['/reference/desks', '/reference/locales', '/reference/categories', '/contributors']) {
      expect((await get(url, ['analyst'])).status).toBe(403);
      expect((await t.anonymous('GET', url)).statusCode).toBe(401);
    }
  });

  it('hides inactive desks', async () => {
    await t.db.pool.query(`UPDATE desk SET active = false WHERE key = 'opinion'`);
    expect((await get('/reference/desks')).body.map((d: any) => d.key)).not.toContain('opinion');
  });

  it('creates and searches contributors without exposing contact details', async () => {
    const made = await t.call({ method: 'POST', url: '/contributors', roles: ['reporter'], body: { displayName: 'Rina Akter', bio: 'Politics reporter' } });
    expect(made.status).toBe(201);
    expect(made.body).toEqual({ id: expect.any(String), kind: 'person', displayName: 'Rina Akter', bio: 'Politics reporter' });
    await t.call({ method: 'POST', url: '/contributors', roles: ['reporter'], body: { displayName: '100% Real_Name', kind: 'organization' } });

    expect((await get('/contributors?query=rina')).body.map((c: any) => c.displayName)).toEqual(['Rina Akter']);
    expect((await get('/contributors?query=%25')).body.map((c: any) => c.displayName)).toEqual(['100% Real_Name']);
    expect((await get('/contributors?query=_')).body.map((c: any) => c.displayName)).toEqual(['100% Real_Name']);
    expect((await get('/contributors')).body.length).toBe(2);
    expect(JSON.stringify(made.body)).not.toContain('contact');

    expect((await t.call({ method: 'POST', url: '/contributors', roles: ['fact_checker'], body: { displayName: 'x' } })).status).toBe(403);
    expect((await t.call({ method: 'POST', url: '/contributors', roles: ['reporter'], body: { displayName: '  ' } })).status).toBe(400);
    const trail = await t.db.pool.query(`SELECT actor_id FROM audit_event WHERE action = 'contributor.create'`);
    expect(trail.rowCount).toBe(2);
  });
});
