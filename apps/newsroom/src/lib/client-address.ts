/**
 * The editor's address from X-Forwarded-For. A reverse proxy in front of the newsroom appends the real client address as
 * the last entry; anything before it was sent by the client and can be anything, so only the last entry is used
 * (ADR-047, step A8). With no proxy there is no header and no address.
 */
export function clientAddress(forwardedFor: string | null): string | null {
  if (!forwardedFor) return null;
  const last = forwardedFor.split(',').pop()?.trim();
  return last ? last : null;
}
