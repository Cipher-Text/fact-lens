import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;

const wording = (extra: object = {}) => ({
  questions: { en: 'Top priority for the Bay of Bengal?', 'bn-BD': 'বঙ্গোপসাগরে অগ্রাধিকার কী?' },
  options: [
    { en: 'Trade', 'bn-BD': 'বাণিজ্য' },
    { en: 'Climate', 'bn-BD': 'জলবায়ু' },
    { en: 'Security', 'bn-BD': 'নিরাপত্তা' },
  ],
  ...extra,
});

describe.skipIf(!adminUrl)('polls (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
  });
  afterAll(() => t?.close());

  const create = async (body: object = wording(), roles = ['reporter']) => (await t.call({ method: 'POST', url: '/polls', roles, body })).body;
  const manage = (id: string, action: string, roles = ['managing_editor']) => t.call({ method: 'POST', url: `/polls/${id}/${action}`, roles });
  const publicGet = (url: string, cookie?: string) => t.app.inject({ method: 'GET', url, headers: cookie ? { cookie } : {} });
  const vote = (id: string, optionId: string, opts: { cookie?: string; ip?: string; locale?: string } = {}) =>
    t.app.inject({
      method: 'POST', url: `/public/polls/${id}/vote`, payload: { optionId, locale: opts.locale ?? 'en' },
      headers: { ...(opts.cookie ? { cookie: opts.cookie } : {}), ...(opts.ip ? { 'x-forwarded-for': opts.ip } : {}) },
    });
  const cookieOf = (res: { headers: Record<string, unknown> }) => String(res.headers['set-cookie']).split(';')[0]!;
  const open = async (body: object = wording()) => {
    const p = await create(body);
    expect((await manage(p.id, 'open')).status).toBe(200);
    return (await t.call({ method: 'GET', url: `/polls/${p.id}`, roles: ['reporter'] })).body;
  };

  it('needs two to four options, a label for every language with a question, and known languages', async () => {
    const post = (body: object) => t.call({ method: 'POST', url: '/polls', roles: ['reporter'], body });
    expect((await post(wording({ options: [{ en: 'Only', 'bn-BD': 'এক' }] }))).status).toBe(400);
    expect((await post(wording({ options: Array(5).fill({ en: 'x', 'bn-BD': 'ক' }) }))).status).toBe(400);
    expect((await post(wording({ options: [{ en: 'A' }, { en: 'B', 'bn-BD': 'খ' }] }))).status).toBe(400);
    expect((await post({ questions: { zz: 'Q?' }, options: [{ zz: 'a' }, { zz: 'b' }] })).status).toBe(400);
    expect((await post(wording({ opensAt: '2026-10-02T00:00:00.000Z', closesAt: '2026-10-01T00:00:00.000Z' }))).status).toBe(400);
    const one = await post({ questions: { en: 'English only?' }, options: [{ en: 'Yes' }, { en: 'No' }] });
    expect(one.status, JSON.stringify(one.body)).toBe(201);
    expect(one.body).toMatchObject({ status: 'draft', featured: false, totalVotes: 0, editable: true });
    expect(one.body.options.map((o: any) => o.position)).toEqual([1, 2]);
  });

  it('lets editors write polls but only managing editors open, close and feature them', async () => {
    const p = await create();
    expect((await manage(p.id, 'open', ['reporter'])).status).toBe(403);
    expect((await manage(p.id, 'close')).status).toBe(409); // a draft cannot be closed
    expect((await t.call({ method: 'PUT', url: `/polls/${p.id}/feature`, roles: ['managing_editor'], body: { featured: true } })).status).toBe(409); // not public yet
    expect((await manage(p.id, 'open')).body.status).toBe('open');
    expect((await manage(p.id, 'open')).status).toBe(200); // again: no change
    expect((await t.call({ method: 'GET', url: '/polls', roles: ['reader'] })).status).toBeGreaterThanOrEqual(400);
  });

  it('hides drafts and other languages from readers', async () => {
    const draft = await create();
    expect((await publicGet(`/public/polls/${draft.id}/en`)).statusCode).toBe(404);
    const enOnly = await open({ questions: { en: 'English only?' }, options: [{ en: 'Yes' }, { en: 'No' }] });
    expect((await publicGet(`/public/polls/${enOnly.id}/en`)).statusCode).toBe(200);
    expect((await publicGet(`/public/polls/${enOnly.id}/bn-BD`)).statusCode).toBe(404);
    expect((await publicGet(`/public/polls/${enOnly.id}/not a locale`)).statusCode).toBe(404);
  });

  it('counts one vote per browser, keeps no personal data, and recognises the browser afterwards', async () => {
    const p = await open();
    const [trade, climate] = p.options as Array<{ id: string }>;
    const first = await vote(p.id, climate!.id);
    expect(first.statusCode, first.body).toBe(200);
    expect(first.json()).toMatchObject({ alreadyVoted: false, myVote: climate!.id, totalVotes: 1, open: true });
    const set = String(first.headers['set-cookie']);
    expect(set).toMatch(/^fl_voter=[A-Za-z0-9_-]{43}; Path=\/; Max-Age=\d+; HttpOnly; SameSite=Lax/);
    const cookie = cookieOf(first);

    // The same browser again, even for another option: nothing is counted twice.
    const again = await vote(p.id, trade!.id, { cookie });
    expect(again.json()).toMatchObject({ alreadyVoted: true, myVote: climate!.id, totalVotes: 1 });
    expect(again.headers['set-cookie']).toBeUndefined();
    expect((await publicGet(`/public/polls/${p.id}/en`, cookie)).json().myVote).toBe(climate!.id);
    expect((await publicGet(`/public/polls/${p.id}/en`)).json().myVote).toBeNull();
    expect((await publicGet(`/public/polls/${p.id}/en`)).headers['cache-control']).toBe('no-store');

    // Only hashes are stored.
    const row = (await t.db.pool.query('SELECT token_hash, ip_hash FROM poll_vote WHERE poll_id = $1', [p.id])).rows[0];
    expect(row.token_hash).not.toContain(cookie.split('=')[1]);
    expect(row.ip_hash).toBeTruthy();
    expect(row.ip_hash).not.toContain('127.0.0.1');
    expect((await t.db.pool.query('SELECT 1 FROM poll_vote WHERE poll_id = $1', [p.id])).rowCount).toBe(1);
  });

  it('refuses an option from another poll, a malformed cookie, and counts votes from different browsers', async () => {
    const p = await open();
    const other = await open();
    expect((await vote(p.id, other.options[0].id)).statusCode).toBe(400);
    expect((await vote(p.id, p.options[0].id, { cookie: 'fl_voter=short' })).statusCode).toBe(200); // not ours: a new token is issued
    expect((await vote(p.id, p.options[1].id)).json().totalVotes).toBe(2);
    expect((await t.app.inject({ method: 'POST', url: `/public/polls/${p.id}/vote`, payload: { optionId: 'nope' } })).statusCode).toBe(400);
  });

  it('limits votes per address per day, and an address behind a proxy counts separately only when proxies are trusted', async () => {
    const p = await open();
    const o = p.options[0].id as string;
    // perIpPerDay is 3 in the test app: four different browsers from one address.
    for (let i = 0; i < 3; i++) expect((await vote(p.id, o)).statusCode).toBe(200);
    const blocked = await vote(p.id, o);
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().error.details?.reason ?? blocked.json().error.message).toBeTruthy();
    expect((await publicGet(`/public/polls/${p.id}/en`)).json().totalVotes).toBe(3);
    // X-Forwarded-For is ignored here (no trusted proxy), so a spoofed address does not help.
    expect((await vote(p.id, o, { ip: '203.0.113.9' })).statusCode).toBe(429);

    const behind = await startTestApp(adminUrl!, { trustProxy: true, polls: { secret: 'test-poll-secret-0123456789abcdef0123456789', perIpPerDay: 1 } });
    try {
      const made = (await behind.call({ method: 'POST', url: '/polls', roles: ['reporter'], body: wording() })).body;
      await behind.call({ method: 'POST', url: `/polls/${made.id}/open`, roles: ['managing_editor'] });
      const go = (ip: string) => behind.app.inject({ method: 'POST', url: `/public/polls/${made.id}/vote`, payload: { optionId: made.options[0].id, locale: 'en' }, headers: { 'x-forwarded-for': ip } });
      expect((await go('198.51.100.1')).statusCode).toBe(200);
      expect((await go('198.51.100.2')).statusCode).toBe(200);
      expect((await go('198.51.100.1')).statusCode).toBe(429);
    } finally {
      await behind.close();
    }
  });

  it('locks the wording once there are votes, and stops voting when a poll closes', async () => {
    const p = await open();
    const edited = await t.call({ method: 'PUT', url: `/polls/${p.id}`, roles: ['reporter'], body: wording({ questions: { en: 'New question?', 'bn-BD': 'নতুন প্রশ্ন?' } }) });
    expect(edited.status, JSON.stringify(edited.body)).toBe(200);
    expect(edited.body.questions.en).toBe('New question?');
    const voted = await vote(p.id, edited.body.options[0].id);
    expect(voted.statusCode).toBe(200);
    expect((await t.call({ method: 'PUT', url: `/polls/${p.id}`, roles: ['reporter'], body: wording() })).status).toBe(409);
    expect((await t.call({ method: 'DELETE', url: `/polls/${p.id}`, roles: ['reporter'] })).status).toBe(409);

    expect((await manage(p.id, 'close')).body).toMatchObject({ status: 'closed', editable: false, totalVotes: 1 });
    const late = await vote(p.id, p.options[0].id);
    expect(late.statusCode).toBe(409);
    const results = await publicGet(`/public/polls/${p.id}/en`);
    expect(results.json()).toMatchObject({ open: false, totalVotes: 1 }); // results stay visible
    expect((await manage(p.id, 'archive')).body.status).toBe('archived');
    expect((await publicGet(`/public/polls/${p.id}/en`)).statusCode).toBe(404);
  });

  it('respects the opening and closing times', async () => {
    const future = await open(wording({ opensAt: new Date(Date.now() + 3600_000).toISOString() }));
    expect((await publicGet(`/public/polls/${future.id}/en`)).statusCode).toBe(404);
    const past = await open();
    await t.db.pool.query(`UPDATE poll SET closes_at = now() - interval '1 minute' WHERE id = $1`, [past.id]);
    expect((await publicGet(`/public/polls/${past.id}/en`)).json().open).toBe(false);
    expect((await vote(past.id, past.options[0].id)).statusCode).toBe(409);
  });

  it('shows one featured poll on the homepage at a time, and drops it when archived', async () => {
    const a = await open();
    const b = await open();
    const feature = (id: string, featured = true) => t.call({ method: 'PUT', url: `/polls/${id}/feature`, roles: ['managing_editor'], body: { featured } });
    expect((await feature(a.id)).body.featured).toBe(true);
    expect((await publicGet('/public/polls/featured/en')).json().id).toBe(a.id);
    expect((await feature(b.id)).body.featured).toBe(true);
    expect((await publicGet('/public/polls/featured/en')).json().id).toBe(b.id);
    expect((await t.call({ method: 'GET', url: `/polls/${a.id}`, roles: ['reporter'] })).body.featured).toBe(false);
    await manage(b.id, 'close');
    expect((await publicGet('/public/polls/featured/en')).json()).toMatchObject({ id: b.id, open: false });
    await manage(b.id, 'archive');
    expect((await publicGet('/public/polls/featured/en')).statusCode).toBe(404);
    expect((await feature(a.id, false)).body.featured).toBe(false);
  });

  it('says so when voting is not set up, and still lets readers see polls', async () => {
    const off = await startTestApp(adminUrl!, { polls: { secret: null, perIpPerDay: 5 } });
    try {
      const made = (await off.call({ method: 'POST', url: '/polls', roles: ['reporter'], body: wording() })).body;
      await off.call({ method: 'POST', url: `/polls/${made.id}/open`, roles: ['managing_editor'] });
      expect((await off.app.inject({ method: 'GET', url: `/public/polls/${made.id}/en` })).statusCode).toBe(200);
      const res = await off.app.inject({ method: 'POST', url: `/public/polls/${made.id}/vote`, payload: { optionId: made.options[0].id, locale: 'en' } });
      expect(res.statusCode).toBe(503);
    } finally {
      await off.close();
    }
  });

  it('deletes a draft and audits the changes', async () => {
    const p = await create();
    expect((await t.call({ method: 'DELETE', url: `/polls/${p.id}`, roles: ['reporter'] })).status).toBe(204);
    expect((await t.call({ method: 'GET', url: `/polls/${p.id}`, roles: ['reporter'] })).status).toBe(404);
    const actions = (await t.db.pool.query(`SELECT DISTINCT action FROM audit_event WHERE action LIKE 'poll.%'`)).rows.map((r: any) => r.action);
    expect(actions).toEqual(expect.arrayContaining(['poll.create', 'poll.open', 'poll.close', 'poll.archive', 'poll.feature', 'poll.update', 'poll.delete']));
  });
});
