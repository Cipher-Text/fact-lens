import { describe, expect, it } from 'vitest';
import { refreshTokenFromSetCookie } from './refresh-cookie';

describe('the API refresh cookie', () => {
  it('reads the refresh token from the Set-Cookie headers, whatever else is set', () => {
    expect(refreshTokenFromSetCookie(['other=1; Path=/', 'fl_refresh=abc.DEF_123-x; Path=/auth; HttpOnly; SameSite=Strict; Max-Age=28800'])).toBe('abc.DEF_123-x');
  });

  it('returns null when the cookie is absent or empty', () => {
    expect(refreshTokenFromSetCookie([])).toBeNull();
    expect(refreshTokenFromSetCookie(['fl_refresh=; Max-Age=0'])).toBeNull();
    expect(refreshTokenFromSetCookie(['fl_refresh_other=1'])).toBeNull();
  });
});
