import { describe, expect, it } from 'vitest';
import { loadApiEnv } from '@fact-lens/config';
import { generateKeyPair, SignJWT } from 'jose';
import { startTestApp } from '../test-harness';
import { bootstrapAdmin } from './bootstrap';
import { generateAuthSettings, signInOptionsFromEnv } from './auth-keys';
import { combineVerifiers, createTokenVerifier, type TokenVerifier } from './token-verifier';

const adminUrl = process.env.TEST_DATABASE_URL;
const base = { DATABASE_URL: 'postgres://u:p@localhost:5432/db', REDIS_URL: 'redis://localhost:6379' };

function envWith(extra: Record<string, string>) {
  return loadApiEnv({ ...base, ...extra });
}

describe('sign-in keys from the environment', () => {
  it('stays off until all four settings are present', () => {
    expect(signInOptionsFromEnv(envWith({}))).toBeNull();
    // A key without its issuer and newsroom address is refused at startup, not silently ignored.
    const settings = generateAuthSettings();
    expect(() => envWith({ ...settings })).toThrow(/AUTH_ISSUER/);
  });

  it('generates a signing key and an encryption key that work together', async () => {
    const settings = generateAuthSettings();
    expect(settings.AUTH_SIGNING_KEY).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(Buffer.from(settings.AUTH_ENCRYPTION_KEY, 'base64')).toHaveLength(32);
    const options = signInOptionsFromEnv(envWith({
      ...settings, AUTH_ISSUER: 'https://api.test/', NEWSROOM_BASE_URL: 'https://newsroom.test',
    }));
    expect(options).not.toBeNull();
    const token = await new SignJWT({ roles: ['reporter'] })
      .setProtectedHeader({ alg: 'ES256' }).setIssuer('https://api.test/').setAudience('fact-lens-api')
      .setSubject('user-1').setExpirationTime('5m').sign(options!.privateKey);
    const verifier = createTokenVerifier({ issuer: 'https://api.test/', audience: 'fact-lens-api', keys: options!.publicKey });
    expect((await verifier.verify(token)).sub).toBe('user-1');
  });

  it('fails at startup on a signing key that is not a private key', () => {
    const settings = generateAuthSettings();
    expect(() => signInOptionsFromEnv(envWith({
      AUTH_SIGNING_KEY: Buffer.from('not a key').toString('base64'),
      AUTH_ENCRYPTION_KEY: settings.AUTH_ENCRYPTION_KEY,
      AUTH_ISSUER: 'https://api.test/',
      NEWSROOM_BASE_URL: 'https://newsroom.test',
    }))).toThrow();
  });

  it('sets the cookie flag from the environment', () => {
    const settings = generateAuthSettings();
    const common = { ...settings, AUTH_ISSUER: 'https://api.test/', NEWSROOM_BASE_URL: 'https://newsroom.test' };
    expect(signInOptionsFromEnv(envWith(common))!.secureCookies).toBe(false);
    expect(signInOptionsFromEnv(loadApiEnv({ ...base, ...common, NODE_ENV: 'production', INTERNAL_API_TOKEN: 'x'.repeat(32), STORAGE_DRIVER: 's3', S3_BUCKET: 'b', S3_ACCESS_KEY_ID: 'k', S3_SECRET_ACCESS_KEY: 's' }))!.secureCookies).toBe(true);
  });
});

describe('combined token verification', () => {
  const accepting = (sub: string): TokenVerifier => ({ verify: async () => ({ sub }) });
  const refusing = (message: string): TokenVerifier => ({ verify: async () => { throw new Error(message); } });

  it('accepts a token that any one verifier accepts, and refuses one none accepts', async () => {
    const both = combineVerifiers([refusing('first'), accepting('second-source')]);
    expect((await both!.verify('t')).sub).toBe('second-source');
    const none = combineVerifiers([refusing('first'), refusing('last')]);
    await expect(none!.verify('t')).rejects.toThrow('last');
  });

  it('is null with nothing to trust, so every protected route answers 401', () => {
    expect(combineVerifiers([])).toBeNull();
  });
});

describe.skipIf(!adminUrl)('bootstrap of the first administrator (database)', () => {
  it('creates one invited administrator, refuses a second, and hands over a one-time link', async () => {
    const keys = await generateKeyPair('ES256');
    const t = await startTestApp(adminUrl!);
    try {
      const options = {
        privateKey: keys.privateKey, publicKey: keys.publicKey, issuer: 'https://api.test/', audience: 'fact-lens-api',
        encryptionKey: Buffer.alloc(32, 7), secureCookies: false, newsroomUrl: 'https://newsroom.test',
      };
      const first = await bootstrapAdmin(t.db.pool, options, 'founder@example.org', 'Founder');
      expect(first.link).toMatch(/^https:\/\/newsroom\.test\/sign-in\/invitation#token=/);
      const row = await t.db.pool.query(
        `SELECT u.status, ur.role_key FROM app_user u JOIN user_role ur ON ur.user_id = u.id WHERE lower(u.email) = 'founder@example.org'`);
      expect(row.rows).toEqual([{ status: 'invited', role_key: 'admin' }]);
      await expect(bootstrapAdmin(t.db.pool, options, 'second@example.org', 'Second')).rejects.toThrow(/already exists/);
    } finally {
      await t.close();
    }
  });
});
