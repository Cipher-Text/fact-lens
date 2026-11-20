import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('trending search terms (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
  });
  afterAll(() => t?.close());

  const save = (locale: string, terms: unknown, roles = ['admin']) =>
    t.call({ method: 'PUT', url: `/trending-searches/${locale}`, roles, body: { terms } });
  const shown = async (locale: string) => {
    const res = await t.anonymous('GET', `/public/trending-searches/${locale}`);
    return { status: res.statusCode, body: res.json() as any, headers: res.headers };
  };

  it('saves the list in order, and readers get it in the same order with a short cache', async () => {
    const saved = await save('en', ['Flood relief', 'Budget 2026', 'Monsoon']);
    expect(saved.status).toBe(200);
    expect(saved.body.terms).toEqual(['Flood relief', 'Budget 2026', 'Monsoon']);
    const res = await shown('en');
    expect(res.status).toBe(200);
    expect(res.body.terms).toEqual(['Flood relief', 'Budget 2026', 'Monsoon']);
    expect(res.headers['cache-control']).toBe('public, max-age=60, stale-while-revalidate=300');
  });

  it('replaces the whole list on each save, and an empty list hides the row', async () => {
    await save('en', ['Only one']);
    expect((await shown('en')).body.terms).toEqual(['Only one']);
    const cleared = await save('en', []);
    expect(cleared.status).toBe(200);
    expect((await shown('en')).body.terms).toEqual([]);
  });

  it('keeps each language on its own list', async () => {
    await save('en', ['English term']);
    await save('bn-BD', ['বাংলা শব্দ']);
    expect((await shown('en')).body.terms).toEqual(['English term']);
    expect((await shown('bn-BD')).body.terms).toEqual(['বাংলা শব্দ']);
  });

  it('refuses more than six terms, a term over 60 characters, and a term listed twice', async () => {
    const before = (await shown('en')).body.terms;
    expect((await save('en', ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'])).status).toBe(400);
    expect((await save('en', ['x'.repeat(61)])).status).toBe(400);
    expect((await save('en', ['Flood', ' flood '])).status).toBe(400);
    expect((await save('en', ['   '])).status).toBe(400);
    expect((await shown('en')).body.terms).toEqual(before);
  });

  it('needs config.manage to save, and sign-in to save at all', async () => {
    expect((await save('en', ['Blocked'], ['reporter'])).status).toBe(403);
    const anonymous = await t.app.inject({ method: 'PUT', url: '/trending-searches/en', payload: { terms: ['Blocked'] } });
    expect(anonymous.statusCode).toBe(401);
  });

  it('answers 404 for an unknown language, in both directions', async () => {
    expect((await save('zz', ['x'])).status).toBe(404);
    expect((await shown('zz')).status).toBe(404);
  });

  it('writes an audit event for each save, in the same transaction', async () => {
    await save('en', ['Audited term']);
    const { rows } = await t.db.pool.query(
      `SELECT action, object_id, metadata FROM audit_event WHERE action = 'trending.update' AND object_id = 'en' ORDER BY occurred_at DESC LIMIT 1`);
    expect(rows[0]).toEqual(expect.objectContaining({ action: 'trending.update', object_id: 'en' }));
    expect(rows[0].metadata).toEqual({ count: 1 });
  });
});
