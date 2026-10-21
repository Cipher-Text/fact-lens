import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * A tiny stand-in for an S3-compatible store (path-style PUT, GET, DELETE), so the real AWS client
 * can be exercised without Docker. It checks that requests are signed, not that the signature is
 * right, so it proves the wiring (endpoint, bucket, key, body, content type), not authentication.
 */
export async function startFakeS3(bucket?: string, port = 0): Promise<{ endpoint: string; objects: Map<string, { body: Buffer; contentType: string }>; unsigned: number; close: () => Promise<void> }> {
  // Objects are held per bucket; `objects` shows the first bucket for tests that use one.
  const buckets = new Map<string, Map<string, { body: Buffer; contentType: string }>>();
  if (bucket) buckets.set(bucket, new Map());
  const objects = bucket ? buckets.get(bucket)! : new Map<string, { body: Buffer; contentType: string }>();
  const state = { unsigned: 0 };
  const xml = (res: import('node:http').ServerResponse, status: number, body: string) =>
    res.writeHead(status, { 'content-type': 'application/xml' }).end(body);
  const server: Server = createServer((req, res) => {
    if (!req.headers.authorization?.startsWith('AWS4-HMAC-SHA256')) state.unsigned++;
    const url = new URL(req.url ?? '/', 'http://x');
    const [name, ...rest] = decodeURIComponent(url.pathname).replace(/^\//, '').split('/');
    const key = rest.join('/');
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      if (!name) return void res.writeHead(404).end();
      const store = buckets.get(name);
      // Bucket operations: create, list, delete.
      if (!key) {
        if (req.method === 'PUT') {
          if (!store) buckets.set(name, new Map());
          return void res.writeHead(200).end();
        }
        if (!store) return xml(res, 404, '<Error><Code>NoSuchBucket</Code></Error>');
        if (req.method === 'GET') {
          const prefix = url.searchParams.get('prefix') ?? '';
          const keys = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
          return xml(res, 200, `<ListBucketResult><Name>${name}</Name><Prefix>${prefix}</Prefix><KeyCount>${keys.length}</KeyCount><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated>${keys.map((k) => `<Contents><Key>${k}</Key><Size>${store.get(k)!.body.length}</Size></Contents>`).join('')}</ListBucketResult>`);
        }
        if (req.method === 'DELETE') {
          if (store.size > 0) return xml(res, 409, '<Error><Code>BucketNotEmpty</Code></Error>');
          buckets.delete(name);
          return void res.writeHead(204).end();
        }
        return void res.writeHead(405).end();
      }
      if (!store) return xml(res, 404, '<Error><Code>NoSuchBucket</Code></Error>');
      if (req.method === 'PUT') {
        store.set(key, { body: Buffer.concat(chunks), contentType: String(req.headers['content-type'] ?? '') });
        return void res.writeHead(200, { etag: '"x"' }).end();
      }
      if (req.method === 'GET') {
        const o = store.get(key);
        if (!o) return xml(res, 404, '<Error><Code>NoSuchKey</Code></Error>');
        return void res.writeHead(200, { 'content-type': o.contentType, 'content-length': o.body.length }).end(o.body);
      }
      if (req.method === 'DELETE') {
        store.delete(key);
        return void res.writeHead(204).end();
      }
      res.writeHead(405).end();
    });
  });
  await new Promise<void>((r) => server.listen(port, '127.0.0.1', r));
  return {
    endpoint: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    objects,
    get unsigned() { return state.unsigned; },
    close: () => new Promise((r) => server.close(() => r())),
  };
}
