import { describe, expect, it } from 'vitest';
import { loadApiEnv } from './index';

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
});
