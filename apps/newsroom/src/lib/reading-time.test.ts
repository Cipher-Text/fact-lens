import { describe, expect, it } from 'vitest';
import { autoHint, overrideWarning, parseOverride } from './reading-time';

describe('reading time override helpers', () => {
  it('parses blank values and integers', () => {
    expect(parseOverride('')).toBeNull();
    expect(parseOverride('  ')).toBeNull();
    expect(parseOverride('7')).toBe(7);
  });

  it('preserves out of range integers for validation and rejects invalid numbers', () => {
    expect(parseOverride('0')).toBe(0);
    expect(parseOverride('121')).toBe(121);
    expect(Number.isNaN(parseOverride('nope'))).toBe(true);
  });

  it('warns only when the difference exceeds half the auto value', () => {
    expect(overrideWarning(15, 10)).toBe(false);
    expect(overrideWarning(16, 10)).toBe(true);
  });

  it('does not warn without an auto value and formats known values', () => {
    expect(overrideWarning(20, null)).toBe(false);
    expect(overrideWarning(20, undefined)).toBe(false);
    expect(autoHint(4)).toBe('Auto: 4 min');
    expect(autoHint(null)).toBeNull();
  });
});
