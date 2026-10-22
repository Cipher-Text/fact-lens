import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../app';
import { AuditService } from '../audit/audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { AUTH_OPTIONS, AuthService, CAPABILITY_STORE } from '../auth/auth.service';
import { AuthorizationService } from '../auth/authorization.service';
import { PgCapabilityStore } from '../auth/pg-capability-store';
import { createTokenVerifier, TOKEN_VERIFIER } from '../auth/token-verifier';
import { PG_POOL } from '../db/pool';
import { createTestDatabase } from '../db/test-db';
import { seedReferenceData } from '../seed/seed';
import { PublicNewsController } from './public.controller';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { TaxonomyService } from '../taxonomy/taxonomy.service';

const adminUrl = process.env.TEST_DATABASE_URL;
const ISSUER = 'https://idp.test/';
const AUDIENCE = 'fact-lens-api';
const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });

describe.skipIf(!adminUrl)('news (database)', () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>>;
  let app: NestFastifyApplication;
  let sign: (roles: string[], opts?: { mfa?: boolean; sub?: string }) => Promise<string>;
  let deskId: string;
  let authorId: string;

  beforeAll(async () => {
    db = await createTestDatabase(adminUrl!);
    await seedReferenceData(db.pool);
    deskId = (await db.pool.query(`SELECT id FROM desk WHERE key = 'opinion'`)).rows[0].id;
    authorId = (await db.pool.query(`INSERT INTO contributor (display_name) VALUES ('A. Writer') RETURNING id`)).rows[0].id;

    const { publicKey, privateKey } = await generateKeyPair('ES256');
    const verifier = createTokenVerifier({
      issuer: ISSUER, audience: AUDIENCE, keys: createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), alg: 'ES256' }] }),
    });
    sign = (roles, { mfa = true, sub = 'user-1' } = {}) =>
      new SignJWT({ roles, ...(mfa ? { amr: ['pwd', 'mfa'] } : {}) }).setProtectedHeader({ alg: 'ES256' }).setSubject(sub)
        .setIssuer(ISSUER).setAudience(AUDIENCE).setExpirationTime('5m').sign(privateKey);

    @Module({
      controllers: [NewsController, PublicNewsController],
      providers: [
        { provide: PG_POOL, useValue: db.pool }, AuditService, AuthService, AuthorizationService, NewsService, TaxonomyService,
        { provide: TOKEN_VERIFIER, useValue: verifier },
        { provide: CAPABILITY_STORE, useValue: new PgCapabilityStore(db.pool) },
        { provide: AUTH_OPTIONS, useValue: { rolesClaim: 'roles', requireMfa: true } },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    })
    class M {}
    app = await createApp(M, 'silent');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app?.close();
    await db?.drop();
  });

  type Call = { method: 'GET' | 'POST' | 'PUT'; url: string; body?: unknown; roles?: string[]; mfa?: boolean };
  const call = async ({ method, url, body, roles = ['admin'], mfa }: Call) => {
    const res = await app.inject({
      method, url, payload: body as object | undefined,
      headers: { authorization: `Bearer ${await sign(roles, { mfa })}` },
    });
    return { status: res.statusCode, body: res.json() as any, headers: res.headers };
  };
  const pub = async (locale: string, slug: string) => {
    const res = await app.inject({ method: 'GET', url: `/public/news/${locale}/${encodeURIComponent(slug)}` });
    return { status: res.statusCode, body: res.json() as any, headers: res.headers };
  };

  /** Creates a news item that is complete enough to pass review. */
  async function draftNews(slug: string, title = `Title ${slug}`) {
    const created = await call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title, slug, deskId } });
    expect(created.status).toBe(201);
    const id = created.body.news.id as string;
    const saved = await call({
      method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'],
      body: { title, body: doc('Body text'), slug, expectedVersion: 1 },
    });
    expect(saved.status).toBe(200);
    const meta = await call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } });
    expect(meta.status).toBe(200);
    return id;
  }
  const move = (id: string, to: string, roles: string[], extra: object = {}, mfa?: boolean) =>
    call({ method: 'POST', url: `/news/${id}/transitions`, roles, body: { to, ...extra }, mfa });

  /** Takes a draft all the way to PUBLISHED. */
  async function publishedNews(slug: string) {
    const id = await draftNews(slug);
    expect((await move(id, 'EDITOR_REVIEW', ['reporter'])).status).toBe(201);
    expect((await move(id, 'READY', ['fact_checker'])).status).toBe(201);
    const published = await move(id, 'PUBLISHED', ['managing_editor']);
    expect(published.status).toBe(201);
    return id;
  }

  it('creates a draft with a derived slug and requires sign-in and capability', async () => {
    const res = await call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Hello, World!' } });
    expect(res.status).toBe(201);
    expect(res.body.news.status).toBe('DRAFT');
    expect(res.body.editable).toBe(true);
    expect(res.body.translations[0]).toMatchObject({ slug: 'hello-world', version: 1, translationStatus: 'original' });
    expect((await app.inject({ method: 'POST', url: '/news', payload: { locale: 'en', title: 'x' } })).statusCode).toBe(401);
    expect((await call({ method: 'POST', url: '/news', roles: ['fact_checker'], body: { locale: 'en', title: 'x' } })).status).toBe(403);
    expect((await call({ method: 'GET', url: '/news', roles: ['analyst'] })).status).toBe(403);
    expect((await call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'xx', title: 'x' } })).status).toBe(400);
    expect((await call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: '  ' } })).status).toBe(400);
  });

  it('saves translations with optimistic concurrency and validates the body', async () => {
    const created = await call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Edit me', slug: 'edit-me' } });
    const id = created.body.news.id;
    const save = (expectedVersion: number | null, body: unknown = doc('v'), locale = 'en') =>
      call({ method: 'PUT', url: `/news/${id}/translations/${locale}`, roles: ['reporter'], body: { title: 'Edit me', body, slug: 'edit-me', expectedVersion } });

    const ok = await save(1);
    expect(ok.status).toBe(200);
    expect(ok.body.translations[0].version).toBe(2);
    const stale = await save(1);
    expect(stale.status).toBe(409);
    expect(stale.body.error.details.reason).toBe('version_conflict');
    expect((await save(null)).status).toBe(409);

    expect((await save(2, { type: 'doc', content: [{ type: 'script' }] })).status).toBe(400);
    const bn = await save(null, doc('বাংলা'), 'bn-BD');
    expect(bn.status).toBe(200);
    expect(bn.body.translations.map((t: any) => t.locale)).toEqual(['bn-BD', 'en']);

    const unknownImage = { type: 'doc', content: [{ type: 'image', attrs: { mediaAssetId: '0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11' } }] };
    expect((await save(2, unknownImage)).status).toBe(400);
    const media = await db.pool.query(`INSERT INTO media_asset (object_key, mime_type, byte_size, sha256) VALUES ('img.png', 'image/png', 1, md5(random()::text)) RETURNING id`);
    const withImage = await save(2, { type: 'doc', content: [{ type: 'image', attrs: { mediaAssetId: media.rows[0].id } }] });
    expect(withImage.status).toBe(200);
    expect(withImage.body.media).toHaveLength(1);
    const cleared = await save(3, doc('no image now'));
    expect(cleared.body.media).toHaveLength(0);
  });

  it('lists what is missing before review, then locks the revision on submit', async () => {
    const created = await call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Bare', slug: 'bare' } });
    const id = created.body.news.id;
    const refused = await move(id, 'EDITOR_REVIEW', ['reporter']);
    expect(refused.status).toBe(422);
    expect(refused.body.error.details.issues).toEqual(['en: body is empty.', 'Credit at least one author.', 'Assign a desk.']);

    const full = await draftNews('submit-me');
    const submitted = await move(full, 'EDITOR_REVIEW', ['reporter']);
    expect(submitted.status).toBe(201);
    expect(submitted.body.news.status).toBe('EDITOR_REVIEW');
    expect(submitted.body.editable).toBe(false);
    const locked = await call({
      method: 'PUT', url: `/news/${full}/translations/en`, roles: ['reporter'],
      body: { title: 't', body: doc('x'), slug: 'submit-me', expectedVersion: 2 },
    });
    expect(locked.status).toBe(409);
    expect(locked.body.error.details.reason).toBe('revision_locked');
  });

  it('tells the caller which moves are open to them', async () => {
    const id = await draftNews('what-next');
    const asReporter = await call({ method: 'GET', url: `/news/${id}`, roles: ['reporter'] });
    expect(asReporter.body.transitions).toEqual(expect.arrayContaining([
      { to: 'EDITOR_REVIEW', capability: 'news.submit', permitted: true, reasonRequired: false, needsSchedule: false },
      { to: 'ARCHIVED', capability: 'news.publish', permitted: false, reasonRequired: true, needsSchedule: false },
    ]));
    const asEditor = await call({ method: 'GET', url: `/news/${id}`, roles: ['managing_editor'] });
    expect(asEditor.body.transitions.find((t: any) => t.to === 'ARCHIVED').permitted).toBe(true);

    await move(id, 'EDITOR_REVIEW', ['reporter']);
    const review = await call({ method: 'GET', url: `/news/${id}`, roles: ['desk_editor'] });
    expect(review.body.transitions.map((t: any) => t.to)).toEqual(expect.arrayContaining(['DRAFT', 'FACT_CHECK', 'READY', 'ARCHIVED']));
    expect(review.body.transitions.find((t: any) => t.to === 'DRAFT')).toMatchObject({ permitted: true, reasonRequired: true });
    expect(review.body.transitions.find((t: any) => t.to === 'READY')).toMatchObject({ permitted: false, capability: 'news.fact_check' });
  });

  it('checks the capability for each move from the workflow policy', async () => {
    const id = await draftNews('policy');
    expect((await move(id, 'PUBLISHED', ['admin'])).body.error.details.reason).toBe('invalid_transition');
    expect((await move(id, 'EDITOR_REVIEW', ['fact_checker'])).status).toBe(403);
    expect((await move(id, 'EDITOR_REVIEW', ['reporter'])).status).toBe(201);
    expect((await move(id, 'FACT_CHECK', ['reporter'])).status).toBe(403);
    expect((await move(id, 'FACT_CHECK', ['desk_editor'])).status).toBe(201);
    expect((await move(id, 'READY', ['desk_editor'])).status).toBe(403);
    expect((await move(id, 'READY', ['fact_checker'])).status).toBe(201);
    expect((await move(id, 'PUBLISHED', ['desk_editor'])).status).toBe(403);
  });

  it('lets a desk require a fact check through a scoped policy override', async () => {
    const other = (await db.pool.query(`INSERT INTO desk (key, name) VALUES ('strict', 'Strict') RETURNING id`)).rows[0].id;
    await db.pool.query(
      `INSERT INTO configuration (key, scope, value) VALUES ('workflow.transition_policy', $1, $2)`,
      [`desk:${other}`, JSON.stringify({
        factCheckRequired: true,
        requiredCapability: { editor_review: 'news.submit', fact_check: 'news.review', ready: 'news.fact_check', publish: 'news.publish', correct: 'news.correct', archive: 'news.publish' },
      })],
    );
    const id = await draftNews('strict-desk');
    await call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { deskId: other } });
    await move(id, 'EDITOR_REVIEW', ['reporter']);
    const skip = await move(id, 'READY', ['admin']);
    expect(skip.status).toBe(409);
    expect(skip.body.error.details.reason).toBe('fact_check_required');
    expect((await move(id, 'FACT_CHECK', ['desk_editor'])).status).toBe(201);
  });

  it('sends a news item back for changes by opening a new revision', async () => {
    const id = await draftNews('send-back');
    await move(id, 'EDITOR_REVIEW', ['reporter']);
    expect((await move(id, 'DRAFT', ['desk_editor'])).status).toBe(400);
    const back = await move(id, 'DRAFT', ['desk_editor'], { reason: 'Needs a second source' });
    expect(back.status).toBe(201);
    expect(back.body).toMatchObject({ editable: true, revisionCount: 2 });
    expect(back.body.revision).toMatchObject({ revisionNo: 2, changeReason: 'Needs a second source' });
    expect(back.body.translations[0].version).toBe(1);
    const revs = await call({ method: 'GET', url: `/news/${id}/revisions`, roles: ['reporter'] });
    expect(revs.body.map((r: any) => r.revisionNo)).toEqual([2, 1]);
    expect(revs.body[1].submittedAt).not.toBeNull();
  });

  it('publishes, serves only the published version, and records audit and outbox', async () => {
    const draftOnly = await draftNews('still-a-draft');
    expect((await pub('en', 'still-a-draft')).status).toBe(404);

    const id = await publishedNews('first-news');
    const page = await pub('en', 'first-news');
    expect(page.status).toBe(200);
    expect(page.body).toMatchObject({ id, locale: 'en', slug: 'first-news', title: 'Title first-news' });
    expect(page.body.contributors[0].contributor.displayName).toBe('A. Writer');
    expect(page.body).not.toHaveProperty('contactEmail');
    expect(page.headers['cache-control']).toContain('public');
    expect((await pub('bn-BD', 'first-news')).status).toBe(404);
    expect((await pub('en', 'still-a-draft')).status).toBe(404);
    expect(draftOnly).toBeTruthy();

    const events = await db.pool.query(`SELECT event_type, payload FROM outbox_event WHERE aggregate_id = $1`, [id]);
    expect(events.rows).toEqual([{ event_type: 'news.published', payload: expect.objectContaining({ newsId: id, locales: [{ locale: 'en', slug: 'first-news' }] }) }]);
    const trail = await db.pool.query(`SELECT previous_state, new_state, actor_id FROM audit_event WHERE news_id = $1 AND action = 'news.transition' ORDER BY id`, [id]);
    expect(trail.rows.map((r) => `${r.previous_state}>${r.new_state}`)).toEqual(['DRAFT>EDITOR_REVIEW', 'EDITOR_REVIEW>READY', 'READY>PUBLISHED']);
  });

  it('requires a multi-factor sign-in to publish', async () => {
    const id = await draftNews('needs-mfa');
    await move(id, 'EDITOR_REVIEW', ['reporter']);
    await move(id, 'READY', ['fact_checker']);
    const res = await move(id, 'PUBLISHED', ['managing_editor'], {}, false);
    expect(res.status).toBe(403);
    expect(res.body.error.details.reason).toBe('mfa_required');
    expect((await pub('en', 'needs-mfa')).status).toBe(404);
  });

  it('blocks publishing when the slug belongs to another news item', async () => {
    await publishedNews('taken-slug');
    const id = await draftNews('taken-slug-2');
    await call({ method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'], body: { title: 't', body: doc('x'), slug: 'taken-slug', expectedVersion: 2 } });
    await move(id, 'EDITOR_REVIEW', ['reporter']);
    await move(id, 'READY', ['fact_checker']);
    const res = await move(id, 'PUBLISHED', ['managing_editor']);
    expect(res.status).toBe(409);
    expect(res.body.error.details.reason).toBe('slug_conflict');
    const state = await call({ method: 'GET', url: `/news/${id}`, roles: ['reporter'] });
    expect(state.body.news.status).toBe('READY');
  });

  it('keeps the old version live while an update is edited, then redirects the old slug', async () => {
    const id = await publishedNews('update-me');
    const no = await call({ method: 'POST', url: `/news/${id}/revisions`, roles: ['reporter'], body: { reason: 'x' } });
    expect(no.status).toBe(400);
    const rev = await call({ method: 'POST', url: `/news/${id}/revisions`, roles: ['reporter'], body: { reason: 'Add new figures' } });
    expect(rev.status).toBe(201);
    expect(rev.body.news.status).toBe('UPDATED');
    expect(rev.body.revision.revisionNo).toBe(2);
    expect((await call({ method: 'POST', url: `/news/${id}/revisions`, roles: ['reporter'], body: { reason: 'again' } })).body.error.details.reason).toBe('invalid_state');

    await call({
      method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'],
      body: { title: 'Updated title', body: doc('Updated body'), slug: 'update-me-new', expectedVersion: 1 },
    });
    expect((await pub('en', 'update-me')).body.title).toBe('Title update-me');

    expect((await move(id, 'PUBLISHED', ['reporter'])).status).toBe(403);
    expect((await move(id, 'PUBLISHED', ['managing_editor'])).status).toBe(201);
    expect((await pub('en', 'update-me-new')).body.title).toBe('Updated title');
    const old = await pub('en', 'update-me');
    expect(old.status).toBe(301);
    expect(old.headers.location).toBe('/public/news/en/update-me-new');
  });

  it('records a correction and shows its notice once the corrected revision is published', async () => {
    const id = await publishedNews('fix-me');
    const denied = await call({ method: 'POST', url: `/news/${id}/corrections`, roles: ['reporter'], body: { reason: 'typo', notices: { en: 'Fixed.' } } });
    expect(denied.status).toBe(403);
    const bad = await call({ method: 'POST', url: `/news/${id}/corrections`, roles: ['managing_editor'], body: { reason: 'typo', notices: {} } });
    expect(bad.status).toBe(400);
    const res = await call({ method: 'POST', url: `/news/${id}/corrections`, roles: ['managing_editor'], body: { reason: 'Wrong date', notices: { en: 'We corrected the date.' } } });
    expect(res.status).toBe(201);
    expect(res.body.news.status).toBe('CORRECTED');
    expect(res.body.revision.isCorrection).toBe(true);
    expect((await pub('en', 'fix-me')).body.corrections).toEqual([]);

    await call({
      method: 'PUT', url: `/news/${id}/translations/en`, roles: ['managing_editor'],
      body: { title: 'Title fix-me', body: doc('Corrected body'), slug: 'fix-me', expectedVersion: 1 },
    });
    expect((await move(id, 'PUBLISHED', ['managing_editor'])).status).toBe(201);
    const live = await pub('en', 'fix-me');
    expect(live.body.corrections).toEqual([expect.objectContaining({ notice: 'We corrected the date.' })]);
    expect(JSON.stringify(live.body.body)).toContain('Corrected body');
    const row = await db.pool.query(`SELECT approved_by FROM correction WHERE news_id = $1`, [id]);
    expect(row.rows).toEqual([{ approved_by: 'user-1' }]);
  });

  it('schedules, cancels and archives', async () => {
    const id = await draftNews('scheduled');
    await move(id, 'EDITOR_REVIEW', ['reporter']);
    await move(id, 'READY', ['fact_checker']);
    expect((await move(id, 'SCHEDULED', ['managing_editor'])).status).toBe(400);
    const past = await move(id, 'SCHEDULED', ['managing_editor'], { schedule: { scheduledFor: '2020-01-01T00:00:00Z', timeZone: 'Asia/Dhaka' } });
    expect(past.status).toBe(400);
    const when = new Date(Date.now() + 3600_000).toISOString();
    const ok = await move(id, 'SCHEDULED', ['managing_editor'], { schedule: { scheduledFor: when, timeZone: 'Asia/Dhaka' } });
    expect(ok.status).toBe(201);
    expect((await db.pool.query(`SELECT status FROM publishing_schedule WHERE news_id = $1`, [id])).rows).toEqual([{ status: 'pending' }]);
    expect((await pub('en', 'scheduled')).status).toBe(404);

    expect((await move(id, 'READY', ['managing_editor'])).status).toBe(201);
    expect((await db.pool.query(`SELECT status FROM publishing_schedule WHERE news_id = $1`, [id])).rows).toEqual([{ status: 'cancelled' }]);
  });

  it('archives with a reason and takes the news item off the public site', async () => {
    const id = await publishedNews('archive-me');
    expect((await pub('en', 'archive-me')).status).toBe(200);
    expect((await move(id, 'ARCHIVED', ['managing_editor'])).status).toBe(400);
    expect((await move(id, 'ARCHIVED', ['managing_editor'], { reason: 'Legal request' })).status).toBe(201);
    expect((await pub('en', 'archive-me')).status).toBe(404);
    expect((await move(id, 'DRAFT', ['admin'])).body.error.details.reason).toBe('invalid_transition');
    const edit = await call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { deskId } });
    expect(edit.status).toBe(409);
  });

  it('lets only one of two simultaneous moves win', async () => {
    const id = await draftNews('race');
    const results = await Promise.all([move(id, 'EDITOR_REVIEW', ['reporter']), move(id, 'EDITOR_REVIEW', ['reporter'])]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    const n = await db.pool.query(`SELECT count(*)::int AS n FROM audit_event WHERE news_id = $1 AND action = 'news.transition'`, [id]);
    expect(n.rows[0].n).toBe(1);
  });

  it('lists news by status with stable pages', async () => {
    const before = await call({ method: 'GET', url: '/news?status=DRAFT&limit=100', roles: ['reporter'] });
    const total = before.body.items.length;
    expect(total).toBeGreaterThan(2);

    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const page: any = await call({ method: 'GET', url: `/news?status=DRAFT&limit=2${cursor ? `&cursor=${cursor}` : ''}`, roles: ['reporter'] });
      expect(page.status).toBe(200);
      expect(page.body.items.length).toBeLessThanOrEqual(2);
      seen.push(...page.body.items.map((s: any) => s.id));
      cursor = page.body.nextCursor;
    } while (cursor);
    expect(seen).toHaveLength(total);
    expect(new Set(seen).size).toBe(total);

    const withTitles = before.body.items.find((s: any) => s.titles.en);
    expect(withTitles.titles.en).toBeTruthy();
    expect((await call({ method: 'GET', url: '/news?cursor=garbage', roles: ['reporter'] })).status).toBe(400);
    expect((await call({ method: 'GET', url: '/news?status=NOPE', roles: ['reporter'] })).status).toBe(400);
    expect((await call({ method: 'GET', url: '/news/not-a-uuid', roles: ['reporter'] })).status).toBe(400);
    expect((await call({ method: 'GET', url: '/news/0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11', roles: ['reporter'] })).status).toBe(404);
  });

  it('serves Bangla slugs and alternates for the other locale', async () => {
    const id = await draftNews('bilingual');
    await call({
      method: 'PUT', url: `/news/${id}/translations/bn-BD`, roles: ['reporter'],
      body: { title: 'দ্বিভাষিক', body: doc('বাংলা পাঠ'), slug: 'দ্বিভাষিক-খবর', expectedVersion: null },
    });
    await move(id, 'EDITOR_REVIEW', ['reporter']);
    await move(id, 'READY', ['fact_checker']);
    await move(id, 'PUBLISHED', ['managing_editor']);
    const bn = await pub('bn-BD', 'দ্বিভাষিক-খবর');
    expect(bn.status).toBe(200);
    expect(bn.body.alternates).toEqual([{ locale: 'en', slug: 'bilingual' }]);
    expect((await pub('en', 'bilingual')).body.alternates).toEqual([{ locale: 'bn-BD', slug: 'দ্বিভাষিক-খবর' }]);
  });
});
