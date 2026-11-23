import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  getEnv: () => ({ NEWSROOM_BASE_URL: 'https://newsroom.test', API_BASE_URL: 'https://api.test' }),
}));
vi.mock('@/lib/current', () => ({ getSession: async () => ({ accessToken: 'editor-token' }) }));

import { POST } from './route';

const MAX_BODY = 1_000_000;
const write = (origin: string, body: string, path = 'news') =>
  POST(
    new NextRequest(`https://newsroom.test/api/${path}`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body,
    }),
    { params: Promise.resolve({ path: path.split('/') }) },
  );

describe('API proxy writes', () => {
  const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }));

  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('refuses a write from another site before it reads the body', async () => {
    const res = await write('https://evil.example', '{"title":"x"}');
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a JSON body over the cap, and stops reading it there', async () => {
    const res = await write('https://newsroom.test', 'x'.repeat(MAX_BODY + 1));
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards a JSON body within the cap, with the editor token', async () => {
    const res = await write('https://newsroom.test', '{"title":"ok"}');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.test/news');
    expect(init.body).toBe('{"title":"ok"}');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer editor-token');
  });
});
