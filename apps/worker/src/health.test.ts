import type { Pool } from 'pg';
import { describe, expect, it } from 'vitest';
import { DISPATCHER_STALE_MS, isDispatcherStale, snapshot } from './health';
import type { QueueRegistry } from './queues';

const pool = { query: async () => ({ rows: [{ pending: 0, parked: 0, oldest: null }] }) } as unknown as Pool;
const queues = { all: () => [] } as unknown as QueueRegistry;

describe('worker health', () => {
  it('is stale only after the dispatcher has been silent for the whole window', () => {
    const now = 1_000_000;
    expect(isDispatcherStale(now - DISPATCHER_STALE_MS, now)).toBe(false);
    expect(isDispatcherStale(now - DISPATCHER_STALE_MS - 1, now)).toBe(true);
  });

  it('reports degraded when the dispatcher has stopped passing, and ok while it runs', async () => {
    const now = Date.now();
    expect((await snapshot(pool, queues, () => now - 1_000, now)).status).toBe('ok');
    const stuck = await snapshot(pool, queues, () => now - 5 * DISPATCHER_STALE_MS, now);
    expect(stuck).toMatchObject({ status: 'degraded', dispatcher: { secondsSincePass: 300 } });
  });
});
