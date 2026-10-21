import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ReadinessResponse } from '@fact-lens/contracts';
import { Redis } from 'ioredis';
import type { Pool } from 'pg';

export const HEALTH_PROBES = Symbol('HEALTH_PROBES');
export type Probe = () => Promise<void>;
export type HealthProbes = Record<string, Probe>;

export function createProbes(pool: Pool, redisUrl: string): { probes: HealthProbes; close: () => Promise<void> } {
  const redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 2000 });
  // Without a listener an 'error' event is unhandled and can crash the process.
  // Probe failures are reported through /health/ready, so this only swallows the event.
  redis.on('error', () => {});
  return {
    probes: {
      database: async () => void (await pool.query('select 1')),
      redis: async () => {
        if (redis.status === 'wait') await redis.connect();
        await redis.ping();
      },
    },
    close: async () => {
      redis.disconnect();
    },
  };
}

const PROBE_TIMEOUT_MS = 3000;

function withTimeout(work: Promise<void>, ms: number): Promise<void> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('probe timed out')), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

@Injectable()
export class HealthService implements OnModuleDestroy {
  constructor(
    private readonly probes: HealthProbes,
    private readonly closeProbes: () => Promise<void> = async () => {},
  ) {}

  async readiness(): Promise<ReadinessResponse> {
    const entries = await Promise.all(
      Object.entries(this.probes).map(async ([name, probe]) => {
        try {
          await withTimeout(probe(), PROBE_TIMEOUT_MS);
          return [name, 'up'] as const;
        } catch {
          return [name, 'down'] as const;
        }
      }),
    );
    const checks = Object.fromEntries(entries);
    const ok = entries.every(([, s]) => s === 'up');
    return { status: ok ? 'ok' : 'degraded', checks };
  }

  onModuleDestroy() {
    return this.closeProbes();
  }
}
