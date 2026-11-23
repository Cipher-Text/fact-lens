import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { trustProxySetting } from './app';

describe('trust proxy', () => {
  const echo = async (trustProxy: boolean, headers: Record<string, string>) => {
    const app = Fastify({ trustProxy: trustProxySetting(trustProxy) });
    app.get('/ip', async (req) => ({ ip: req.ip }));
    const res = await app.inject({ method: 'GET', url: '/ip', remoteAddress: '198.51.100.9', headers });
    await app.close();
    return res.json().ip as string;
  };

  it('uses the socket address when TRUST_PROXY is off, whatever the header says', async () => {
    expect(trustProxySetting(false)).toBe(false);
    expect(await echo(false, { 'x-forwarded-for': '203.0.113.7' })).toBe('198.51.100.9');
  });

  it('uses the entry the one proxy appended, not the first entry the client wrote', async () => {
    // The client sent 1.2.3.4; the proxy appended the address it saw, 203.0.113.7.
    expect(await echo(true, { 'x-forwarded-for': '1.2.3.4, 203.0.113.7' })).toBe('203.0.113.7');
  });

  it('falls back to the socket address when the proxy sent no header', async () => {
    expect(await echo(true, {})).toBe('198.51.100.9');
  });
});
