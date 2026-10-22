import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GeminiService } from './gemini.service';
import { startTestApp } from '../test-harness';

const answer = (obj: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, json: async () => ({ candidates: [{ content: { parts: [{ text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] } }] }) }) as unknown as typeof fetch;

const good = { title: 'Flood hits Feni', dek: 'Thousands leave their homes.', slug: 'Flood Hits Feni!', seoTitle: 'Flood hits Feni', seoDescription: 'Thousands leave their homes in Feni.' };
const svc = (f: typeof fetch, apiKey: string | null = 'k') => new GeminiService({ apiKey, model: 'm', fetch: f });

describe('GeminiService', () => {
  it('asks for JSON in the editor language with the key in a header, and cleans the answer', async () => {
    const f = answer(good);
    const out = await svc(f).suggest('bn-BD', 'x'.repeat(50));
    expect(out.slug).toBe('flood-hits-feni');
    expect(out.title).toBe('Flood hits Feni');
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(String(url)).toContain('/models/m:generateContent');
    expect(String(url)).not.toContain('key=');
    expect(init.headers['x-goog-api-key']).toBe('k');
    const body = JSON.parse(init.body);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.contents[0].parts[0].text).toContain('Bangla');
  });

  it('cuts over-long fields to the limits and falls back for an unusable slug', async () => {
    const out = await svc(answer({ ...good, seoDescription: 'word '.repeat(200), slug: 'বাংলা' })).suggest('en', 'x'.repeat(50));
    expect(out.seoDescription.length).toBeLessThanOrEqual(320);
    expect(out.slug).toBe('flood-hits-feni');
  });

  it('offers the tags to choose from, and keeps only real ones, once each', async () => {
    const tags = [{ id: 'i1', key: 'feni', name: 'Feni' }, { id: 'i2', key: 'flood', name: 'Flood' }];
    const f = answer({ ...good, tagKeys: ['flood', 'made-up', 'flood', 'feni', 7] });
    const out = await svc(f).suggest('en', 'x'.repeat(50), tags);
    expect(out.tags).toEqual([tags[1], tags[0]]);
    const sent = JSON.parse((f as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![1].body).contents[0].parts[0].text as string;
    expect(sent).toContain('feni: Feni');
    expect((await svc(answer(good)).suggest('en', 'x'.repeat(50), tags)).tags).toEqual([]);
  });

  it('translates the fields and the body pieces, one for one', async () => {
    const req = { fromLocale: 'en', toLocale: 'bn-BD', title: 'Flood', dek: 'Many leave', seoTitle: '', seoDescription: '', segments: ['Rain ', 'fell', ''] };
    const f = answer({ title: 'বন্যা', dek: 'অনেকে চলে গেছেন', seoTitle: '', seoDescription: '', segments: ['বৃষ্টি ', 'হয়েছে', ''] });
    const out = await svc(f).translate(req);
    expect(out.segments).toEqual(['বৃষ্টি ', 'হয়েছে', '']);
    expect(out.title).toBe('বন্যা');
    expect(JSON.parse((f as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![1].body).contents[0].parts[0].text).toContain('Bangla');
  });

  it('refuses a translation with the wrong number of pieces or no headline', async () => {
    const req = { fromLocale: 'en', toLocale: 'bn-BD', title: 'Flood', dek: '', seoTitle: '', seoDescription: '', segments: ['a', 'b'] };
    const body = { title: 'x', dek: '', seoTitle: '', seoDescription: '' };
    await expect(svc(answer({ ...body, segments: ['a'] })).translate(req)).rejects.toMatchObject({ response: { reason: 'ai_bad_output' } });
    await expect(svc(answer({ ...body, title: '', segments: ['a', 'b'] })).translate(req)).rejects.toMatchObject({ response: { reason: 'ai_bad_output' } });
    await expect(svc(answer(body), null).translate(req)).rejects.toMatchObject({ response: { reason: 'ai_not_configured' } });
  });

  it('says so when no key is set, and does not call out', async () => {
    const f = answer(good);
    await expect(svc(f, null).suggest('en', 'x'.repeat(50))).rejects.toMatchObject({ response: { reason: 'ai_not_configured' } });
    expect(f).not.toHaveBeenCalled();
  });

  it('turns a failed call or an unreadable answer into a bad-gateway error', async () => {
    await expect(svc(answer(good, false)).suggest('en', 'x')).rejects.toMatchObject({ response: { reason: 'ai_error' } });
    await expect(svc(vi.fn().mockRejectedValue(new Error('down')) as unknown as typeof fetch).suggest('en', 'x')).rejects.toMatchObject({ response: { reason: 'ai_unreachable' } });
    await expect(svc(answer('not json')).suggest('en', 'x')).rejects.toMatchObject({ response: { reason: 'ai_bad_output' } });
    await expect(svc(answer({ dek: 'only' })).suggest('en', 'x')).rejects.toMatchObject({ response: { reason: 'ai_bad_output' } });
  });
});

const adminUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!adminUrl)('POST /ai/news-suggest (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    t = await startTestApp(adminUrl!, { gemini: { apiKey: 'k', model: 'm', fetch: answer(good) } });
  });
  afterAll(() => t?.close());

  it('needs news.edit, validates the text, returns a suggestion and audits the use', async () => {
    const text = 'Heavy rain flooded Feni on Monday and thousands left their homes.';
    expect((await t.call({ method: 'POST', url: '/ai/news-suggest', roles: ['reader'], body: { locale: 'en', text } })).status).toBeGreaterThanOrEqual(400);
    expect((await t.call({ method: 'POST', url: '/ai/news-suggest', roles: ['reporter'], body: { locale: 'en', text: 'short' } })).status).toBe(400);
    const ok = await t.call({ method: 'POST', url: '/ai/news-suggest', roles: ['reporter'], body: { locale: 'en', text } });
    expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    expect(ok.body.slug).toBe('flood-hits-feni');
    expect(ok.body.tags).toEqual([]);
    const audit = await t.db.pool.query(`SELECT metadata FROM audit_event WHERE action = 'ai.news_suggest'`);
    expect(audit.rowCount).toBe(1);
    expect(JSON.stringify(audit.rows[0].metadata)).not.toContain('Heavy rain');
  });
  it('POST /ai/news-translate needs news.edit, validates, and audits', async () => {
    const tt = await startTestApp(adminUrl!, { gemini: { apiKey: 'k', model: 'm', fetch: answer({ title: 'বন্যা', dek: '', seoTitle: '', seoDescription: '', segments: ['এক'] }) } });
    try {
      const body = { fromLocale: 'en', toLocale: 'bn-BD', title: 'Flood', segments: ['One'] };
      expect((await tt.call({ method: 'POST', url: '/ai/news-translate', roles: ['reader'], body })).status).toBeGreaterThanOrEqual(400);
      expect((await tt.call({ method: 'POST', url: '/ai/news-translate', roles: ['reporter'], body: { ...body, toLocale: 'en' } })).status).toBe(400);
      const ok = await tt.call({ method: 'POST', url: '/ai/news-translate', roles: ['reporter'], body });
      expect(ok.status, JSON.stringify(ok.body)).toBe(201);
      expect(ok.body.segments).toEqual(['এক']);
      expect((await tt.db.pool.query(`SELECT 1 FROM audit_event WHERE action = 'ai.news_translate'`)).rowCount).toBe(1);
    } finally {
      await tt.close();
    }
  });

  it('lets the Bangla and English versions of one news item share a slug', async () => {
    const deskId = (await t.db.pool.query(`SELECT id FROM desk LIMIT 1`)).rows[0].id;
    const doc = (x: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: x }] }] });
    const made = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], body: { locale: 'en', title: 'Flood hits Feni', slug: 'flood-hits-feni', deskId } });
    expect(made.status, JSON.stringify(made.body)).toBe(201);
    const id = made.body.news.id as string;
    const bn = await t.call({ method: 'PUT', url: `/news/${id}/translations/bn-BD`, roles: ['reporter'], body: { title: 'ফেনীতে বন্যা', body: doc('লেখা'), slug: 'flood-hits-feni', expectedVersion: null } });
    expect(bn.status, JSON.stringify(bn.body)).toBe(200);
    const authorId = (await t.db.pool.query(`INSERT INTO contributor (display_name) VALUES ('A. Writer') RETURNING id`)).rows[0].id;
    expect((await t.call({ method: 'PUT', url: `/news/${id}/translations/en`, roles: ['reporter'], body: { title: 'Flood hits Feni', body: doc('Text'), slug: 'flood-hits-feni', expectedVersion: 1 } })).status).toBe(200);
    expect((await t.call({ method: 'PUT', url: `/news/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } })).status).toBe(200);
    for (const [to, role] of [['EDITOR_REVIEW', 'reporter'], ['READY', 'fact_checker'], ['PUBLISHED', 'managing_editor']] as const) {
      const r = await t.call({ method: 'POST', url: `/news/${id}/transitions`, roles: [role], body: { to } });
      expect(r.status, JSON.stringify(r.body)).toBe(201);
    }
    const rows = await t.db.pool.query(`SELECT locale FROM news_slug WHERE news_id = $1 AND slug = 'flood-hits-feni' ORDER BY locale`, [id]);
    expect(rows.rows.map((r: any) => r.locale)).toEqual(['bn-BD', 'en']);
  });
});
