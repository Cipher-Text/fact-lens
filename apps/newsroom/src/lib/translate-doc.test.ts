import { describe, expect, it } from 'vitest';
import { collectTexts, replaceTexts } from './translate-doc';

const doc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Flood' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Rain ' }, { type: 'text', text: 'fell', marks: [{ type: 'bold' }] }] },
    { type: 'image', attrs: { mediaAssetId: 'm1', alt: 'a' } },
  ],
};

describe('translate-doc', () => {
  it('lists text pieces in reading order', () => {
    expect(collectTexts(doc)).toEqual(['Flood', 'Rain ', 'fell']);
    expect(collectTexts({ type: 'doc', content: [] })).toEqual([]);
  });

  it('replaces them in place, keeping marks, attributes and images, without changing the original', () => {
    const out = replaceTexts(doc, ['বন্যা', 'বৃষ্টি ', 'হয়েছে']);
    expect(collectTexts(out)).toEqual(['বন্যা', 'বৃষ্টি ', 'হয়েছে']);
    expect((out.content[1]!.content![1] as { marks?: unknown }).marks).toEqual([{ type: 'bold' }]);
    expect(out.content[2]).toEqual(doc.content[2]);
    expect(collectTexts(doc)).toEqual(['Flood', 'Rain ', 'fell']);
  });

  it('refuses a different number of pieces', () => {
    expect(() => replaceTexts(doc, ['a', 'b'])).toThrow();
  });
});
