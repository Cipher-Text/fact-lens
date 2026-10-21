import { describe, expect, it } from 'vitest';
import { loadApiEnv, loadDatabaseEnv } from './index';

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
    const ok = loadApiEnv({ ...base, NODE_ENV: 'production', OIDC_ISSUER: 'https://idp.example.com', OIDC_AUDIENCE: 'fact-lens-api' });
    expect(ok.OIDC_REQUIRE_MFA).toBe(true);
    expect(loadApiEnv({ ...base, OIDC_REQUIRE_MFA: 'false' }).OIDC_REQUIRE_MFA).toBe(false);
  });
});
