import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ReadinessResponse } from '@fact-lens/contracts';
import { Redis } from 'ioredis';
import { Pool } from 'pg';

export const HEALTH_PROBES = Symbol('HEALTH_PROBES');
export type Probe = () => Promise<void>;
export type HealthProbes = Record<string, Probe>;

export function createProbes(databaseUrl: string, redisUrl: string): { probes: HealthProbes; close: () => Promise<void> } {
  const pool = new Pool({ connectionString: databaseUrl, max: 2, connectionTimeoutMillis: 2000 });
  const redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 2000 });
  return {
    probes: {
      database: async () => void (await pool.query('select 1')),
      redis: async () => {
        if (redis.status === 'wait') await redis.connect();
        await redis.ping();
      },
    },
    close: async () => {
      await pool.end();
      redis.disconnect();
    },
  };
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
          await probe();
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
