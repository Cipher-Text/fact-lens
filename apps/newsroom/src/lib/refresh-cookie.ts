/** The name of the refresh cookie the API sets on sign-in and refresh (apps/api/src/auth/sign-in.controller.ts). */
export const API_REFRESH_COOKIE = 'fl_refresh';

/** The refresh token from an API response's Set-Cookie headers. Null when the response carries none. */
export function refreshTokenFromSetCookie(headers: string[]): string | null {
  for (const line of headers) {
    const pair = line.split(';')[0] ?? '';
    if (pair.startsWith(`${API_REFRESH_COOKIE}=`)) {
      const value = pair.slice(API_REFRESH_COOKIE.length + 1);
      return value.length > 0 ? value : null;
    }
  }
  return null;
}
