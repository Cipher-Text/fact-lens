import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * A tiny stand-in for an S3-compatible store (path-style PUT, GET, DELETE), so the real AWS client
 * can be exercised without Docker. It checks that requests are signed, not that the signature is
 * right, so it proves the wiring (endpoint, bucket, key, body, content type), not authentication.
 */
export async function startFakeS3(bucket: string): Promise<{ endpoint: string; objects: Map<string, { body: Buffer; contentType: string }>; unsigned: number; close: () => Promise<void> }> {
  const objects = new Map<string, { body: Buffer; contentType: string }>();
  const state = { unsigned: 0 };
  const server: Server = createServer((req, res) => {
    if (!req.headers.authorization?.startsWith('AWS4-HMAC-SHA256')) state.unsigned++;
    const url = new URL(req.url ?? '/', 'http://x');
    const prefix = `/${bucket}/`;
    if (!url.pathname.startsWith(prefix)) return void res.writeHead(404).end();
    const key = decodeURIComponent(url.pathname.slice(prefix.length));
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      if (req.method === 'PUT') {
        objects.set(key, { body: Buffer.concat(chunks), contentType: String(req.headers['content-type'] ?? '') });
        return void res.writeHead(200, { etag: '"x"' }).end();
      }
      if (req.method === 'GET') {
        const o = objects.get(key);
        if (!o) return void res.writeHead(404, { 'content-type': 'application/xml' }).end('<Error><Code>NoSuchKey</Code></Error>');
        return void res.writeHead(200, { 'content-type': o.contentType, 'content-length': o.body.length }).end(o.body);
      }
      if (req.method === 'DELETE') {
        objects.delete(key);
        return void res.writeHead(204).end();
      }
      res.writeHead(405).end();
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  return {
    endpoint: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    objects,
    get unsigned() { return state.unsigned; },
    close: () => new Promise((r) => server.close(() => r())),
  };
}
