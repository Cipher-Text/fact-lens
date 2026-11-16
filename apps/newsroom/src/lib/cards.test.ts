import { describe, expect, it } from 'vitest';
import { headlineDefault, validateCrop } from './cards';

describe('card helpers', () => {
  it('validates a crop inside the source photo', () => {
    expect(validateCrop({ x: 0, y: 0, width: 1, height: 1 })).toBe(true);
    expect(validateCrop({ x: 0.8, y: 0, width: 0.3, height: 1 })).toBe(false);
  });

  it('uses a trimmed translation title as the headline default', () => {
    expect(headlineDefault('  Breaking news  ')).toBe('Breaking news');
    expect(headlineDefault(null)).toBe('');
  });
});
