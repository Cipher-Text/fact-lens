import { getSchema } from '@tiptap/core';
import { describe, expect, it } from 'vitest';
import { bodyMarkTypes, bodyNodeTypes, tiptapBodySchema, toCanonicalBody } from '@fact-lens/contracts';
import { editorExtensions, isAllowedLink } from './extensions';

const schema = getSchema(editorExtensions);
const id = '0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11';
const t = (text: string, marks?: unknown[]) => ({ type: 'text', text, ...(marks ? { marks } : {}) });
const p = (...content: unknown[]) => ({ type: 'paragraph', ...(content.length ? { content } : {}) });
const doc = (...content: unknown[]) => ({ type: 'doc', content });

/** What opening a saved body in the editor and saving it again produces. */
const roundTrip = (body: unknown) => toCanonicalBody(schema.nodeFromJSON(body).toJSON());

describe('editor schema matches the body contract', () => {
  it('has exactly the contract’s node types', () => {
    const editor = Object.keys(schema.nodes).filter((n) => n !== 'doc').sort();
    expect(editor).toEqual([...bodyNodeTypes].sort());
  });

  it('has exactly the contract’s mark types', () => {
    expect(Object.keys(schema.marks).sort()).toEqual([...bodyMarkTypes].sort());
  });
});

describe('round trip through the editor schema', () => {
  const bodies: Record<string, unknown> = {
    'plain paragraphs': doc(p(t('One.')), p(t('Two.'))),
    'every mark': doc(p(
      t('b', [{ type: 'bold' }]), t('i', [{ type: 'italic' }]), t('u', [{ type: 'underline' }]),
      t('s', [{ type: 'strike' }]), t('c', [{ type: 'code' }]),
      t('both', [{ type: 'bold' }, { type: 'italic' }]),
    )),
    'link': doc(p(t('read', [{ type: 'link', attrs: { href: 'https://example.com/a?b=1' } }]))),
    'mail link': doc(p(t('write', [{ type: 'link', attrs: { href: 'mailto:desk@example.com' } }]))),
    'headings 1 to 4': doc(...[1, 2, 3, 4].map((level) => ({ type: 'heading', attrs: { level }, content: [t(`H${level}`)] }))),
    'lists': doc(
      { type: 'bulletList', content: [{ type: 'listItem', content: [p(t('a'))] }, { type: 'listItem', content: [p(t('b'))] }] },
      { type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [p(t('c'))] }] },
    ),
    'nested list': doc({ type: 'bulletList', content: [{ type: 'listItem', content: [p(t('a')), { type: 'bulletList', content: [{ type: 'listItem', content: [p(t('b'))] }] }] }] }),
    'blockquote and rule': doc({ type: 'blockquote', content: [p(t('quoted'))] }, { type: 'horizontalRule' }, p(t('after'))),
    'hard break': doc(p(t('line one'), { type: 'hardBreak' }, t('line two'))),
    'image reference': doc({ type: 'image', attrs: { mediaAssetId: id, alt: 'River' } }, p(t('caption'))),
    'image without alt': doc({ type: 'image', attrs: { mediaAssetId: id } }),
    'Bangla text': doc(p(t('যশোরে বাঁধ মেরামত শুরু', [{ type: 'bold' }]))),
    'empty paragraph': doc(p()),
  };

  for (const [name, body] of Object.entries(bodies)) {
    it(`keeps ${name} unchanged`, () => {
      expect(tiptapBodySchema.safeParse(body).success).toBe(true);
      const out = roundTrip(body);
      expect(out).toEqual(body);
      expect(tiptapBodySchema.safeParse(out).success).toBe(true);
    });
  }
});

describe('what the editor can produce is always accepted', () => {
  it('turns the editor’s own link markup into the strict form', () => {
    const fromEditor = doc(p(t('x', [{ type: 'link', attrs: { href: 'https://example.com', target: '_blank', rel: 'noopener noreferrer nofollow', class: null } }])));
    const node = schema.nodeFromJSON(fromEditor);
    const out = toCanonicalBody(node.toJSON());
    expect(tiptapBodySchema.safeParse(out).success).toBe(true);
    expect(JSON.stringify(out)).not.toContain('target');
  });

  it('cannot hold a code block, a table or a script, so a paste cannot add one', () => {
    for (const bad of ['codeBlock', 'table', 'script', 'iframe']) expect(schema.nodes[bad]).toBeUndefined();
    expect(() => schema.nodeFromJSON(doc({ type: 'codeBlock', content: [t('x')] }))).toThrow();
  });
});

describe('link policy', () => {
  it('allows web and mail links only', () => {
    for (const ok of ['https://example.com', 'http://example.com/a', 'mailto:a@b.co', ' https://example.com ']) expect(isAllowedLink(ok), ok).toBe(true);
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'ftp://example.com', '//evil.com', 'example.com', 'tel:123', `https://${'a'.repeat(2100)}`]) {
      expect(isAllowedLink(bad), bad).toBe(false);
    }
  });
});

describe('image display in the editor', () => {
  it('shows the picture from the newsroom proxy by id, never from an address in the body', () => {
    const node = schema.nodeFromJSON(doc({ type: 'image', attrs: { mediaAssetId: id, alt: 'River' } })).firstChild!;
    const [tag, attrs, img, caption] = node.type.spec.toDOM!(node) as unknown as [string, Record<string, string>, [string, Record<string, string>], [string, object, string]];
    expect(tag).toBe('figure');
    expect(attrs['data-media-asset-id']).toBe(id);
    expect(img[1]).toMatchObject({ src: `/api/media/${id}/file?variant=card`, alt: 'River' });
    expect(caption[2]).toContain('River');
  });
  it('reminds the writer when alt text is missing', () => {
    const node = schema.nodeFromJSON(doc({ type: 'image', attrs: { mediaAssetId: id } })).firstChild!;
    const out = node.type.spec.toDOM!(node) as unknown as unknown[];
    expect((out[3] as [string, object, string])[2]).toContain('No alt text');
  });
});
