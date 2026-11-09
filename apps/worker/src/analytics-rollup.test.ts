import { describe, expect, it } from 'vitest';
import { jobPayloadSchemas, jobQueue } from '@fact-lens/contracts';
import { handlers } from './processors';

describe('the analytics.rollup job', () => {
  it('is a maintenance job with an empty payload, and calls the API, which keeps each hour from being added twice', async () => {
    expect(jobQueue['analytics.rollup']).toBe('maintenance');
    expect(jobPayloadSchemas['analytics.rollup'].parse({})).toEqual({});
    const logged: unknown[] = [];
    let calls = 0;
    const services = {
      api: { rollupViews: async () => { calls += 1; return { buckets: 2, skipped: 0, rows: 7 }; } },
      log: { info: (...args: unknown[]) => logged.push(args), debug() {}, warn() {}, error() {} },
    } as never;
    expect(handlers['analytics.rollup'].receipt).toBe(false);
    await handlers['analytics.rollup'].run({}, services);
    expect(calls).toBe(1);
    expect(logged).toHaveLength(1);
  });

  it('does not log a quiet round', async () => {
    const logged: unknown[] = [];
    const services = { api: { rollupViews: async () => ({ buckets: 0, skipped: 3, rows: 0 }) }, log: { info: (...a: unknown[]) => logged.push(a) } } as never;
    await handlers['analytics.rollup'].run({}, services);
    expect(logged).toEqual([]);
  });
});
