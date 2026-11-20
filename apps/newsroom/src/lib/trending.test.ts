import { describe, expect, it } from 'vitest';
import { addTerm, MAX_TERM, MAX_TERMS, moveTerm, removeTerm, validateTerms } from './trending';

describe('trending term helpers', () => {
  it('trims new terms and ignores blanks', () => {
    expect(addTerm(['one'], ' two ')).toEqual(['one', 'two']);
    const terms = ['one'];
    expect(addTerm(terms, '  ')).toBe(terms);
  });
  it('ignores duplicates without regard to case', () => {
    const terms = ['Bangla'];
    expect(addTerm(terms, 'BANGLA')).toBe(terms);
    expect(validateTerms(['Bangla', 'BANGLA'])).toMatch(/listed twice/i);
  });
  it('enforces the six term limit', () => {
    const terms = Array.from({ length: MAX_TERMS }, (_, i) => `term ${i}`);
    expect(addTerm(terms, 'extra')).toBe(terms);
    expect(validateTerms([...terms, 'extra'])).toMatch(/no more than 6/i);
  });
  it('removes by index', () => expect(removeTerm(['a', 'b', 'c'], 1)).toEqual(['a', 'c']));
  it('moves terms in either direction and is a no-op at ends', () => {
    const terms = ['a', 'b', 'c'];
    expect(moveTerm(terms, 1, 'up')).toEqual(['b', 'a', 'c']);
    expect(moveTerm(terms, 1, 'down')).toEqual(['a', 'c', 'b']);
    expect(moveTerm(terms, 0, 'up')).toBe(terms);
    expect(moveTerm(terms, 2, 'down')).toBe(terms);
  });
  it('validates the 60 character limit and accepts an empty list', () => {
    expect(validateTerms(['x'.repeat(MAX_TERM)])).toBeNull();
    expect(validateTerms(['x'.repeat(MAX_TERM + 1)])).toMatch(/60 characters/i);
    expect(validateTerms([])).toBeNull();
  });
});
