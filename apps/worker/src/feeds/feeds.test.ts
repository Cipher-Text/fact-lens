import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, expect, it, vi } from 'vitest';
import type { FeedIngest } from '@fact-lens/contracts';
import { handlers, type Services } from '../processors';
import { parseFeed, toPlainText } from './parse';
import { scanDueFeeds } from './scan';
import { createFeedFetcher, FeedFetchError, guardedLookup, isPrivateAddress } from './safe-fetch';
import { createTestDb } from '../test-support';
import { afterAll, beforeAll } from 'vitest';

const silentLogger = { debug() {}, info() {}, warn() {}, error() {} } as never;

describe('isPrivateAddress', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1',
    '::1', '::', 'fc00::1', 'fd12::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:7f00:1', 'ff02::1', 'not-an-ip'])('refuses %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });
  it.each(['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8'])('allows %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(false);
  });
});

describe('guardedLookup', () => {
  const resolver = (addresses: string[]) => (_h: string, _o: unknown, cb: (e: null, a: Array<{ address: string; family: number }>) => void) =>
    cb(null, addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })));
  const run = (allow: boolean, addresses: string[], all = false) =>
    new Promise<{ err: unknown; value: unknown }>((resolve) =>
      guardedLookup(allow, resolver(addresses) as never)('feed.example', { all }, (err: unknown, ...rest: unknown[]) => resolve({ err, value: rest })));

  it('refuses a name that resolves to a private address, even among public ones', async () => {
    expect((await run(false, ['93.184.216.34', '10.0.0.5'])).err).toBeInstanceOf(FeedFetchError);
  });
  it('passes public addresses, and private ones only when allowed', async () => {
    expect((await run(false, ['93.184.216.34'])).err).toBeNull();
    expect((await run(true, ['127.0.0.1'])).err).toBeNull();
  });
});

describe('createFeedFetcher', () => {
  const xml = '<rss><channel></channel></rss>';
  const respond = (status: number, init: { headers?: Record<string, string>; body?: string } = {}) =>
    new Response(init.body ?? xml, { status, headers: init.headers ?? { 'content-type': 'application/rss+xml' } });
  const fetcher = (impl: (url: string) => Response | Promise<Response>, opts = {}) =>
    createFeedFetcher({ fetchImpl: async (url) => impl(url), ...opts });

  it('fetches a feed and returns its validators', async () => {
    const f = fetcher(() => respond(200, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', etag: '"e1"', 'last-modified': 'Mon' } }));
    expect(await f('https://feed.example/rss', {})).toEqual({ status: 200, body: xml, etag: '"e1"', lastModified: 'Mon' });
  });
  it('sends the saved validators and passes a 304 on', async () => {
    const seen: Record<string, string>[] = [];
    const f = createFeedFetcher({ fetchImpl: async (_u, init) => { seen.push(init.headers); return new Response(null, { status: 304 }); } });
    expect((await f('https://feed.example/rss', { etag: '"e1"', lastModified: 'Mon' })).status).toBe(304);
    expect(seen[0]).toMatchObject({ 'if-none-match': '"e1"', 'if-modified-since': 'Mon' });
  });
  it('refuses other schemes, and addresses written as private numbers', async () => {
    const f = fetcher(() => respond(200));
    await expect(f('file:///etc/passwd', {})).rejects.toThrow(/http and https/);
    await expect(f('http://127.0.0.1/feed', {})).rejects.toThrow(/private network/);
    await expect(f('http://[::1]/feed', {})).rejects.toThrow(/private network/);
    await expect(f('http://169.254.169.254/latest/meta-data', {})).rejects.toThrow(/private network/);
  });
  it('allows a private address only when told to (development)', async () => {
    const f = fetcher(() => respond(200), { allowPrivate: true });
    expect((await f('http://127.0.0.1:9000/feed', {})).status).toBe(200);
  });
  it('follows a few redirects but checks every hop', async () => {
    const f = fetcher((url) => (url.includes('feed.example')
      ? new Response(null, { status: 302, headers: { location: 'http://10.0.0.1/inside' } })
      : respond(200)));
    await expect(f('https://feed.example/rss', {})).rejects.toThrow(/private network/);
    let n = 0;
    const loop = fetcher(() => new Response(null, { status: 301, headers: { location: `https://feed.example/${++n}` } }));
    await expect(loop('https://feed.example/rss', {})).rejects.toThrow(/too many times/);
  });
  it('refuses non-XML, oversized and failing answers, in plain words', async () => {
    await expect(fetcher(() => respond(200, { headers: { 'content-type': 'text/html' } }))('https://feed.example/x', {})).rejects.toThrow(/not XML/);
    await expect(fetcher(() => respond(200, { body: 'x'.repeat(50) }), { maxBytes: 10 })('https://feed.example/x', {})).rejects.toThrow(/too large/);
    await expect(fetcher(() => respond(500))('https://feed.example/x', {})).rejects.toThrow(/answered 500/);
    await expect(createFeedFetcher({ fetchImpl: async () => { throw new Error('boom'); } })('https://feed.example/x', {})).rejects.toThrow(/Could not reach/);
  });
});

describe('createFeedFetcher over a real connection', () => {
  const serve = (): Promise<{ server: Server; port: number }> =>
    new Promise((resolve) => {
      const server = createServer((_req, res) => { res.setHeader('content-type', 'application/rss+xml'); res.end('<rss><channel/></rss>'); });
      server.listen(0, '127.0.0.1', () => resolve({ server, port: (server.address() as AddressInfo).port }));
    });

  it('reaches a local feed only when private hosts are allowed, including through a name that resolves to loopback', async () => {
    const { server, port } = await serve();
    try {
      const open = createFeedFetcher({ allowPrivate: true });
      expect((await open(`http://127.0.0.1:${port}/rss`, {})).body).toContain('<rss>');
      expect((await open(`http://localhost:${port}/rss`, {})).status).toBe(200);
      const closed = createFeedFetcher();
      await expect(closed(`http://127.0.0.1:${port}/rss`, {})).rejects.toThrow(/private network/);
      await expect(closed(`http://localhost:${port}/rss`, {})).rejects.toThrow(/private network/);
    } finally {
      server.close();
    }
  });
});

describe('parseFeed', () => {
  it('reads RSS 2.0 into plain, short items', () => {
    const items = parseFeed(`<?xml version="1.0"?><rss version="2.0"><channel><title>T</title>
      <item><title>Flood &amp; rain</title><link>https://news.example/a?x=1</link><guid isPermaLink="false">g-1</guid>
        <description><![CDATA[<p>Heavy <b>rain</b> fell.&nbsp;Many left.</p>]]></description><pubDate>Thu, 22 Oct 2026 10:00:00 GMT</pubDate></item>
      <item><title></title><link>https://news.example/empty</link></item>
      <item><title>Bad link</title><link>javascript:alert(1)</link></item>
    </channel></rss>`);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ guid: 'g-1', title: 'Flood & rain', url: 'https://news.example/a?x=1', summary: 'Heavy rain fell. Many left.', publishedAt: '2026-10-22T10:00:00.000Z' });
    expect(items[1]!.url).toBeUndefined();
    expect(items[1]!.guid).toMatch(/^[0-9a-f]{32}$/);
  });
  it('reads Atom and RSS 1.0', () => {
    const atom = parseFeed(`<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>tag:x,1</id><title type="html">Atom &lt;b&gt;story&lt;/b&gt;</title>
      <link rel="self" href="https://x.example/self"/><link rel="alternate" href="https://x.example/story"/><summary>Sum</summary><updated>2026-10-22T10:00:00Z</updated></entry></feed>`);
    expect(atom).toEqual([{ guid: 'tag:x,1', title: 'Atom story', url: 'https://x.example/story', summary: 'Sum', publishedAt: '2026-10-22T10:00:00.000Z' }]);
    const rdf = parseFeed(`<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <item><title>Old style</title><link>https://r.example/1</link><dc:date>2026-10-21T08:00:00Z</dc:date></item></rdf:RDF>`);
    expect(rdf[0]).toMatchObject({ title: 'Old style', url: 'https://r.example/1', publishedAt: '2026-10-21T08:00:00.000Z' });
  });
  it('cuts long summaries and keeps at most 100 items', () => {
    const long = `<rss><channel><item><title>T</title><description>${'word '.repeat(400)}</description></item></channel></rss>`;
    expect(parseFeed(long)[0]!.summary!.length).toBeLessThanOrEqual(600);
    const many = `<rss><channel>${Array.from({ length: 150 }, (_, i) => `<item><title>t${i}</title><guid>${i}</guid></item>`).join('')}</channel></rss>`;
    expect(parseFeed(many)).toHaveLength(100);
  });
  it('refuses things that are not feeds, and entity tricks', () => {
    expect(() => parseFeed('<html><body>hi</body></html>')).toThrow(FeedFetchError);
    expect(() => parseFeed('<!DOCTYPE x [<!ENTITY a "aaaa">]><rss><channel/></rss>')).toThrow(/not allowed/);
  });
  it('turns markup into plain text', () => {
    expect(toPlainText('<script>x()</script>a&#233;&#x41; &lt;ok&gt;  b')).toBe('aéA <ok> b');
  });
});

const adminUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!adminUrl)('feed jobs (database)', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  let feedId: string;
  beforeAll(async () => {
    db = await createTestDb(adminUrl!);
    feedId = (await db.pool.query(`INSERT INTO feed (name, url, canonical_url) VALUES ('F', 'https://feed.example/rss', 'https://feed.example/rss') RETURNING id`)).rows[0].id;
  });
  afterAll(() => db?.drop());

  it('queues only active feeds that are due, once per window', async () => {
    const queued: string[] = [];
    const enqueue = async (r: { idempotencyKey: string }) => { queued.push(r.idempotencyKey); };
    const now = new Date('2026-10-22T12:00:00Z');
    expect(await scanDueFeeds(db.pool, enqueue as never, silentLogger, now)).toBe(1);
    expect(queued[0]).toMatch(new RegExp(`^feed:${feedId}:`));
    await db.pool.query(`UPDATE feed SET last_fetched_at = $1`, [new Date('2026-10-22T11:50:00Z')]); // 10 min ago, interval 15
    expect(await scanDueFeeds(db.pool, enqueue as never, silentLogger, now)).toBe(0);
    await db.pool.query(`UPDATE feed SET last_fetched_at = $1`, [new Date('2026-10-22T11:40:00Z')]); // 20 min ago
    expect(await scanDueFeeds(db.pool, enqueue as never, silentLogger, now)).toBe(1);
    await db.pool.query(`UPDATE feed SET active = false`);
    expect(await scanDueFeeds(db.pool, enqueue as never, silentLogger, now)).toBe(0);
    await db.pool.query(`UPDATE feed SET active = true, last_fetched_at = NULL`);
  });

  const services = (fetchFeed: Services['feeds'], reports: FeedIngest[]): Services => ({
    pool: db.pool, log: silentLogger, enqueue: async () => {}, cache: { invalidate: async () => {} }, feeds: fetchFeed,
    api: {
      publishSchedule: async () => ({ result: 'published', newsId: null }),
      ingestFeed: async (_id, r) => { reports.push(r); return { inserted: r.items.length, duplicates: 0, skipped: 0 }; },
    },
  });

  it('fetches a feed and reports its items to the API', async () => {
    const reports: FeedIngest[] = [];
    const seen = vi.fn(async () => ({ status: 200 as const, body: '<rss><channel><item><title>A</title><guid>1</guid></item></channel></rss>', etag: 'e', lastModified: null }));
    await handlers['feed.fetch'].run({ feedId }, services(seen, reports));
    expect(reports).toEqual([{ status: 'ok', etag: 'e', lastModified: null, items: [{ guid: '1', title: 'A' }] }]);
    expect(seen).toHaveBeenCalledWith('https://feed.example/rss', { etag: null, lastModified: null });
  });
  it('reports a 304, and a failure as a reason rather than a retry', async () => {
    const reports: FeedIngest[] = [];
    await handlers['feed.fetch'].run({ feedId }, services(async () => ({ status: 304, body: '', etag: null, lastModified: null }), reports));
    await handlers['feed.fetch'].run({ feedId }, services(async () => { throw new FeedFetchError('The feed did not answer in time'); }, reports));
    await handlers['feed.fetch'].run({ feedId }, services(async () => ({ status: 200, body: '<html/>', etag: null, lastModified: null }), reports));
    expect(reports.map((r) => r.status)).toEqual(['not_modified', 'error', 'error']);
    expect(reports[1]!.error).toBe('The feed did not answer in time');
  });
  it('does nothing for a feed that was removed or paused', async () => {
    const reports: FeedIngest[] = [];
    await handlers['feed.fetch'].run({ feedId: '00000000-0000-4000-8000-000000000000' }, services(async () => { throw new Error('no'); }, reports));
    await db.pool.query(`UPDATE feed SET active = false`);
    await handlers['feed.fetch'].run({ feedId }, services(async () => { throw new Error('no'); }, reports));
    expect(reports).toEqual([]);
  });
});
