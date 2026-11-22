import { describe, expect, it } from 'vitest';
import { readerAddress } from './reader-address';

const req = (ip: string, headers: Record<string, string | undefined> = {}) =>
  ({ ip, headers }) as unknown as Parameters<typeof readerAddress>[0];

describe('readerAddress', () => {
  it('uses the socket address when the API is reached directly (TRUST_PROXY off)', () => {
    expect(readerAddress(req('198.51.100.4'), false)).toBe('198.51.100.4');
    expect(readerAddress(req('198.51.100.4', { 'x-forwarded-for': '203.0.113.7' }), false)).toBe('198.51.100.4');
  });

  it('uses the address the site passed on when TRUST_PROXY is on', () => {
    expect(readerAddress(req('203.0.113.7', { 'x-forwarded-for': '203.0.113.7' }), true)).toBe('203.0.113.7');
  });

  it('gives no address when TRUST_PROXY is on and the site sent none, so the site is not counted as every reader', () => {
    expect(readerAddress(req('10.0.0.5'), true)).toBeNull();
  });

  it('gives no address when the socket address is empty', () => {
    expect(readerAddress(req('', { 'x-forwarded-for': '203.0.113.7' }), false)).toBeNull();
  });
});
