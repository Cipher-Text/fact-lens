import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;
const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

describe.skipIf(!adminUrl)('collaboration endpoints (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let deskId: string;
  let authorId: string;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
    deskId = (await t.db.pool.query(`SELECT id FROM desk WHERE key = 'opinion'`)).rows[0].id;
    authorId = (await t.db.pool.query(`INSERT INTO contributor (display_name) VALUES ('A. Writer') RETURNING id`)).rows[0].id;
  });
  afterAll(() => t?.close());

  const newStory = async (title = 'A story') => {
    const res = await t.call({ method: 'POST', url: '/stories', roles: ['reporter'], sub: 'rep-1', body: { locale: 'en', title } });
    expect(res.status).toBe(201);
    return res.body.story.id as string;
  };
  const readyToPublish = async (slug: string) => {
    const id = (await t.call({ method: 'POST', url: '/stories', roles: ['reporter'], body: { locale: 'en', title: slug, slug, deskId } })).body.story.id as string;
    await t.call({ method: 'PUT', url: `/stories/${id}/translations/en`, roles: ['reporter'], body: { title: slug, body: doc('text'), slug, expectedVersion: 1 } });
    await t.call({ method: 'PUT', url: `/stories/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } });
    return id;
  };
  const move = (id: string, to: string, roles: string[]) =>
    t.call({ method: 'POST', url: `/stories/${id}/transitions`, roles, body: { to } });

  describe('comments', () => {
    it('adds comments and replies, and counts open threads on the story', async () => {
      const id = await newStory();
      const top = await t.call({ method: 'POST', url: `/stories/${id}/comments`, roles: ['desk_editor'], sub: 'ed-1', body: { body: 'Source for the second paragraph?' } });
      expect(top.status).toBe(201);
      expect(top.body).toMatchObject({ author: 'ed-1', status: 'open', parentId: null });
      expect(top.body.revisionId).toBeTruthy();

      const reply = await t.call({ method: 'POST', url: `/stories/${id}/comments`, roles: ['reporter'], sub: 'rep-1', body: { body: 'Added.', parentId: top.body.id } });
      expect(reply.status).toBe(201);
      const nested = await t.call({ method: 'POST', url: `/stories/${id}/comments`, roles: ['reporter'], body: { body: 'x', parentId: reply.body.id } });
      expect(nested.status).toBe(400);

      expect((await t.call({ method: 'GET', url: `/stories/${id}`, roles: ['reporter'] })).body.openCommentCount).toBe(1);
      const all = await t.call({ method: 'GET', url: `/stories/${id}/comments`, roles: ['reporter'] });
      expect(all.body.map((c: any) => c.body)).toEqual(['Source for the second paragraph?', 'Added.']);
    });

    it('rejects empty text, foreign parents and foreign revisions', async () => {
      const a = await newStory();
      const b = await newStory();
      const other = await t.call({ method: 'POST', url: `/stories/${b}/comments`, roles: ['reporter'], body: { body: 'on b' } });
      const bRev = other.body.revisionId;
      const post = (body: unknown) => t.call({ method: 'POST', url: `/stories/${a}/comments`, roles: ['reporter'], body });
      expect((await post({ body: '   ' })).status).toBe(400);
      expect((await post({ body: 'x', parentId: other.body.id })).status).toBe(400);
      expect((await post({ body: 'x', revisionId: bRev })).status).toBe(400);
    });

    it('lets the author or a reviewer resolve and reopen, and nobody else', async () => {
      const id = await newStory();
      const c = (await t.call({ method: 'POST', url: `/stories/${id}/comments`, roles: ['desk_editor'], sub: 'ed-1', body: { body: 'Fix this' } })).body;
      const reply = (await t.call({ method: 'POST', url: `/stories/${id}/comments`, roles: ['reporter'], sub: 'rep-1', body: { body: 'ok', parentId: c.id } })).body;

      expect((await t.call({ method: 'POST', url: `/comments/${c.id}/resolve`, roles: ['reporter'], sub: 'rep-1' })).status).toBe(403);
      expect((await t.call({ method: 'POST', url: `/comments/${reply.id}/resolve`, roles: ['desk_editor'], sub: 'ed-1' })).status).toBe(400);
      const done = await t.call({ method: 'POST', url: `/comments/${c.id}/resolve`, roles: ['desk_editor'], sub: 'ed-1' });
      expect(done.status).toBe(201);
      expect(done.body).toMatchObject({ status: 'resolved', resolvedBy: 'ed-1' });
      expect(done.body.resolvedAt).toBeTruthy();
      expect((await t.call({ method: 'POST', url: `/comments/${c.id}/resolve`, roles: ['desk_editor'], sub: 'ed-1' })).status).toBe(409);
      expect((await t.call({ method: 'GET', url: `/stories/${id}`, roles: ['reporter'] })).body.openCommentCount).toBe(0);

      const byReviewer = await t.call({ method: 'POST', url: `/comments/${c.id}/reopen`, roles: ['managing_editor'], sub: 'boss' });
      expect(byReviewer.body).toMatchObject({ status: 'open', resolvedAt: null, resolvedBy: null });
      const open = await t.call({ method: 'GET', url: `/stories/${id}/comments?status=open`, roles: ['reporter'] });
      expect(open.body).toHaveLength(2);
    });

    it('needs sign-in and an editorial capability, and stays out of the public read model', async () => {
      const id = await readyToPublish('commented');
      await t.call({ method: 'POST', url: `/stories/${id}/comments`, roles: ['reporter'], body: { body: 'internal note' } });
      expect((await t.anonymous('GET', `/stories/${id}/comments`)).statusCode).toBe(401);
      expect((await t.call({ method: 'GET', url: `/stories/${id}/comments`, roles: ['analyst'] })).status).toBe(403);

      await move(id, 'EDITOR_REVIEW', ['reporter']);
      await move(id, 'READY', ['fact_checker']);
      expect((await move(id, 'PUBLISHED', ['managing_editor'])).status).toBe(201);
      const page = await t.anonymous('GET', '/public/stories/en/commented');
      expect(page.statusCode).toBe(200);
      expect(page.body).not.toContain('internal note');
      expect(page.json()).not.toHaveProperty('comments');

      const archived = await t.call({ method: 'POST', url: `/stories/${id}/transitions`, roles: ['managing_editor'], body: { to: 'ARCHIVED', reason: 'Withdrawn' } });
      expect(archived.status).toBe(201);
      const blocked = await t.call({ method: 'POST', url: `/stories/${id}/comments`, roles: ['reporter'], body: { body: 'late' } });
      expect(blocked.status).toBe(409);
    });
  });

  describe('assignments', () => {
    it('assigns work, shows it in the assignee queue and rejects duplicates', async () => {
      const id = await newStory('Queue story');
      const body = { assignee: 'fc-1', role: 'fact_checker', dueAt: '2030-01-02T00:00:00Z' };
      expect((await t.call({ method: 'POST', url: `/stories/${id}/assignments`, roles: ['reporter'], body })).status).toBe(403);
      const made = await t.call({ method: 'POST', url: `/stories/${id}/assignments`, roles: ['desk_editor'], sub: 'ed-1', body });
      expect(made.status).toBe(201);
      expect(made.body).toMatchObject({ assignee: 'fc-1', role: 'fact_checker', status: 'open', assignedBy: 'ed-1' });
      const dup = await t.call({ method: 'POST', url: `/stories/${id}/assignments`, roles: ['desk_editor'], body });
      expect(dup.status).toBe(409);
      expect(dup.body.error.details.reason).toBe('duplicate_assignment');
      expect((await t.call({ method: 'POST', url: `/stories/${id}/assignments`, roles: ['desk_editor'], body: { ...body, role: 'janitor' } })).status).toBe(400);

      const later = await newStory('Later story');
      await t.call({ method: 'POST', url: `/stories/${later}/assignments`, roles: ['desk_editor'], body: { assignee: 'fc-1', role: 'fact_checker' } });
      const sooner = await newStory('Sooner story');
      await t.call({ method: 'POST', url: `/stories/${sooner}/assignments`, roles: ['desk_editor'], body: { assignee: 'fc-1', role: 'editor', dueAt: '2029-01-01T00:00:00Z' } });

      const queue = await t.call({ method: 'GET', url: '/assignments/mine', roles: ['fact_checker'], sub: 'fc-1' });
      expect(queue.status).toBe(200);
      expect(queue.body.map((a: any) => a.storyTitles.en)).toEqual(['Sooner story', 'Queue story', 'Later story']);
      const empty = await t.call({ method: 'GET', url: '/assignments/mine', roles: ['fact_checker'], sub: 'someone-else' });
      expect(empty.body).toEqual([]);
    });

    it('lets the assignee complete, but only a reviewer cancel, and closes once', async () => {
      const id = await newStory();
      const a = (await t.call({ method: 'POST', url: `/stories/${id}/assignments`, roles: ['desk_editor'], body: { assignee: 'cp-1', role: 'copy_editor' } })).body;
      const b = (await t.call({ method: 'POST', url: `/stories/${id}/assignments`, roles: ['desk_editor'], body: { assignee: 'cp-1', role: 'translator' } })).body;

      expect((await t.call({ method: 'POST', url: `/assignments/${a.id}/complete`, roles: ['reporter'], sub: 'someone-else' })).status).toBe(403);
      const done = await t.call({ method: 'POST', url: `/assignments/${a.id}/complete`, roles: ['reporter'], sub: 'cp-1' });
      expect(done.status).toBe(201);
      expect(done.body.status).toBe('done');
      expect(done.body.completedAt).toBeTruthy();
      expect((await t.call({ method: 'POST', url: `/assignments/${a.id}/complete`, roles: ['reporter'], sub: 'cp-1' })).status).toBe(409);

      // The assignee has no story.review, so cancelling (even their own) is a reviewer's call.
      expect((await t.call({ method: 'POST', url: `/assignments/${b.id}/cancel`, roles: ['reporter'], sub: 'cp-1' })).status).toBe(403);
      const cancelled = await t.call({ method: 'POST', url: `/assignments/${b.id}/cancel`, roles: ['desk_editor'] });
      expect(cancelled.body).toMatchObject({ status: 'cancelled', completedAt: null });

      const list = await t.call({ method: 'GET', url: `/stories/${id}/assignments`, roles: ['reporter'] });
      expect(list.body.map((x: any) => x.status).sort()).toEqual(['cancelled', 'done']);
      const trail = await t.db.pool.query(`SELECT action FROM audit_event WHERE story_id = $1 AND action LIKE 'assignment.%' ORDER BY id`, [id]);
      expect(trail.rows.map((r) => r.action)).toEqual(['assignment.create', 'assignment.create', 'assignment.complete', 'assignment.cancel']);
      expect((await t.call({ method: 'POST', url: `/assignments/0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11/cancel`, roles: ['admin'] })).status).toBe(404);
    });

    it('frees the slot for a new assignment once the old one is closed', async () => {
      const id = await newStory();
      const body = { assignee: 'rep-9', role: 'reporter' };
      const first = (await t.call({ method: 'POST', url: `/stories/${id}/assignments`, roles: ['desk_editor'], body })).body;
      await t.call({ method: 'POST', url: `/assignments/${first.id}/cancel`, roles: ['desk_editor'] });
      expect((await t.call({ method: 'POST', url: `/stories/${id}/assignments`, roles: ['desk_editor'], body })).status).toBe(201);
    });
  });

  describe('sources', () => {
    const create = (body: unknown, roles = ['reporter']) => t.call({ method: 'POST', url: '/sources', roles, body });

    it('creates a source once per canonical URL', async () => {
      const first = await create({ title: 'Ministry report', url: 'HTTPS://Example.com/report/?utm_source=x#top', publisher: 'Ministry' });
      expect(first.status).toBe(201);
      expect(first.body).toMatchObject({ canonicalUrl: 'https://example.com/report', validationStatus: 'unvalidated', ingestChannel: null });
      const again = await create({ title: 'Same page', url: 'https://example.com/report?fbclid=abc' });
      expect(again.status).toBe(200);
      expect(again.body.id).toBe(first.body.id);
      const n = await t.db.pool.query(`SELECT count(*)::int AS n FROM source WHERE canonical_url = 'https://example.com/report'`);
      expect(n.rows[0].n).toBe(1);
      expect((await t.call({ method: 'GET', url: `/sources/${first.body.id}`, roles: ['reporter'] })).body.title).toBe('Ministry report');
    });

    it('refuses unsafe URLs, ingestion-only fields and callers who cannot edit', async () => {
      expect((await create({ title: 'x', url: 'javascript:alert(1)' })).status).toBe(400);
      expect((await create({ title: 'x', url: 'ftp://example.com/a' })).status).toBe(400);
      expect((await create({ title: 'x', ingestChannel: 'telegram', externalId: '1' })).status).toBe(400);
      expect((await create({ title: '' })).status).toBe(400);
      expect((await create({ title: 'x' }, ['fact_checker'])).status).toBe(403);
    });

    it('attaches, updates and detaches a source on a story with an audit trail', async () => {
      const id = await newStory();
      const src = (await create({ title: 'Court filing', url: 'https://example.org/filing' })).body;
      const put = (body: unknown, roles = ['reporter']) => t.call({ method: 'PUT', url: `/stories/${id}/sources/${src.id}`, roles, body });

      const attached = await put({ relation: 'primary', useType: 'quoted', notes: 'page 4' });
      expect(attached.status).toBe(200);
      expect(attached.body).toEqual([expect.objectContaining({ id: src.id, relation: 'primary', useType: 'quoted', notes: 'page 4' })]);
      const updated = await put({ relation: 'secondary', useType: 'background' });
      expect(updated.body[0]).toMatchObject({ relation: 'secondary', useType: 'background', notes: null });
      expect((await put({ relation: 'nope' })).status).toBe(400);
      expect((await t.call({ method: 'PUT', url: `/stories/${id}/sources/0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11`, roles: ['reporter'], body: {} })).status).toBe(404);

      const removed = await t.call({ method: 'DELETE', url: `/stories/${id}/sources/${src.id}`, roles: ['reporter'] });
      expect(removed.status).toBe(200);
      expect(removed.body).toEqual([]);
      expect((await t.call({ method: 'DELETE', url: `/stories/${id}/sources/${src.id}`, roles: ['reporter'] })).status).toBe(404);

      const trail = await t.db.pool.query(`SELECT action FROM audit_event WHERE story_id = $1 AND action LIKE 'story.source_%' ORDER BY id`, [id]);
      expect(trail.rows.map((r) => r.action)).toEqual(['story.source_attach', 'story.source_update', 'story.source_detach']);
    });

    it('lets a reviewer reject a source, which then cannot be attached', async () => {
      const src = (await create({ title: 'Dubious blog', url: 'https://example.net/blog' })).body;
      const verdict = (body: unknown, roles: string[]) => t.call({ method: 'POST', url: `/sources/${src.id}/validation`, roles, body });
      expect((await verdict({ status: 'rejected', reason: 'anonymous, unverifiable' }, ['reporter'])).status).toBe(403);
      expect((await verdict({ status: 'rejected' }, ['fact_checker'])).status).toBe(400);
      expect((await verdict({ status: 'unvalidated', reason: 'reset it' }, ['fact_checker'])).status).toBe(400);
      const rejected = await verdict({ status: 'rejected', reason: 'anonymous, unverifiable' }, ['fact_checker']);
      expect(rejected.status).toBe(201);
      expect(rejected.body.validationStatus).toBe('rejected');

      const id = await newStory();
      const res = await t.call({ method: 'PUT', url: `/stories/${id}/sources/${src.id}`, roles: ['reporter'], body: {} });
      expect(res.status).toBe(409);
      expect(res.body.error.details.reason).toBe('source_rejected');
      const trail = await t.db.pool.query(`SELECT previous_state, new_state, reason FROM audit_event WHERE object_id = $1 AND action = 'source.validate'`, [src.id]);
      expect(trail.rows).toEqual([{ previous_state: 'unvalidated', new_state: 'rejected', reason: 'anonymous, unverifiable' }]);
    });

    it('keeps source notes out of the public read model', async () => {
      const id = await readyToPublish('with-source');
      const src = (await create({ title: 'Private memo', url: 'https://example.org/memo' })).body;
      await t.call({ method: 'PUT', url: `/stories/${id}/sources/${src.id}`, roles: ['reporter'], body: { notes: 'confidential tip, do not quote' } });
      await move(id, 'EDITOR_REVIEW', ['reporter']);
      await move(id, 'READY', ['fact_checker']);
      await move(id, 'PUBLISHED', ['managing_editor']);
      const page = await t.anonymous('GET', '/public/stories/en/with-source');
      expect(page.statusCode).toBe(200);
      expect(page.body).not.toContain('confidential');
      expect(page.body).not.toContain('Private memo');
    });
  });

  describe('timeline and revisions', () => {
    it('lists what happened, newest first, with revision numbers and no denied attempts', async () => {
      const id = await readyToPublish('timeline-story');
      await move(id, 'EDITOR_REVIEW', ['reporter']);
      await t.call({ method: 'POST', url: `/stories/${id}/transitions`, roles: ['reporter'], body: { to: 'FACT_CHECK' } }); // denied
      await t.call({ method: 'POST', url: `/stories/${id}/transitions`, roles: ['desk_editor'], body: { to: 'DRAFT', reason: 'Needs a second source' } });

      const timeline = await t.call({ method: 'GET', url: `/stories/${id}/timeline`, roles: ['reporter'] });
      expect(timeline.status).toBe(200);
      const actions = timeline.body.map((e: any) => e.action);
      expect(actions).toEqual(expect.arrayContaining(['story.create', 'story.transition', 'revision.created']));
      expect(actions).not.toContain('authz.denied');
      const sentBack = timeline.body.find((e: any) => e.action === 'story.transition' && e.to === 'DRAFT');
      expect(sentBack).toMatchObject({ kind: 'event', from: 'EDITOR_REVIEW', reason: 'Needs a second source', revisionNo: 1 });
      const second = timeline.body.find((e: any) => e.action === 'revision.created' && e.revisionNo === 2);
      expect(second).toMatchObject({ kind: 'revision', reason: 'Needs a second source' });
      const times = timeline.body.map((e: any) => Date.parse(e.at));
      expect([...times].sort((a, b) => b - a)).toEqual(times);
      expect(JSON.stringify(timeline.body)).not.toContain('request');

      expect((await t.call({ method: 'GET', url: '/stories/0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11/timeline', roles: ['reporter'] })).status).toBe(404);
      expect((await t.call({ method: 'GET', url: `/stories/${id}/timeline`, roles: ['analyst'] })).status).toBe(403);
    });

    it('shows when each revision was opened', async () => {
      const id = await newStory();
      const revs = await t.call({ method: 'GET', url: `/stories/${id}/revisions`, roles: ['reporter'] });
      expect(revs.body[0].createdAt).toMatch(/^\d{4}-\d\d-\d\dT/);
      expect(Date.parse(revs.body[0].createdAt)).toBeLessThanOrEqual(Date.parse(revs.body[0].changedAt));
    });
  });
});
