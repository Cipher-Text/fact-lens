import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INTERNAL_TOKEN_HEADER } from '@fact-lens/contracts';
import { startTestApp, TEST_INTERNAL_TOKEN } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;
const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

describe.skipIf(!adminUrl)('internal scheduled publish (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let off: Awaited<ReturnType<typeof startTestApp>>;
  let deskId: string;
  let authorId: string;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
    off = await startTestApp(adminUrl!, { internalToken: null });
    deskId = (await t.db.pool.query(`SELECT id FROM desk WHERE key = 'opinion'`)).rows[0].id;
    authorId = (await t.db.pool.query(`INSERT INTO contributor (display_name) VALUES ('A. Writer') RETURNING id`)).rows[0].id;
  });
  afterAll(async () => {
    await t?.close();
    await off?.close();
  });

  const move = (id: string, to: string, roles: string[], extra: object = {}) =>
    t.call({ method: 'POST', url: `/news/${id}/transitions`, roles, body: { to, ...extra } });

  /** A news item moved to SCHEDULED, with its schedule forced to be due (or not). */
  async function scheduled(slug: string, due = true) {
    const id = (await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: slug, slug, deskId } })).body.news.id as string;
    await t.call({ method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'], body: { title: slug, body: doc('text'), slug, expectedVersion: 1 } });
    await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } });
    await move(id, 'EDITOR_REVIEW', ['reporter']);
    await move(id, 'READY', ['fact_checker']);
    const when = new Date(Date.now() + 3600_000).toISOString();
    const res = await move(id, 'SCHEDULED', ['managing_editor'], { schedule: { scheduledFor: when, timeZone: 'Asia/Dhaka' } });
    expect(res.status).toBe(201);
    const row = await t.db.pool.query(`SELECT id FROM publishing_schedule WHERE news_id = $1 AND status = 'pending'`, [id]);
    const scheduleId = row.rows[0].id as string;
    if (due) await t.db.pool.query(`UPDATE publishing_schedule SET scheduled_for = now() - interval '1 minute' WHERE id = $1`, [scheduleId]);
    return { id, scheduleId, slug };
  }

  const publish = (scheduleId: string, token: string | null = TEST_INTERNAL_TOKEN, app = t.app) =>
    app.inject({
      method: 'POST', url: `/internal/schedules/${scheduleId}/publish`,
      headers: token === null ? {} : { [INTERNAL_TOKEN_HEADER]: token },
    });
  const status = async (id: string) => (await t.db.pool.query('SELECT status FROM news WHERE id = $1', [id])).rows[0].status;
  const outbox = async (id: string) =>
    (await t.db.pool.query(`SELECT event_type FROM outbox_event WHERE aggregate_id = $1 ORDER BY id`, [id])).rows.map((r) => r.event_type);

  it('rejects calls without the internal secret, and is off when none is configured', async () => {
    const { scheduleId } = await scheduled('guarded');
    expect((await publish(scheduleId, null)).statusCode).toBe(401);
    expect((await publish(scheduleId, 'wrong-token-wrong-token-wrong-token')).statusCode).toBe(401);
    const bearer = await t.app.inject({
      method: 'POST', url: `/internal/schedules/${scheduleId}/publish`, headers: { authorization: `Bearer ${TEST_INTERNAL_TOKEN}` },
    });
    expect(bearer.statusCode).toBe(401);
    expect((await publish(scheduleId, TEST_INTERNAL_TOKEN, off.app)).statusCode).toBe(503);
    expect((await t.db.pool.query(`SELECT status FROM publishing_schedule WHERE id = $1`, [scheduleId])).rows[0].status).toBe('pending');
  });

  it('publishes a due schedule once, as the system, and records audit and outbox', async () => {
    const { id, scheduleId, slug } = await scheduled('goes-live');
    expect((await t.anonymous('GET', `/public/news/en/${slug}`)).statusCode).toBe(404);

    const first = await publish(scheduleId);
    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual({ result: 'published', newsId: id });
    expect(await status(id)).toBe('PUBLISHED');
    expect((await t.anonymous('GET', `/public/news/en/${slug}`)).statusCode).toBe(200);
    expect((await t.db.pool.query(`SELECT status, executed_at FROM publishing_schedule WHERE id = $1`, [scheduleId])).rows[0]).toMatchObject({ status: 'published' });

    const trail = await t.db.pool.query(`SELECT actor_type, actor_id, previous_state, new_state, reason FROM audit_event WHERE news_id = $1 AND new_state = 'PUBLISHED'`, [id]);
    expect(trail.rows).toEqual([{ actor_type: 'system', actor_id: 'system:scheduler', previous_state: 'SCHEDULED', new_state: 'PUBLISHED', reason: 'scheduled publish' }]);
    expect(await outbox(id)).toEqual(['news.published']);

    const again = await publish(scheduleId);
    expect(again.json()).toEqual({ result: 'already_published', newsId: id });
    expect(await outbox(id)).toEqual(['news.published']);
  });

  it('does nothing before the schedule is due', async () => {
    const { id, scheduleId } = await scheduled('too-early', false);
    expect((await publish(scheduleId)).json()).toMatchObject({ result: 'not_due', newsId: id });
    expect(await status(id)).toBe('SCHEDULED');
  });

  it('sends the news item back to READY and reports it when publishing fails', async () => {
    const a = await scheduled('contested');
    const other = (await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'B', slug: 'contested-b', deskId } })).body.news.id as string;
    await t.call({ method: 'PUT', url: `/news/${other}/translations/en`, roles: ['reporter'], body: { title: 'B', body: doc('b'), slug: 'contested', expectedVersion: 1 } });
    await t.call({ method: 'PUT', url: `/news/${other}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } });
    await move(other, 'EDITOR_REVIEW', ['reporter']);
    await move(other, 'READY', ['fact_checker']);
    expect((await move(other, 'PUBLISHED', ['managing_editor'])).status).toBe(201);

    const res = await publish(a.scheduleId);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ result: 'failed', newsId: a.id });
    expect(res.json().detail).toContain('slug');
    expect(await status(a.id)).toBe('READY');
    expect((await t.db.pool.query(`SELECT status, last_error FROM publishing_schedule WHERE id = $1`, [a.scheduleId])).rows[0]).toMatchObject({ status: 'failed' });
    expect(await outbox(a.id)).toEqual(['news.schedule_failed']);
    expect((await t.db.pool.query(`SELECT count(*)::int AS n FROM news_slug WHERE news_id = $1`, [a.id])).rows[0].n).toBe(0);
    expect((await t.anonymous('GET', '/public/news/en/contested')).json().id).toBe(other);
    expect((await publish(a.scheduleId)).json()).toMatchObject({ result: 'failed' });
  });

  it('skips a cancelled schedule and a news item that is no longer scheduled', async () => {
    const a = await scheduled('changed-mind');
    expect((await move(a.id, 'READY', ['managing_editor'])).status).toBe(201);
    expect((await publish(a.scheduleId)).json()).toMatchObject({ result: 'cancelled' });
    expect(await status(a.id)).toBe('READY');

    const b = await scheduled('withdrawn');
    expect((await move(b.id, 'ARCHIVED', ['managing_editor'], { reason: 'Legal request' })).status).toBe(201);
    expect((await publish(b.scheduleId)).json()).toMatchObject({ result: 'cancelled' });
    expect(await status(b.id)).toBe('ARCHIVED');

    const c = await scheduled('drifted');
    await t.db.pool.query(`UPDATE news SET status = 'READY' WHERE id = $1`, [c.id]);
    const res = await publish(c.scheduleId);
    expect(res.json()).toMatchObject({ result: 'cancelled', detail: 'news is READY' });
  });

  it('publishes exactly once when called twice at the same time', async () => {
    const { id, scheduleId } = await scheduled('double-tap');
    const results = await Promise.all([publish(scheduleId), publish(scheduleId)]);
    expect(results.map((r) => r.json().result).sort()).toEqual(['already_published', 'published']);
    expect(await outbox(id)).toEqual(['news.published']);
  });

  it('answers 404 for an unknown schedule and 400 for a malformed id', async () => {
    expect((await publish('0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11')).statusCode).toBe(404);
    expect((await publish('not-a-uuid')).statusCode).toBe(400);
  });
});
