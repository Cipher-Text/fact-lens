import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INTERNAL_TOKEN_HEADER } from '@fact-lens/contracts';
import { startTestApp, TEST_INTERNAL_TOKEN } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('source inbox (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let feedId: string;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
  });
  afterAll(() => t?.close());

  const ingest = (id: string, body: unknown, token: string | null = TEST_INTERNAL_TOKEN) =>
    t.app.inject({ method: 'POST', url: `/internal/feeds/${id}/ingest`, headers: token ? { [INTERNAL_TOKEN_HEADER]: token, 'content-type': 'application/json' } : { 'content-type': 'application/json' }, payload: body as object });
  const inbox = async (status = 'new') => (await t.call({ method: 'GET', url: `/inbox?status=${status}`, roles: ['reporter'] })).body;

  it('lets only administrators add feeds, and refuses the same feed twice', async () => {
    const body = { name: 'Daily Star', url: 'https://example.com/rss.xml?utm_source=x' };
    expect((await t.call({ method: 'POST', url: '/feeds', roles: ['reporter'], body })).status).toBe(403);
    const made = await t.call({ method: 'POST', url: '/feeds', body });
    expect(made.status, JSON.stringify(made.body)).toBe(201);
    expect(made.body).toMatchObject({ name: 'Daily Star', active: true, pollMinutes: 15, lastStatus: null, newCount: 0 });
    feedId = made.body.id;
    expect((await t.call({ method: 'POST', url: '/feeds', body: { name: 'Again', url: 'https://example.com/rss.xml' } })).status).toBe(409);
    expect((await t.call({ method: 'POST', url: '/feeds', body: { name: 'Bad', url: 'ftp://example.com/x' } })).status).toBe(400);
    const all = (await t.call({ method: 'GET', url: '/feeds', roles: ['reporter'] })).body as Array<{ id: string; active: boolean; createdBy?: string }>;
    expect(all).toHaveLength(10); // the 9 seeded (paused) feeds and this one
    expect(all.filter((f) => f.active).map((f) => f.id)).toEqual([feedId]);
    expect((await t.call({ method: 'GET', url: '/feeds', roles: ['reader'] })).status).toBeGreaterThanOrEqual(400);
  });

  it('takes items from the worker, once each, and marks repeats of an address as duplicates', async () => {
    const items = [
      { guid: 'a', title: 'Flood hits Feni', url: 'https://news.example/a?utm_source=rss', summary: 'Rain.', publishedAt: '2026-10-22T10:00:00.000Z' },
      { guid: 'b', title: 'Same story elsewhere', url: 'https://news.example/a' },
      { guid: 'c', title: 'No link' },
    ];
    expect((await ingest(feedId, { status: 'ok', items }, null)).statusCode).toBe(401);
    const first = await ingest(feedId, { status: 'ok', etag: 'e1', items });
    expect(first.statusCode, first.body).toBe(200);
    expect(first.json()).toEqual({ inserted: 2, duplicates: 1, skipped: 0 });
    expect((await ingest(feedId, { status: 'ok', items })).json()).toEqual({ inserted: 0, duplicates: 0, skipped: 3 });

    const list = await inbox();
    expect(list.items.map((i: any) => i.title).sort()).toEqual(['Flood hits Feni', 'No link']);
    expect(list.counts).toEqual({ new: 2, used: 0, rejected: 0, duplicate: 1 });
    expect((await inbox('duplicate')).items[0].title).toBe('Same story elsewhere');
    const feed = (await t.call({ method: 'GET', url: '/feeds', roles: ['reporter'] })).body.find((f: any) => f.id === feedId);
    expect(feed).toMatchObject({ lastStatus: 'ok', lastError: null, newCount: 2 });
  });

  it('records a failed fetch on the feed without touching its items', async () => {
    expect((await ingest(feedId, { status: 'error', error: 'Timed out' })).statusCode).toBe(200);
    const feed = (await t.call({ method: 'GET', url: '/feeds', roles: ['reporter'] })).body.find((f: any) => f.id === feedId);
    expect(feed).toMatchObject({ lastStatus: 'error', lastError: 'Timed out', newCount: 2 });
    expect((await ingest('00000000-0000-4000-8000-000000000000', { status: 'ok', items: [] })).statusCode).toBe(404);
  });

  it('puts an item aside and brings it back', async () => {
    const item = (await inbox()).items.find((i: any) => i.title === 'No link');
    expect((await t.call({ method: 'PUT', url: `/inbox/${item.id}`, roles: ['reader'], body: { status: 'rejected' } })).status).toBeGreaterThanOrEqual(400);
    const rejected = await t.call({ method: 'PUT', url: `/inbox/${item.id}`, roles: ['reporter'], body: { status: 'rejected' } });
    expect(rejected.body.status).toBe('rejected');
    expect((await inbox()).counts.new).toBe(1);
    expect((await t.call({ method: 'PUT', url: `/inbox/${item.id}`, roles: ['reporter'], body: { status: 'new' } })).body.status).toBe('new');
  });

  it('turns an item into a source of a news item, once, and removes it from the inbox', async () => {
    const item = (await inbox()).items.find((i: any) => i.title === 'Flood hits Feni');
    const deskId = (await t.db.pool.query(`SELECT id FROM desk LIMIT 1`)).rows[0].id;
    const news = (await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Flood', slug: 'flood', deskId } })).body.news.id;
    const other = (await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Other', slug: 'other', deskId } })).body.news.id;

    const used = await t.call({ method: 'POST', url: `/inbox/${item.id}/use`, roles: ['reporter'], body: { newsId: news } });
    expect(used.status, JSON.stringify(used.body)).toBe(200);
    expect(used.body).toMatchObject({ status: 'used', newsId: news });
    expect((await t.call({ method: 'POST', url: `/inbox/${item.id}/use`, roles: ['reporter'], body: { newsId: news } })).status).toBe(200);
    expect((await t.call({ method: 'POST', url: `/inbox/${item.id}/use`, roles: ['reporter'], body: { newsId: other } })).status).toBe(409);
    expect((await t.call({ method: 'PUT', url: `/inbox/${item.id}`, roles: ['reporter'], body: { status: 'rejected' } })).status).toBe(409);

    const sources = (await t.call({ method: 'GET', url: `/news/${news}/sources`, roles: ['reporter'] })).body;
    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({ title: 'Flood hits Feni', publisher: 'Daily Star', relation: 'primary', ingestChannel: 'rss' });
    expect((await inbox()).items.some((i: any) => i.id === item.id)).toBe(false);
    expect((await t.db.pool.query(`SELECT 1 FROM audit_event WHERE action = 'inbox.use'`)).rowCount).toBe(1);
  });

  it('pauses and removes a feed, taking its items with it', async () => {
    expect((await t.call({ method: 'PUT', url: `/feeds/${feedId}`, body: { active: false, pollMinutes: 60 } })).body).toMatchObject({ active: false, pollMinutes: 60 });
    expect((await t.call({ method: 'PUT', url: `/feeds/${feedId}`, body: { pollMinutes: 1 } })).status).toBe(400);
    expect((await t.call({ method: 'DELETE', url: `/feeds/${feedId}`, roles: ['reporter'] })).status).toBe(403);
    expect((await t.call({ method: 'DELETE', url: `/feeds/${feedId}` })).status).toBe(204);
    expect((await t.db.pool.query('SELECT 1 FROM inbox_item')).rowCount).toBe(0);
  });
});
