import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INTERNAL_TOKEN_HEADER } from '@fact-lens/contracts';
import { startTestApp, TEST_INTERNAL_TOKEN } from '../test-harness';
import { classifySource, dhakaDayOf, hourBucket } from './views.service';

const adminUrl = process.env.TEST_DATABASE_URL;
const redisUrl = process.env.TEST_REDIS_URL;
const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });
const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15';

describe('where a view came from, and which hour and day it belongs to', () => {
  const own = ['factlens.example'];
  it('classifies by the referrer domain only', () => {
    expect(classifySource(undefined, own)).toBe('direct');
    expect(classifySource('  ', own)).toBe('direct');
    expect(classifySource('www.google.com', own)).toBe('search');
    expect(classifySource('https://www.bing.com/search?q=x', own)).toBe('search');
    expect(classifySource('l.facebook.com', own)).toBe('social');
    expect(classifySource('https://t.co/abc', own)).toBe('social');
    expect(classifySource('x.com', own)).toBe('social');
    expect(classifySource('news.factlens.example', own)).toBe('internal');
    expect(classifySource('factlens.example', own)).toBe('internal');
    expect(classifySource('blog.example.org', own)).toBe('other');
    // A look-alike is not the site, and a search engine name inside another domain is not a search engine.
    expect(classifySource('factlens.example.evil.test', own)).toBe('other');
    expect(classifySource('notgoogle.com', own)).toBe('other');
    expect(classifySource('::::', own)).toBe('other');
  });

  it('names the UTC hour and the Dhaka day (six hours ahead)', () => {
    expect(hourBucket(new Date('2026-11-09T20:30:00Z'))).toBe('2026110920');
    expect(dhakaDayOf('2026110917')).toBe('2026-11-09'); // 23:00 in Dhaka
    expect(dhakaDayOf('2026110918')).toBe('2026-11-10'); // midnight in Dhaka
    expect(dhakaDayOf('2026123118')).toBe('2027-01-01');
  });
});

describe.skipIf(!adminUrl || !redisUrl)('view counting, most read and the performance reports (database and Redis)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let deskId: string;
  let authorId: string;
  let sections: Record<string, string>;
  let session = 0;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
    deskId = (await t.db.pool.query(`SELECT id FROM desk WHERE key = 'opinion'`)).rows[0].id;
    authorId = (await t.db.pool.query(`INSERT INTO contributor (display_name) VALUES ('A. Writer') RETURNING id`)).rows[0].id;
    sections = Object.fromEntries((await t.call({ method: 'GET', url: '/taxonomy/categories' })).body.map((c: any) => [c.key, c.id]));
  });
  afterAll(() => t?.close());

  /** A published news item in English (and Bangla when asked). */
  async function publish(slug: string, opts: { sections?: string[]; format?: string; bangla?: boolean } = {}) {
    const created = await t.call({
      method: 'POST', url: '/news', roles: ['reporter'],
      body: { locale: 'en', title: `Title ${slug}`, slug, deskId, categoryIds: (opts.sections ?? ['geopolitics']).map((k) => sections[k]), ...(opts.format ? { format: opts.format } : {}) },
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const id = created.body.news.id as string;
    expect((await t.call({ method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'], body: { title: `Title ${slug}`, body: doc('x'), slug, expectedVersion: 1 } })).status).toBe(200);
    if (opts.bangla) {
      expect((await t.call({ method: 'PUT', url: `/news/${id}/translations/bn-BD`, roles: ['reporter'], body: { title: `শিরোনাম ${slug}`, body: doc('লেখা'), slug: `bn-${slug}`, expectedVersion: null } })).status).toBeLessThan(300);
    }
    expect((await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } })).status).toBe(200);
    for (const [to, role] of [['EDITOR_REVIEW', 'reporter'], ['READY', 'fact_checker'], ['PUBLISHED', 'managing_editor']] as const) {
      expect((await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: [role], body: { to } })).status).toBe(201);
    }
    return { id, shortId: created.body.news.shortId as string };
  }

  const view = (shortId: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}, who = `session-${(session += 1)}-abcdefghijkl`) =>
    t.app.inject({
      method: 'POST', url: '/public/views', payload: { shortId, locale: 'en', sessionId: who, ...extra },
      headers: { 'user-agent': BROWSER, ...headers },
    });
  const score = async (id: string, locale = 'en', at = new Date()) =>
    Number((await t.redis!.zscore(`${t.viewsOptions.prefix}:v:${hourBucket(at)}:${locale}`, id)) ?? 0);
  const forgetRanking = async () => {
    const keys = await t.redis!.keys(`${t.viewsOptions.prefix}:mr:*`);
    if (keys.length) await t.redis!.del(...keys);
  };
  const mostRead = async (query = '', locale = 'en') => {
    await forgetRanking();
    return t.anonymous('GET', `/public/most-read/${locale}${query}`);
  };
  const setFlag = (enabled: boolean) => t.db.pool.query(`UPDATE feature_flag SET enabled = $1 WHERE key = 'analytics.news_views'`, [enabled]);

  it('counts a view once per session, and not when it is off, a bot, a prefetch, not live, or in a language it does not have', async () => {
    const a = await publish('counted');
    t.setClock(new Date());

    await setFlag(false);
    t.setClock(new Date());
    expect((await view(a.shortId)).statusCode).toBe(204);
    expect(await score(a.id)).toBe(0); // the feature flag is off

    await setFlag(true);
    const at = new Date(Date.now() + 60_000); // past the 30 seconds the flag is remembered for
    t.setClock(at);
    expect((await view(a.shortId, {}, {}, 'same-session-abcdefghijkl')).statusCode).toBe(204);
    expect((await view(a.shortId, {}, {}, 'same-session-abcdefghijkl')).statusCode).toBe(204);
    expect(await score(a.id, 'en', at)).toBe(1);
    expect((await view(a.shortId)).statusCode).toBe(204);
    expect(await score(a.id, 'en', at)).toBe(2);

    await view(a.shortId, {}, { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' });
    await view(a.shortId, {}, { 'user-agent': '' });
    await view(a.shortId, {}, { 'sec-purpose': 'prefetch;prerender' });
    await view('zzzzzzz');
    await view(a.shortId, { locale: 'bn-BD' });
    expect(await score(a.id, 'en', at)).toBe(2);
    expect(await score(a.id, 'bn-BD', at)).toBe(0);

    // A draft is not a view of anything.
    const draft = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Draft', slug: 'draft-views', deskId } });
    await view(draft.body.news.shortId);
    expect(await score(draft.body.news.id, 'en', at)).toBe(0);

    // A malformed beacon is refused, so a client bug shows.
    expect((await view(a.shortId, {}, {}, 'short')).statusCode).toBe(400);
    expect((await t.app.inject({ method: 'POST', url: '/public/views', payload: { locale: 'en' } })).statusCode).toBe(400);
  });

  it('sorts a view by where it came from, from the referrer domain only', async () => {
    const a = await publish('sources');
    const at = new Date(Date.now() + 5 * 60_000);
    t.setClock(at);
    await view(a.shortId, { referrer: 'https://www.google.com/search?q=secret+words' });
    await view(a.shortId, { referrer: 'l.facebook.com' });
    await view(a.shortId, { referrer: 'factlens.example' });
    await view(a.shortId);
    await view(a.shortId, { referrer: 'blog.example.org' });
    const bucket = hourBucket(at);
    const bySource = async (source: string) => Number((await t.redis!.zscore(`${t.viewsOptions.prefix}:s:${bucket}:en:${source}`, a.id)) ?? 0);
    expect(await Promise.all(['search', 'social', 'internal', 'direct', 'other'].map(bySource))).toEqual([1, 1, 1, 1, 1]);
    // Nothing of the search words was stored.
    const keys = await t.redis!.keys(`${t.viewsOptions.prefix}:*`);
    expect(keys.join(' ')).not.toMatch(/secret|google/);
  });

  it('limits the beacon per client address, by the configured limit', async () => {
    const a = await publish('limited');
    await t.db.pool.query(`UPDATE configuration SET value = '{"limit": 2, "windowSeconds": 60}' WHERE key = 'rate_limit.news_view_beacon'`);
    const at = new Date(Date.now() + 20 * 60_000);
    t.setClock(at); // past the minute the limit is remembered for
    for (let i = 0; i < 4; i++) await view(a.shortId);
    expect(await score(a.id, 'en', at)).toBe(2);
    await t.db.pool.query(`UPDATE configuration SET value = '{"limit": 60, "windowSeconds": 60}' WHERE key = 'rate_limit.news_view_beacon'`);
    // One more view, a few minutes on, makes the view service read the restored limit.
    t.setClock(new Date(at.getTime() + 5 * 60_000));
    await view(a.shortId);
  });

  it('ranks the most read news with places 1, 2, 3, widens to 7 days and then to the newest, and filters', async () => {
    // Start from no counters, so only the views of this test rank.
    const counters = await t.redis!.keys(`${t.viewsOptions.prefix}:[vs]:*`);
    if (counters.length) await t.redis!.del(...counters);
    const now = new Date(Date.now() + 40 * 60_000);
    const a = await publish('rank-a', { sections: ['geopolitics'] });
    const b = await publish('rank-b', { sections: ['economy'], format: 'opinion' });
    const c = await publish('rank-c', { sections: ['economy'] });
    const d = await publish('rank-d', { sections: ['security'] });
    const e = await publish('rank-e', { sections: ['security'] });

    // D was read a lot three days ago, the others today.
    t.setClock(new Date(now.getTime() - 3 * 24 * 3600_000));
    for (let i = 0; i < 4; i++) await view(d.shortId);
    t.setClock(now);
    for (let i = 0; i < 3; i++) await view(a.shortId);
    for (let i = 0; i < 2; i++) await view(c.shortId);
    await view(b.shortId);

    const day = await mostRead('?limit=3');
    expect(day.statusCode).toBe(200);
    expect(day.headers['cache-control']).toMatch(/max-age=60/);
    const top = day.json() as any;
    expect(top.window).toBe('24h');
    expect(top.items.map((i: any) => [i.rank, i.id])).toEqual([[1, a.id], [2, c.id], [3, b.id]]);
    // The same items as the public lists, with the lead image (none yet) and the address parts.
    expect(top.items[0]).toMatchObject({ shortId: a.shortId, slug: 'rank-a', format: 'news', image: null, category: { key: 'geopolitics' } });

    // Five wanted, only three read today: it widens to 7 days (D comes first), then fills with the newest (E, never read).
    const week = (await mostRead('?limit=5')).json() as any;
    expect(week.window).toBe('7d');
    expect(week.items.map((i: any) => [i.rank, i.id])).toEqual([[1, d.id], [2, a.id], [3, c.id], [4, b.id], [5, e.id]]);

    // Filters: a section, the formats, and a window asked for.
    expect(((await mostRead('?limit=3&category=economy')).json() as any).items.map((i: any) => i.id)).toEqual([c.id, b.id]);
    // Only two news items that are not opinion were read today, so three widens to 7 days, and D (read 3 days ago) leads.
    expect(((await mostRead('?limit=3&excludeFormat=opinion')).json() as any)).toMatchObject({ window: '7d', items: [{ id: d.id }, { id: a.id }, { id: c.id }] });
    expect(((await mostRead('?limit=3&format=opinion')).json() as any).items.map((i: any) => i.id)).toEqual([b.id]);
    expect(((await mostRead('?limit=1&window=7d')).json() as any)).toMatchObject({ window: '7d', items: [{ rank: 1, id: d.id }] });

    // Languages are not mixed, and a bad request is refused.
    expect(((await mostRead('', 'bn-BD')).json() as any).items).toEqual([]);
    expect((await mostRead('', 'xx')).statusCode).toBe(404);
    expect((await mostRead('?category=no-such')).statusCode).toBe(404);
    expect((await mostRead('?limit=99')).statusCode).toBe(400);
    expect((await mostRead('?window=30d')).statusCode).toBe(400);
  });

  describe('the newsroom reports', () => {
    const dhaka = (offsetDays: number) => new Date(Date.now() + 6 * 3600_000 + offsetDays * 86_400_000).toISOString().slice(0, 10);
    let old: { id: string; shortId: string }; let mid: { id: string; shortId: string }; let fresh: { id: string; shortId: string }; let quiet: { id: string; shortId: string };

    beforeAll(async () => {
      old = await publish('report-old', { sections: ['history'] });
      mid = await publish('report-mid', { sections: ['history'], format: 'analysis', bangla: true });
      fresh = await publish('report-fresh', { sections: ['technology'] });
      quiet = await publish('report-quiet', { sections: ['history'] });
      await t.db.pool.query(`UPDATE news SET published_at = now() - interval '40 days' WHERE id = $1`, [old.id]);
      await t.db.pool.query(`UPDATE news SET published_at = now() - interval '10 days' WHERE id = $1`, [mid.id]);
      await t.db.pool.query(`UPDATE news SET published_at = now() - interval '45 days' WHERE id = $1`, [quiet.id]);
      const put = (id: string, locale: string, daysAgo: number, views: number, search = 0) => t.db.pool.query(
        `INSERT INTO news_performance_daily (news_id, locale, day, views, src_search, src_direct) VALUES ($1, $2, $3, $4, $5, $6)`, [id, locale, dhaka(-daysAgo), views, search, views - search]);
      await put(old.id, 'en', 35, 500); // before the default 30 days
      await put(old.id, 'en', 5, 10, 4);
      await put(mid.id, 'en', 9, 30, 10);
      await put(mid.id, 'en', 2, 20, 5);
      await put(mid.id, 'bn-BD', 2, 7);
      await put(fresh.id, 'en', 0, 3);
    });

    it('needs the analytics capability', async () => {
      expect((await t.call({ method: 'GET', url: '/analytics/news', roles: ['reporter'] })).status).toBe(403);
      expect((await t.call({ method: 'GET', url: '/analytics/news', roles: ['analyst'] })).status).toBe(200);
      expect((await t.call({ method: 'GET', url: '/analytics/summary', roles: ['managing_editor'] })).status).toBe(200);
      expect((await t.anonymous('GET', '/analytics/news')).statusCode).toBe(401);
    });

    it('lists most read in the period, and least read including news nobody read', async () => {
      const ours = (res: any) => res.body.items.filter((i: any) => [old.id, mid.id, fresh.id, quiet.id].includes(i.newsId) && i.locale === 'en');
      const most = await t.call({ method: 'GET', url: '/analytics/news?limit=100' });
      expect(most.status).toBe(200);
      expect(most.body.to).toBe(dhaka(0));
      expect(most.body.from).toBe(dhaka(-29));
      // The 500 views 35 days ago are outside the default 30 days.
      expect(ours(most).map((i: any) => [i.title, i.views])).toEqual([['Title report-mid', 50], ['Title report-old', 10], ['Title report-fresh', 3], ['Title report-quiet', 0]]);
      expect(ours(most)[0]).toMatchObject({ shortId: mid.shortId, format: 'analysis', sources: { search: 15, direct: 35 } });

      const least = await t.call({ method: 'GET', url: '/analytics/news?limit=100&order=asc' });
      expect(ours(least).map((i: any) => i.title)).toEqual(['Title report-quiet', 'Title report-fresh', 'Title report-old', 'Title report-mid']);
      // New news is not "least read" for being new: minAgeDays keeps it out.
      const aged = await t.call({ method: 'GET', url: '/analytics/news?limit=100&order=asc&minAgeDays=30' });
      expect(ours(aged).map((i: any) => i.title)).toEqual(['Title report-quiet', 'Title report-old']);

      // Views a day since it was live in the period: the 10 day old news has 50 in 10 days, the older 10 in 30.
      const rate = await t.call({ method: 'GET', url: '/analytics/news?limit=100&metric=rate' });
      expect(ours(rate).map((i: any) => [i.title, i.daysLive, i.viewsPerDay])).toEqual([
        ['Title report-mid', 11, 4.55], ['Title report-fresh', 1, 3], ['Title report-old', 30, 0.33], ['Title report-quiet', 30, 0],
      ]);

      // A longer period reaches the old views.
      const long = await t.call({ method: 'GET', url: `/analytics/news?limit=100&from=${dhaka(-60)}` });
      expect(ours(long)[0]).toMatchObject({ title: 'Title report-old', views: 510 });
    });

    it('filters by language, format and section, pages, and refuses a bad period', async () => {
      const ids = (res: any) => res.body.items.map((i: any) => [i.newsId, i.locale]);
      expect(ids(await t.call({ method: 'GET', url: '/analytics/news?locale=bn-BD' }))).toEqual([[mid.id, 'bn-BD']]);
      expect(ids(await t.call({ method: 'GET', url: '/analytics/news?format=analysis&locale=en' }))).toEqual([[mid.id, 'en']]);
      const tech = await t.call({ method: 'GET', url: '/analytics/news?category=technology&locale=en' });
      expect(ids(tech)).toEqual([[fresh.id, 'en']]);
      const page = await t.call({ method: 'GET', url: '/analytics/news?limit=1' });
      expect(page.body.items).toHaveLength(1);
      expect(page.body.more).toBe(true);
      expect((await t.call({ method: 'GET', url: `/analytics/news?from=${dhaka(0)}&to=${dhaka(-3)}` })).status).toBe(400);
      expect((await t.call({ method: 'GET', url: `/analytics/news?from=${dhaka(-400)}&to=${dhaka(0)}` })).status).toBe(400);
      expect((await t.call({ method: 'GET', url: '/analytics/news?from=yesterday' })).status).toBe(400);
      expect((await t.call({ method: 'GET', url: '/analytics/news?metric=likes' })).status).toBe(400);
    });

    it('sums by section, region, format, author and language', async () => {
      const sum = async (by: string) => (await t.call({ method: 'GET', url: `/analytics/summary?by=${by}` })).body.rows as any[];
      const history = (await sum('category')).find((r) => r.key === 'history');
      expect(history).toMatchObject({ news: expect.any(Number), views: 60 + 7 }); // old 10, mid 50 (en) + 7 (bn), quiet 0
      expect((await sum('category')).find((r) => r.key === 'technology')).toMatchObject({ views: 3 });
      expect((await sum('format')).find((r) => r.key === 'analysis')).toMatchObject({ views: 57 });
      expect((await sum('locale')).map((r) => [r.key, r.views])).toEqual([['en', 63], ['bn-BD', 7]]);
      expect((await sum('author')).find((r) => r.label === 'A. Writer')!.views).toBeGreaterThanOrEqual(70);
      expect((await t.call({ method: 'GET', url: '/analytics/summary?by=colour' })).status).toBe(400);
    });

    it('shows one news item: a zero-filled series, totals, sources and its place in its section', async () => {
      const res = await t.call({ method: 'GET', url: `/analytics/news/${mid.id}` });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ newsId: mid.id, shortId: mid.shortId, from: dhaka(-29), to: dhaka(0) });
      const en = res.body.locales.find((l: any) => l.locale === 'en');
      expect(en.perDay).toHaveLength(30);
      expect(en.perDay.filter((d: any) => d.views > 0).map((d: any) => [d.day, d.views])).toEqual([[dhaka(-9), 30], [dhaka(-2), 20]]);
      expect(en).toMatchObject({ total: 50, last7: 20, last30: 50, allTime: 50, peakDay: dhaka(-9), sources: { search: 15, direct: 35, social: 0 } });
      expect(en.viewsPerDay).toBeCloseTo(4.55, 2);
      // Most read of the three live "history" news that have English text (old 10, quiet 0).
      expect(en.rankInSection).toEqual({ section: 'history', rank: 1, of: 3 });
      expect(res.body.locales.find((l: any) => l.locale === 'bn-BD')).toMatchObject({ total: 7, rankInSection: { section: 'history', rank: 1, of: 1 } });
      // A news item that nobody read has a series of zeros.
      const none = await t.call({ method: 'GET', url: `/analytics/news/${quiet.id}` });
      expect(none.body.locales[0]).toMatchObject({ total: 0, peakDay: null });
      expect((await t.call({ method: 'GET', url: '/analytics/news/00000000-0000-4000-8000-000000000000' })).status).toBe(404);
      expect((await t.call({ method: 'GET', url: `/analytics/news/${mid.id}`, roles: ['reporter'] })).status).toBe(403);
    });
  });

  it('adds each finished hour to the durable table once, by Dhaka day, with the sources', async () => {
    // Start from no counters, so only the hours of this test are rolled up.
    const old = await t.redis!.keys(`${t.viewsOptions.prefix}:*`);
    if (old.length) await t.redis!.del(...old);
    const a = await publish('rollup-a');
    const b = await publish('rollup-b');
    const at = (iso: string) => t.setClock(new Date(iso));

    at('2031-03-04T17:59:00Z'); // 23:59 in Dhaka: 4 March
    await view(a.shortId, { referrer: 'www.google.com' });
    at('2031-03-04T18:00:00Z'); // midnight in Dhaka: 5 March
    await view(a.shortId);
    await view(b.shortId, { referrer: 'x.com' });
    at('2031-03-04T18:40:00Z'); // the same hour, another view
    await view(a.shortId, { referrer: 'factlens.example' });

    // Still inside the hour of 18:00: only the 17:00 hour is finished.
    at('2031-03-04T18:50:00Z');
    expect(await t.views.rollup()).toEqual({ buckets: 1, skipped: 0, rows: 1 });
    const daily = async (id: string) => (await t.db.pool.query(`SELECT to_char(day, 'YYYY-MM-DD') AS day, views, src_search, src_social, src_direct, src_internal FROM news_performance_daily WHERE news_id = $1 ORDER BY day`, [id])).rows;
    expect(await daily(a.id)).toEqual([{ day: '2031-03-04', views: 1, src_search: 1, src_social: 0, src_direct: 0, src_internal: 0 }]);

    // The next hour has finished: the 18:00 hour is added, a day later in Dhaka. The 17:00 hour is not added again.
    at('2031-03-04T19:05:00Z');
    expect(await t.views.rollup()).toEqual({ buckets: 1, skipped: 1, rows: 2 });
    expect(await daily(a.id)).toEqual([
      { day: '2031-03-04', views: 1, src_search: 1, src_social: 0, src_direct: 0, src_internal: 0 },
      { day: '2031-03-05', views: 2, src_search: 0, src_social: 0, src_direct: 1, src_internal: 1 },
    ]);
    expect((await daily(b.id))[0]).toMatchObject({ day: '2031-03-05', views: 1, src_social: 1 });

    // Running it again changes nothing.
    expect(await t.views.rollup()).toEqual({ buckets: 0, skipped: 2, rows: 0 });
    expect((await daily(a.id)).map((r) => r.views)).toEqual([1, 2]);

    // The internal endpoint is what the worker calls: it needs the shared secret.
    expect((await t.app.inject({ method: 'POST', url: '/internal/analytics/rollup' })).statusCode).toBe(401);
    const internal = await t.app.inject({ method: 'POST', url: '/internal/analytics/rollup', headers: { [INTERNAL_TOKEN_HEADER]: TEST_INTERNAL_TOKEN } });
    expect(internal.statusCode).toBe(200);
    expect(internal.json()).toEqual({ buckets: 0, skipped: 2, rows: 0 });
  });
});
