import { loadWebEnv } from "@fact-lens/config";

/**
 * The reader's address, as the site may pass it on to the API for the per-address rules (one vote per
 * network address per poll, the view limit).
 *
 * Only a site that sits behind a proxy it controls can know this address: the proxy appends the address
 * it saw to X-Forwarded-For, so the last entry is the reader's, and anything the reader sent before it
 * is ignored. That is what SITE_TRUST_PROXY=true means. Without it the site cannot tell the reader from
 * anyone else, so it passes no address at all, and the API skips the per-address rules for that request.
 */
const IP_SHAPED = /^[0-9a-fA-F:.]{2,45}$/;

export function siteClientAddress(
  headers: Headers,
  trustProxy: boolean = loadWebEnv().SITE_TRUST_PROXY,
): string | null {
  if (!trustProxy) return null;
  const forwarded = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .pop();
  const candidate = forwarded ?? headers.get("x-real-ip")?.trim() ?? "";
  return IP_SHAPED.test(candidate) ? candidate : null;
}

/** The headers that carry the address to the API: the site's own value only, never the reader's. */
export function clientAddressHeaders(address: string | null): Record<string, string> {
  return address ? { "x-forwarded-for": address } : {};
}
