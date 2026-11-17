import { describe, expect, it } from 'vitest';
import { effectiveReadingMinutes, countWords, readingMinutesFor, type BodyNode } from './reading-time';

const para = (text: string): BodyNode => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const doc = (...content: BodyNode[]): BodyNode => ({ type: 'doc', content });
const words = (n: number, word = 'word') => Array.from({ length: n }, () => word).join(' ');

describe('reading time (doc 24)', () => {
  it('gives different times for the same word count in English and Bangla', () => {
    const body = doc(para(words(460)));
    expect(readingMinutesFor(body, 'en')).toBe(2); // 460 / 230
    expect(readingMinutesFor(body, 'bn-BD')).toBe(3); // 460 / 170 = 2.7
  });

  it('does not count Bangla punctuation (।) as a word', () => {
    const plain = doc(para('আমি ভাত খাই'));
    const withStop = doc(para('আমি ভাত খাই।'));
    expect(countWords(withStop, 'bn-BD')).toBe(countWords(plain, 'bn-BD'));
  });

  it('does not count captions or credits (images carry no text here)', () => {
    const body = doc(para('one two three'), { type: 'image', content: [{ type: 'text', text: 'caption words here' }] });
    expect(countWords(body, 'en')).toBe(3);
  });

  it('reads headings, list items and quotes, and does not count a paragraph twice', () => {
    const body = doc(
      { type: 'heading', content: [{ type: 'text', text: 'Title words' }] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [para('item one')] }, { type: 'listItem', content: [{ type: 'text', text: 'bare item' }] }] },
      { type: 'blockquote', content: [para('quoted words')] },
    );
    expect(countWords(body, 'en')).toBe(2 + 2 + 2 + 2);
  });

  it('gives 1 for an empty body', () => {
    expect(readingMinutesFor(doc(), 'en')).toBe(1);
  });

  it('uses the English rate for a language with no rate', () => {
    const body = doc(para(words(460)));
    expect(readingMinutesFor(body, 'fr')).toBe(2);
  });

  it('a changed rate changes the result', () => {
    const body = doc(para(words(460)));
    expect(readingMinutesFor(body, 'en', { en: 115, 'bn-BD': 170 })).toBe(4);
  });

  it('the override wins; no override falls back to the calculation', () => {
    expect(effectiveReadingMinutes(4, 9)).toBe(9);
    expect(effectiveReadingMinutes(4, null)).toBe(4);
    expect(effectiveReadingMinutes(4, undefined)).toBe(4);
  });
});
