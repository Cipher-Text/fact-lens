import { randomBytes } from 'node:crypto';
import { generateKeyPair } from 'jose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { makeImage } from '../media/test-images';
import { startTestApp } from '../test-harness';

const adminUrl = process.env.TEST_DATABASE_URL;
// A port nothing listens on: every Redis command fails, as it would during an outage.
const DOWN_REDIS = 'redis://127.0.0.1:1';

describe.skipIf(!adminUrl)('when Redis cannot answer (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    const keys = await generateKeyPair('ES256');
    t = await startTestApp(adminUrl!, {
      redisUrl: DOWN_REDIS,
      signIn: {
        privateKey: keys.privateKey, publicKey: keys.publicKey, issuer: 'https://api.test', audience: 'fact-lens-api',
        encryptionKey: randomBytes(32), secureCookies: false, attemptsPerMinute: 10, newsroomUrl: 'https://newsroom.test',
      },
    });
  });
  afterAll(() => t?.close());

  it('refuses sign-in with a 503 rather than letting password guessing through', async () => {
    const res = await t.app.inject({ method: 'POST', url: '/auth/sign-in', payload: { email: 'guess@example.org', password: 'x' } });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.message).toMatch(/Sign-in is temporarily unavailable/);
  });

  it('refuses uploads with a 503 until Redis answers again', async () => {
    const res = await t.upload(await makeImage('jpeg', 800, 600), { filename: 'outage.jpg' });
    expect(res.status).toBe(503);
    expect(res.body.error.message).toMatch(/Uploads are temporarily unavailable/);
  });
});
