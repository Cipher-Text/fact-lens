import type { FastifyRequest } from 'fastify';

/** The TRUST_PROXY setting, provided from the environment by the app module. */
export const TRUST_PROXY = Symbol('TRUST_PROXY');

/**
 * The reader's address for the per-address rules on the public endpoints (poll votes, view counts).
 *
 * With TRUST_PROXY off, the socket address is the reader: the API is reached directly.
 *
 * With TRUST_PROXY on, the API sits behind the public site, which passes on only the reader's address
 * in X-Forwarded-For (see apps/web/src/lib/client-address.ts). A request without that header did not come
 * through the site with an address, so it has none: the socket address would be the site's own, and
 * every reader would share one bucket. Returning null skips the per-address rules for that request.
 */
export function readerAddress(req: Pick<FastifyRequest, 'ip' | 'headers'>, trustProxy: boolean): string | null {
  if (!trustProxy) return req.ip || null;
  return req.headers['x-forwarded-for'] ? req.ip || null : null;
}
