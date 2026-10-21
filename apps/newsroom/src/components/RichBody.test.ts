import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RichBody } from './RichBody';

const id = '0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11';
const t = (text: string, marks?: unknown[]) => ({ type: 'text', text, ...(marks ? { marks } : {}) });
const doc = (...content: unknown[]) => ({ type: 'doc', content });
const html = (body: unknown) => renderToStaticMarkup(createElement(RichBody, { body, lang: 'en' }));

describe('RichBody', () => {
  it('renders structure and marks', () => {
    const out = html(doc(
      { type: 'heading', attrs: { level: 1 }, content: [t('Title')] },
      { type: 'paragraph', content: [t('plain '), t('bold', [{ type: 'bold' }]), t(' and '), t('both', [{ type: 'bold' }, { type: 'italic' }])] },
      { type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [t('item')] }] }] },
      { type: 'blockquote', content: [{ type: 'paragraph', content: [t('quote')] }] },
      { type: 'horizontalRule' },
    ));
    expect(out).toContain('<h3');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('<em><strong>both</strong></em>');
    expect(out).toContain('<ol start="3"');
    expect(out).toContain('<blockquote');
    expect(out).toContain('<hr');
  });

  it('escapes text, so a story cannot inject markup', () => {
    const out = html(doc({ type: 'paragraph', content: [t('<script>alert(1)</script> & <img src=x onerror=alert(1)>')] }));
    expect(out).not.toContain('<script');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;script&gt;');
  });

  it('renders safe links with a safe rel, and refuses a body with an unsafe one', () => {
    const ok = html(doc({ type: 'paragraph', content: [t('go', [{ type: 'link', attrs: { href: 'https://example.com/a' } }])] }));
    expect(ok).toContain('href="https://example.com/a"');
    expect(ok).toContain('rel="noopener noreferrer nofollow"');
    const bad = html(doc({ type: 'paragraph', content: [t('go', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }])] }));
    expect(bad).toContain('This text cannot be shown.');
    expect(bad).not.toContain('javascript:');
  });

  it('shows an image from the newsroom proxy by id, with its alt text', () => {
    const out = html(doc({ type: 'image', attrs: { mediaAssetId: id, alt: 'River <b>bank</b>' } }));
    expect(out).toContain(`src="/api/media/${id}/file?variant=card"`);
    expect(out).toContain('alt="River &lt;b&gt;bank&lt;/b&gt;"');
    expect(out).toContain('loading="lazy"');
  });

  it('never loads an image from an address in the body', () => {
    expect(html(doc({ type: 'image', attrs: { src: 'https://evil.example.com/x.png', mediaAssetId: id } }))).toContain('cannot be shown');
    expect(html(doc({ type: 'image', attrs: { mediaAssetId: 'https://evil.example.com/x.png' } }))).toContain('cannot be shown');
    expect(html(doc({ type: 'image', attrs: { mediaAssetId: id } }))).not.toContain('evil');
  });

  it('refuses a body that fails the contract, and says when there is no text', () => {
    expect(html({ type: 'doc', content: [{ type: 'iframe' }] })).toContain('cannot be shown');
    expect(html({ nonsense: true })).toContain('cannot be shown');
    expect(html(doc())).toContain('No text yet.');
  });
});
