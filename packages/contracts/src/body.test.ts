import { describe, expect, it } from 'vitest';
import { bodyMediaAssetIds, bodyPlainText, slugSchema, tiptapBodySchema, transitionRequestSchema } from './index';

const id = '0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11';
const doc = (...content: unknown[]) => ({ type: 'doc', content });
const p = (...content: unknown[]) => ({ type: 'paragraph', content });
const t = (text: string, marks?: unknown[]) => ({ type: 'text', text, ...(marks ? { marks } : {}) });
const ok = (v: unknown) => tiptapBodySchema.safeParse(v).success;

describe('tiptapBodySchema', () => {
  it('accepts allowed structures, including Bangla text', () => {
    expect(ok(doc())).toBe(true);
    expect(ok(doc(p(t('হ্যালো ', [{ type: 'bold' }]), t('link', [{ type: 'link', attrs: { href: 'https://example.com' } }]))))).toBe(true);
    expect(ok(doc({ type: 'heading', attrs: { level: 2 }, content: [t('H')] }, { type: 'bulletList', content: [{ type: 'listItem', content: [p(t('x'))] }] }))).toBe(true);
    expect(ok(doc({ type: 'image', attrs: { mediaAssetId: id, alt: 'a' } }))).toBe(true);
  });

  it('rejects unknown nodes, marks, attributes and scripty links', () => {
    expect(ok(doc({ type: 'script', content: [] }))).toBe(false);
    expect(ok(doc({ type: 'iframe', attrs: { src: 'https://x' } }))).toBe(false);
    expect(ok(doc(p(t('x', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]))))).toBe(false);
    expect(ok(doc(p(t('x', [{ type: 'link', attrs: { href: 'https://x', onclick: 'x()' } }]))))).toBe(false);
    expect(ok(doc(p(t('x', [{ type: 'color', attrs: { color: 'red' } }]))))).toBe(false);
    expect(ok(doc({ type: 'paragraph', attrs: { class: 'x' }, content: [t('x')] }))).toBe(false);
    expect(ok(doc({ type: 'image', attrs: { src: 'https://evil/x.png' } }))).toBe(false);
    expect(ok(doc({ type: 'heading', attrs: { level: 9 }, content: [t('x')] }))).toBe(false);
  });

  it('rejects bad structure, empty text, text on non-text nodes and extra root keys', () => {
    expect(ok(doc(t('loose text')))).toBe(false);
    expect(ok(doc(p(p(t('nested')))))).toBe(false);
    expect(ok(doc({ type: 'bulletList', content: [p(t('no item'))] }))).toBe(false);
    expect(ok(doc(p({ type: 'text', text: '' })))).toBe(false);
    expect(ok(doc({ type: 'paragraph', text: 'x', content: [] }))).toBe(false);
    expect(ok({ type: 'doc', content: [], extra: 1 })).toBe(false);
    expect(ok({ type: 'page', content: [] })).toBe(false);
  });

  it('limits nesting depth', () => {
    let node: unknown = p(t('deep'));
    for (let i = 0; i < 15; i++) node = { type: 'blockquote', content: [node] };
    expect(ok(doc(node))).toBe(false);
  });

  it('extracts plain text and image references', () => {
    const body = doc(p(t('Hello'), t('world')), { type: 'image', attrs: { mediaAssetId: id } }, { type: 'image', attrs: { mediaAssetId: id } });
    expect(bodyPlainText(body)).toBe('Hello world');
    expect(bodyMediaAssetIds(body)).toEqual([id]);
  });
});

describe('slugSchema and transitions', () => {
  it('allows Bangla slugs with vowel signs', () => {
    expect(slugSchema.safeParse('বাংলাদেশের-খবর').success).toBe(true);
    expect(slugSchema.safeParse('-bad').success).toBe(false);
    expect(slugSchema.safeParse('has space').success).toBe(false);
  });

  it('needs a schedule exactly for SCHEDULED', () => {
    const schedule = { scheduledFor: '2026-12-01T10:00:00Z', timeZone: 'Asia/Dhaka' };
    expect(transitionRequestSchema.safeParse({ to: 'SCHEDULED' }).success).toBe(false);
    expect(transitionRequestSchema.safeParse({ to: 'SCHEDULED', schedule }).success).toBe(true);
    expect(transitionRequestSchema.safeParse({ to: 'READY', schedule }).success).toBe(false);
  });
});

import { canonicalizeUrl, commentCreateSchema, sourceCreateSchema } from './index';

describe('collaboration contracts', () => {
  it('canonicalizes URLs so duplicates collapse', () => {
    expect(canonicalizeUrl('HTTPS://Example.com:443/a/b/?utm_source=x&b=2&a=1#frag')).toBe('https://example.com/a/b?a=1&b=2');
    expect(canonicalizeUrl('https://example.com/')).toBe('https://example.com');
    expect(canonicalizeUrl('https://user:pw@example.com/p')).toBe('https://example.com/p');
    expect(canonicalizeUrl('https://example.com/a?fbclid=1')).toBe('https://example.com/a');
  });

  it('rejects ingestion-only fields and non-http URLs on source creation', () => {
    expect(sourceCreateSchema.safeParse({ title: 't', url: 'https://example.com' }).success).toBe(true);
    expect(sourceCreateSchema.safeParse({ title: 't', url: 'javascript:alert(1)' }).success).toBe(false);
    expect(sourceCreateSchema.safeParse({ title: 't', ingestChannel: 'telegram' }).success).toBe(false);
  });

  it('requires non-empty comment text', () => {
    expect(commentCreateSchema.safeParse({ body: '   ' }).success).toBe(false);
    expect(commentCreateSchema.safeParse({ body: 'Check the figure' }).success).toBe(true);
  });
});

import { jobEnvelopeSchema, jobPayloadSchemas, jobQueue, jobTypes, outboxEventSchemas, queueNames } from './index';

describe('job contracts', () => {
  it('routes every job type to a known queue', () => {
    for (const type of jobTypes) expect(queueNames).toContain(jobQueue[type]);
    expect(Object.keys(jobPayloadSchemas).sort()).toEqual(Object.keys(jobQueue).sort());
  });

  it('validates outbox payloads and job envelopes', () => {
    expect(outboxEventSchemas['story.published'].safeParse({ storyId: id, revisionId: id, locales: [] }).success).toBe(false);
    expect(outboxEventSchemas['story.published'].safeParse({ storyId: id, revisionId: id, locales: [{ locale: 'en', slug: 'a' }] }).success).toBe(true);
    const env = { id, type: 'cache.invalidate', version: 1, idempotencyKey: 'k', occurredAt: '2026-10-21T10:00:00Z', payload: {} };
    expect(jobEnvelopeSchema.safeParse(env).success).toBe(true);
    expect(jobEnvelopeSchema.safeParse({ ...env, type: 'made.up' }).success).toBe(false);
    expect(jobEnvelopeSchema.safeParse({ ...env, version: 2 }).success).toBe(false);
    expect(jobPayloadSchemas['cache.invalidate'].safeParse({ tags: [] }).success).toBe(false);
  });
});
