import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiClient } from './api-client';
import { PermanentJobError } from './errors';

describe('api client', () => {
  let server: Server;
  let base: string;
  let seen: { url?: string; token?: string | string[] } = {};
  let reply: { status: number; body: unknown } = { status: 200, body: {} };

  beforeAll(async () => {
    server = createServer((req, res) => {
      seen = { url: req.url, token: req.headers['x-internal-token'] };
      res.writeHead(reply.status, { 'content-type': 'application/json' }).end(JSON.stringify(reply.body));
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise((r) => server.close(r)));

  const id = '0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11';

  it('sends the internal token and returns the parsed outcome', async () => {
    reply = { status: 200, body: { result: 'published', storyId: id } };
    const res = await createApiClient(base, 'secret-token', 2000).publishSchedule(id);
    expect(res).toEqual({ result: 'published', storyId: id });
    expect(seen).toEqual({ url: `/internal/schedules/${id}/publish`, token: 'secret-token' });
  });

  it('treats 404, 401 and a malformed body as permanent failures', async () => {
    const client = createApiClient(base, 't', 2000);
    for (const r of [{ status: 404, body: {} }, { status: 401, body: {} }, { status: 200, body: { result: 'weird' } }]) {
      reply = r;
      await expect(client.publishSchedule(id)).rejects.toBeInstanceOf(PermanentJobError);
    }
  });

  it('lets server errors and unreachable hosts retry', async () => {
    reply = { status: 503, body: {} };
    const err = await createApiClient(base, 't', 2000).publishSchedule(id).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(PermanentJobError);
    const down = await createApiClient('http://127.0.0.1:1', 't', 500).publishSchedule(id).catch((e) => e);
    expect(down).not.toBeInstanceOf(PermanentJobError);
  });
});
