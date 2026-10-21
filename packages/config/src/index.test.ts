import { describe, expect, it } from 'vitest';
import { loadApiEnv, loadDatabaseEnv, loadNewsroomEnv, loadWorkerEnv } from './index';

const base = { DATABASE_URL: 'postgres://u:p@localhost:5432/db', REDIS_URL: 'redis://localhost:6379' };

describe('loadApiEnv', () => {
  it('applies defaults', () => {
    const env = loadApiEnv(base);
    expect(env.API_PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
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

  it('requires OIDC settings in production only', () => {
    expect(() => loadApiEnv({ ...base, NODE_ENV: 'production' })).toThrow(/OIDC_ISSUER/);
    const ok = loadApiEnv({ ...base, NODE_ENV: 'production', OIDC_ISSUER: 'https://idp.example.com', OIDC_AUDIENCE: 'fact-lens-api', INTERNAL_API_TOKEN: 'x'.repeat(32) });
    expect(ok.OIDC_REQUIRE_MFA).toBe(true);
    expect(loadApiEnv({ ...base, OIDC_REQUIRE_MFA: 'false' }).OIDC_REQUIRE_MFA).toBe(false);
  });

  it('loads worker config and rejects a short internal token', () => {
    const worker = { ...base, API_BASE_URL: 'http://api.internal:4000', INTERNAL_API_TOKEN: 'y'.repeat(32) };
    expect(loadWorkerEnv(worker)).toMatchObject({ OUTBOX_POLL_MS: 1000, JOB_CONCURRENCY: 5 });
    expect(() => loadWorkerEnv({ ...worker, INTERNAL_API_TOKEN: 'short' })).toThrow(/INTERNAL_API_TOKEN/);
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
});
