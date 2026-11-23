import dns from 'node:dns';
import { isIP } from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';

/** Why a feed could not be fetched, in words an editor can read. Never a stack trace. */
export class FeedFetchError extends Error {}

/** True for addresses that must never be reached from here: loopback, private, link-local, carrier, multicast and the like. */
export function isPrivateAddress(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, '').split('%')[0]!;
  if (isIP(lower) === 4) {
    const [a, b] = lower.split('.').map(Number) as [number, number];
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19))
    );
  }
  if (isIP(lower) === 6) {
    if (lower === '::' || lower === '::1') return true;
    // IPv4-mapped (::ffff:1.2.3.4 or ::ffff:7f00:1): judge the IPv4 part.
    const mapped = /^::ffff:(?:(\d+\.\d+\.\d+\.\d+)|([0-9a-f]{1,4}):([0-9a-f]{1,4}))$/.exec(lower);
    if (mapped) {
      if (mapped[1]) return isPrivateAddress(mapped[1]);
      const hi = parseInt(mapped[2]!, 16), lo = parseInt(mapped[3]!, 16);
      return isPrivateAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    const g = ipv6Groups(lower);
    const ipv4At = (i: number) => `${g[i]! >> 8}.${g[i]! & 255}.${g[i + 1]! >> 8}.${g[i + 1]! & 255}`;
    const zeroTo = (end: number) => g.slice(0, end).every((x) => x === 0);
    // IPv4-compatible (::/96, deprecated) and NAT64 (64:ff9b::/96) addresses carry an IPv4 address in their last 32 bits.
    if (zeroTo(6)) return isPrivateAddress(ipv4At(6));
    if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return isPrivateAddress(ipv4At(6));
    if (g[0] === 0x64 && g[1] === 0xff9b && g[2] === 1) return true; // NAT64 local-use prefix (RFC 8215)
    // 6to4 (2002::/16) routes to the IPv4 address in its next 32 bits.
    if (g[0] === 0x2002) return isPrivateAddress(ipv4At(1));
    if (g[0] === 0x2001 && g[1] === 0) return true; // Teredo: refused outright
    if (g[0] === 0x100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return true; // discard prefix 100::/64
    if ((g[0]! & 0xffc0) === 0xfec0) return true; // site-local fec0::/10, deprecated
    return /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower) || lower.startsWith('ff');
  }
  return true; // not an address at all: do not connect
}

/** The eight 16-bit groups of an IPv6 address, with `::` expanded and a trailing dotted IPv4 turned into two groups. */
function ipv6Groups(ip: string): number[] {
  let text = ip;
  const dotted = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(text);
  if (dotted) {
    const [a, b, c, d] = dotted.slice(1).map(Number) as [number, number, number, number];
    text = `${text.slice(0, dotted.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail] = text.split('::') as [string, string | undefined];
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  const missing = 8 - headParts.length - tailParts.length;
  return [...headParts, ...Array<string>(missing).fill('0'), ...tailParts].map((part) => parseInt(part, 16));
}

type Resolve = (host: string, options: dns.LookupAllOptions, cb: (err: NodeJS.ErrnoException | null, addrs: dns.LookupAddress[]) => void) => void;

/**
 * A DNS lookup that refuses private addresses. It runs for the very connection that is made, so a
 * name that resolves to a public address when checked and a private one when used (DNS rebinding)
 * cannot get through.
 */
export function guardedLookup(allowPrivate: boolean, resolve: Resolve = dns.lookup as unknown as Resolve) {
  return (host: string, options: dns.LookupOptions, cb: (...args: unknown[]) => void) => {
    resolve(host, { ...options, all: true }, (err, addrs) => {
      if (err) return cb(err);
      if (!allowPrivate && addrs.some((a) => isPrivateAddress(a.address))) {
        return cb(new FeedFetchError('Blocked: the address points to a private network'));
      }
      return options.all ? cb(null, addrs) : cb(null, addrs[0]!.address, addrs[0]!.family);
    });
  };
}

export interface FetchedFeed {
  status: 200 | 304;
  body: string;
  etag: string | null;
  lastModified: string | null;
}

export type FeedFetcher = (url: string, conditions: { etag?: string | null; lastModified?: string | null }) => Promise<FetchedFeed>;

export interface SafeFetchOptions {
  /** Development only: lets a feed on this machine or network be fetched. */
  allowPrivate?: boolean;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  /** For tests. */
  fetchImpl?: (url: string, init: { headers: Record<string, string>; redirect: 'manual'; signal: AbortSignal }) => Promise<Response>;
  resolve?: Resolve;
}

const FEED_TYPE = /xml|rss|atom/i;

/**
 * Fetches one approved feed address and nothing else: http(s) only, no private network, a few redirects
 * (each checked again), a timeout, a size cap and an XML content type. The feed address is an allowlist
 * entry added by an administrator; this guard is what stops it from reaching inside the network.
 */
export function createFeedFetcher(opts: SafeFetchOptions = {}): FeedFetcher {
  const { allowPrivate = false, timeoutMs = 10_000, maxBytes = 2_000_000, maxRedirects = 3 } = opts;
  const agent = new Agent({ connect: { lookup: guardedLookup(allowPrivate, opts.resolve) as never } });
  const fetchImpl = opts.fetchImpl ?? ((url, init) => undiciFetch(url, { ...init, dispatcher: agent }) as unknown as Promise<Response>);

  return async (startUrl, conditions) => {
    let url = startUrl;
    for (let hop = 0; hop <= maxRedirects; hop++) {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        throw new FeedFetchError('The feed address is not a valid web address');
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new FeedFetchError('Only http and https feed addresses are fetched');
      // An address written as numbers is never looked up, so it is judged here.
      if (!allowPrivate && isIP(parsed.hostname.replace(/^\[|\]$/g, '')) !== 0 && isPrivateAddress(parsed.hostname)) {
        throw new FeedFetchError('Blocked: the address points to a private network');
      }
      const headers: Record<string, string> = { accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9', 'user-agent': 'FactLensFeedReader/1.0' };
      if (conditions.etag) headers['if-none-match'] = conditions.etag;
      if (conditions.lastModified) headers['if-modified-since'] = conditions.lastModified;

      let res: Response;
      try {
        res = await fetchImpl(parsed.toString(), { headers, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
      } catch (e) {
        if (e instanceof FeedFetchError) throw e;
        const cause = (e as { cause?: unknown }).cause;
        if (cause instanceof FeedFetchError) throw cause;
        throw new FeedFetchError((e as Error).name === 'TimeoutError' ? 'The feed did not answer in time' : 'Could not reach the feed');
      }
      if (res.status >= 300 && res.status < 400 && res.status !== 304) {
        const location = res.headers.get('location');
        if (!location) throw new FeedFetchError('The feed redirected without saying where');
        url = new URL(location, parsed).toString();
        continue;
      }
      if (res.status === 304) return { status: 304, body: '', etag: conditions.etag ?? null, lastModified: conditions.lastModified ?? null };
      if (!res.ok) throw new FeedFetchError(`The feed answered ${res.status}`);
      const type = res.headers.get('content-type') ?? '';
      if (type && !FEED_TYPE.test(type)) throw new FeedFetchError('The address did not return a feed (not XML)');
      return { status: 200, body: await readCapped(res, maxBytes), etag: res.headers.get('etag'), lastModified: res.headers.get('last-modified') };
    }
    throw new FeedFetchError('The feed redirected too many times');
  };
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const length = Number(res.headers.get('content-length'));
  if (length > maxBytes) throw new FeedFetchError('The feed is too large');
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new FeedFetchError('The feed is too large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
