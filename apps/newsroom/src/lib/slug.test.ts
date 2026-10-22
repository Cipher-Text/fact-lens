import { describe, expect, it } from 'vitest';
import { slugOf } from './slug';

describe('slugOf', () => {
  it('joins words with hyphens and lowercases', () => {
    expect(slugOf('Flood Hits Feni!', 'x')).toBe('flood-hits-feni');
  });
  it('keeps letters of other scripts', () => {
    expect(slugOf('ফেনীতে বন্যা', 'x')).toBe('ফেনীতে-বন্যা');
  });
  it('falls back when nothing usable is left', () => {
    expect(slugOf('!!!', 'news-1')).toBe('news-1');
  });
  it('is cut to 120 characters without a trailing hyphen', () => {
    const s = slugOf('word '.repeat(60), 'x');
    expect(s.length).toBeLessThanOrEqual(120);
    expect(s.endsWith('-')).toBe(false);
  });
});
