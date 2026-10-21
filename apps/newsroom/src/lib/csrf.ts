const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Cookie-authenticated writes must come from this site. Browsers send `Origin` on every
 * non-GET request, so a missing or foreign one is refused. SameSite=Lax on the cookie is the
 * second layer.
 */
export function isTrustedRequest(method: string, origin: string | null, baseUrl: string): boolean {
  if (SAFE.has(method.toUpperCase())) return true;
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}
