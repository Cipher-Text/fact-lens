import { describe, expect, it } from 'vitest';
import { loadApiEnv, loadDatabaseEnv, loadNewsroomEnv, loadWebEnv, loadWorkerEnv } from './index';

const base = { DATABASE_URL: 'postgres://u:p@localhost:5432/db', REDIS_URL: 'redis://localhost:6379' };

describe('loadApiEnv', () => {
  it('applies defaults', () => {
    const env = loadApiEnv(base);
    expect(env.API_PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
  });
  it('treats an empty GEMINI_API_KEY as not set, and defaults the model', () => {
    expect(loadApiEnv({ ...base, GEMINI_API_KEY: '' }).GEMINI_API_KEY).toBeUndefined();
    expect(loadApiEnv({ ...base, GEMINI_API_KEY: ' k ' }).GEMINI_API_KEY).toBe('k');
    expect(loadApiEnv(base).GEMINI_MODEL).toBe('gemini-2.5-flash');
  });
  it('reads the site social links and contact details, and treats empty as not set', () => {
    const none = loadApiEnv({ ...base, SITE_SOCIAL_X_URL: '', SITE_CONTACT_EMAIL: ' ', SITE_CONTACT_PHONE: '' });
    expect(none.SITE_SOCIAL_X_URL).toBeUndefined();
    expect(none.SITE_CONTACT_EMAIL).toBeUndefined();
    const set = loadApiEnv({
      ...base, SITE_SOCIAL_FACEBOOK_URL: ' https://www.facebook.com/factlens ', SITE_CONTACT_EMAIL: 'desk@factlens.example',
      SITE_CONTACT_PHONE: '+880 2 5555 0100', SITE_CONTACT_ADDRESS: '12 Press Road, Dhaka',
    });
    expect(set.SITE_SOCIAL_FACEBOOK_URL).toBe('https://www.facebook.com/factlens');
    expect(set.SITE_CONTACT_EMAIL).toBe('desk@factlens.example');
    expect(set.SITE_CONTACT_ADDRESS).toBe('12 Press Road, Dhaka');
    expect(() => loadApiEnv({ ...base, SITE_SOCIAL_X_URL: 'http://x.com/a' })).toThrow(/SITE_SOCIAL_X_URL/);
    expect(() => loadApiEnv({ ...base, SITE_SOCIAL_X_URL: 'not a url' })).toThrow(/SITE_SOCIAL_X_URL/);
    expect(() => loadApiEnv({ ...base, SITE_CONTACT_EMAIL: 'nope' })).toThrow(/SITE_CONTACT_EMAIL/);
  });
  it('rejects a missing DATABASE_URL', () => {
    expect(() => loadApiEnv({ REDIS_URL: base.REDIS_URL })).toThrow(/DATABASE_URL/);
  });
  it('rejects an out-of-range port', () => {
    expect(() => loadApiEnv({ ...base, API_PORT: '70000' })).toThrow(/API_PORT/);
  });

  it('loads database-only config without REDIS_URL', () => {
    expect(loadDatabaseEnv({ DATABASE_URL: base.DATABASE_URL }).DATABASE_URL).toBe(base.DATABASE_URL);
    expect(() => loadDatabaseEnv({})).toThrow(/DATABASE_URL/);
  });

  it('requires the backend sign-in keys in production, not an external provider', () => {
    expect(() => loadApiEnv({ ...base, NODE_ENV: 'production' })).toThrow(/AUTH_SIGNING_KEY/);
    expect(() => loadApiEnv({ ...base, AUTH_SIGNING_KEY: 'k', AUTH_ENCRYPTION_KEY: Buffer.alloc(16).toString('base64'), AUTH_ISSUER: 'https://api.example.org', NEWSROOM_BASE_URL: 'https://newsroom.example.org' })).toThrow(/32 bytes/);
    const ok = loadApiEnv({ ...base, NODE_ENV: 'production', AUTH_SIGNING_KEY: 'k', AUTH_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString('base64'), AUTH_ISSUER: 'https://api.example.org', NEWSROOM_BASE_URL: 'https://newsroom.example.org', INTERNAL_API_TOKEN: 'x'.repeat(32), STORAGE_DRIVER: 's3', S3_BUCKET: 'media', S3_ACCESS_KEY_ID: 'k', S3_SECRET_ACCESS_KEY: 's' });
    expect(ok.OIDC_REQUIRE_MFA).toBe(true);
    expect(ok.AUTH_AUDIENCE).toBe('fact-lens-api');
    expect(loadApiEnv({ ...base, OIDC_REQUIRE_MFA: 'false' }).OIDC_REQUIRE_MFA).toBe(false);
  });

  it('loads worker config and rejects a short internal token', () => {
    const worker = { ...base, API_BASE_URL: 'http://api.internal:4000', INTERNAL_API_TOKEN: 'y'.repeat(32) };
    expect(loadWorkerEnv(worker)).toMatchObject({ OUTBOX_POLL_MS: 1000, JOB_CONCURRENCY: 5, WORKER_HEALTH_HOST: '127.0.0.1' });
    expect(() => loadWorkerEnv({ ...worker, INTERNAL_API_TOKEN: 'short' })).toThrow(/INTERNAL_API_TOKEN/);
    // A feed on a private address is for development only: production refuses it.
    expect(() => loadWorkerEnv({ ...worker, NODE_ENV: 'production', FEED_ALLOW_PRIVATE_HOSTS: 'true' })).toThrow(/FEED_ALLOW_PRIVATE_HOSTS/);
    expect(loadWorkerEnv({ ...worker, NODE_ENV: 'development', FEED_ALLOW_PRIVATE_HOSTS: 'true' }).FEED_ALLOW_PRIVATE_HOSTS).toBe(true);
    expect(() => loadApiEnv({ ...base, INTERNAL_API_TOKEN: 'short' })).toThrow(/INTERNAL_API_TOKEN/);
  });

  it('loads newsroom config and rejects a short session secret', () => {
    const env = { NEWSROOM_BASE_URL: 'http://localhost:3100', API_BASE_URL: 'http://localhost:4000', OIDC_ISSUER: 'http://idp.test', OIDC_CLIENT_ID: 'newsroom', SESSION_SECRET: 's'.repeat(32) };
    const loaded = loadNewsroomEnv(env);
    expect(loaded.OIDC_SCOPE).toBe('openid profile');
    expect(loaded.OIDC_CLIENT_SECRET).toBeUndefined();
    expect(() => loadNewsroomEnv({ ...env, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
    expect(() => loadNewsroomEnv({ ...env, OIDC_ISSUER: 'nope' })).toThrow(/OIDC_ISSUER/);
  });

  it('keeps media on local disk in development and requires a real bucket in production', () => {
    const dev = loadApiEnv(base);
    expect(dev.STORAGE_DRIVER).toBe('fs');
    expect(dev.MAX_UPLOAD_MB).toBe(10);
    expect(() => loadApiEnv({ ...base, STORAGE_DRIVER: 's3' })).toThrow(/S3_BUCKET/);
    expect(() => loadApiEnv({ ...base, MAX_UPLOAD_MB: '99' })).toThrow(/MAX_UPLOAD_MB/);
    const prodBase = { ...base, NODE_ENV: 'production', AUTH_SIGNING_KEY: 'k', AUTH_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString('base64'), AUTH_ISSUER: 'https://api.example.org', NEWSROOM_BASE_URL: 'https://newsroom.example.org', INTERNAL_API_TOKEN: 'x'.repeat(32) };
    expect(() => loadApiEnv(prodBase)).toThrow(/STORAGE_DRIVER/);
    expect(loadApiEnv({ ...prodBase, STORAGE_DRIVER: 's3', S3_BUCKET: 'm', S3_ACCESS_KEY_ID: 'k', S3_SECRET_ACCESS_KEY: 's', S3_FORCE_PATH_STYLE: 'true' }).S3_FORCE_PATH_STYLE).toBe(true);
  });
});

describe('web (public site) settings', () => {
  it('reads SITE_TRUST_PROXY as a boolean, off by default', () => {
    expect(loadWebEnv({}).SITE_TRUST_PROXY).toBe(false);
    expect(loadWebEnv({ SITE_TRUST_PROXY: 'true' }).SITE_TRUST_PROXY).toBe(true);
    expect(loadWebEnv({ SITE_TRUST_PROXY: 'false' }).SITE_TRUST_PROXY).toBe(false);
  });

  it('refuses a value that is not a boolean, at start-up rather than per request', () => {
    expect(() => loadWebEnv({ SITE_TRUST_PROXY: 'maybe' })).toThrow(/SITE_TRUST_PROXY/);
  });
});

describe('development quick sign-in setting (ADR-064)', () => {
  const newsroom = { NEWSROOM_BASE_URL: 'http://localhost:3100', API_BASE_URL: 'http://localhost:4000', SESSION_SECRET: 's'.repeat(32) };

  it('is off by default in every app that reads it', () => {
    expect(loadApiEnv(base).DEV_QUICK_LOGIN).toBe(false);
    expect(loadNewsroomEnv(newsroom).DEV_QUICK_LOGIN).toBe(false);
    expect(loadDatabaseEnv({ DATABASE_URL: base.DATABASE_URL }).DEV_QUICK_LOGIN).toBe(false);
  });

  it('can be turned on in development', () => {
    expect(loadApiEnv({ ...base, DEV_QUICK_LOGIN: 'true' }).DEV_QUICK_LOGIN).toBe(true);
    expect(loadNewsroomEnv({ ...newsroom, DEV_QUICK_LOGIN: 'true' }).DEV_QUICK_LOGIN).toBe(true);
    expect(loadDatabaseEnv({ DATABASE_URL: base.DATABASE_URL, DEV_QUICK_LOGIN: 'true' }).DEV_QUICK_LOGIN).toBe(true);
  });

  it('is refused in production, in the API, the newsroom and the seed', () => {
    expect(() => loadApiEnv({ ...base, NODE_ENV: 'production', DEV_QUICK_LOGIN: 'true' })).toThrow(/DEV_QUICK_LOGIN/);
    expect(() => loadNewsroomEnv({ ...newsroom, NODE_ENV: 'production', DEV_QUICK_LOGIN: 'true' })).toThrow(/DEV_QUICK_LOGIN/);
    expect(() => loadDatabaseEnv({ DATABASE_URL: base.DATABASE_URL, NODE_ENV: 'production', DEV_QUICK_LOGIN: 'true' })).toThrow(/DEV_QUICK_LOGIN/);
  });
});

describe('production: a service refuses another service\'s secrets (D3, docs/plans/deployment/env-matrix.md)', () => {
  const urls = { DATABASE_URL: 'postgres://u:p@db.internal:5432/factlens', REDIS_URL: 'redis://redis.internal:6379' };
  const apiProd = {
    ...urls, NODE_ENV: 'production', AUTH_SIGNING_KEY: 'k', AUTH_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString('base64'),
    AUTH_ISSUER: 'https://api.example.org', NEWSROOM_BASE_URL: 'https://newsroom.example.org', INTERNAL_API_TOKEN: 'x'.repeat(32),
    STORAGE_DRIVER: 's3', S3_BUCKET: 'media', S3_ACCESS_KEY_ID: 'k', S3_SECRET_ACCESS_KEY: 's',
  };
  const workerProd = { ...urls, NODE_ENV: 'production', API_BASE_URL: 'http://api.internal:4000', INTERNAL_API_TOKEN: 'x'.repeat(32) };
  const newsroomProd = { NODE_ENV: 'production', NEWSROOM_BASE_URL: 'https://newsroom.example.org', API_BASE_URL: 'http://api.internal:4000', SESSION_SECRET: 's'.repeat(32) };

  it('loads each service with its own production settings', () => {
    expect(() => loadApiEnv(apiProd)).not.toThrow();
    expect(() => loadWorkerEnv(workerProd)).not.toThrow();
    expect(() => loadNewsroomEnv(newsroomProd)).not.toThrow();
    expect(() => loadWebEnv({ NODE_ENV: 'production' })).not.toThrow();
  });

  it('the worker refuses the API\'s sign-in keys and storage keys', () => {
    expect(() => loadWorkerEnv({ ...workerProd, AUTH_SIGNING_KEY: 'k' })).toThrow(/AUTH_SIGNING_KEY: must not be set in the worker service: it is the api service's secret/);
    expect(() => loadWorkerEnv({ ...workerProd, S3_SECRET_ACCESS_KEY: 's' })).toThrow(/S3_SECRET_ACCESS_KEY/);
    expect(() => loadWorkerEnv({ ...workerProd, SESSION_SECRET: 's'.repeat(32) })).toThrow(/SESSION_SECRET/);
  });

  it('the newsroom refuses the database address and the internal token', () => {
    expect(() => loadNewsroomEnv({ ...newsroomProd, DATABASE_URL: urls.DATABASE_URL })).toThrow(/DATABASE_URL: must not be set in the newsroom service: it is the api service's secret/);
    expect(() => loadNewsroomEnv({ ...newsroomProd, INTERNAL_API_TOKEN: 'x'.repeat(32) })).toThrow(/INTERNAL_API_TOKEN/);
    expect(() => loadNewsroomEnv({ ...newsroomProd, AUTH_ENCRYPTION_KEY: 'k' })).toThrow(/AUTH_ENCRYPTION_KEY/);
  });

  it('the API refuses the newsroom\'s session secret', () => {
    expect(() => loadApiEnv({ ...apiProd, SESSION_SECRET: 's'.repeat(32) })).toThrow(/SESSION_SECRET: must not be set in the api service/);
  });

  it('the public site refuses every other service\'s secret', () => {
    expect(() => loadWebEnv({ NODE_ENV: 'production', DATABASE_URL: urls.DATABASE_URL })).toThrow(/DATABASE_URL/);
    expect(() => loadWebEnv({ NODE_ENV: 'production', SESSION_SECRET: 's'.repeat(32) })).toThrow(/SESSION_SECRET/);
  });

  it('names every offending key in one message', () => {
    expect(() => loadWorkerEnv({ ...workerProd, AUTH_SIGNING_KEY: 'k', GEMINI_API_KEY: 'g' })).toThrow(/AUTH_SIGNING_KEY[\s\S]*GEMINI_API_KEY/);
  });

  it('treats a blank foreign value as not set, and allows foreign secrets in development', () => {
    expect(() => loadNewsroomEnv({ ...newsroomProd, DATABASE_URL: '  ' })).not.toThrow();
    expect(() => loadWorkerEnv({ ...workerProd, NODE_ENV: 'development', AUTH_SIGNING_KEY: 'k' })).not.toThrow();
  });
});
