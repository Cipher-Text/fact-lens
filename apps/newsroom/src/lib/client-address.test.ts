import { describe, expect, it } from 'vitest';
import { clientAddress } from './client-address';

describe('the client address from X-Forwarded-For', () => {
  it('uses the last entry, the one the trusted proxy appended', () => {
    expect(clientAddress('203.0.113.9, 198.51.100.7')).toBe('198.51.100.7');
    expect(clientAddress('198.51.100.7')).toBe('198.51.100.7');
  });

  it('is null without the header or with an empty one', () => {
    expect(clientAddress(null)).toBeNull();
    expect(clientAddress('  ,  ')).toBeNull();
  });
});
