/**
 * The editor's address from X-Forwarded-For, for the API's sign-in limits (ADR-050).
 *
 * Only a newsroom that sits behind a proxy it controls can know the address: the proxy appends the address it saw as
 * the last entry, and anything the client sent before it is ignored. That is what NEWSROOM_TRUST_PROXY=true means.
 * Without it, the header is whatever the client sent, so no address is passed on.
 */
export function clientAddress(forwardedFor: string | null, trustProxy: boolean): string | null {
  if (!trustProxy || !forwardedFor) return null;
  const last = forwardedFor.split(',').pop()?.trim();
  return last ? last : null;
}
