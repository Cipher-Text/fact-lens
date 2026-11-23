import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import { describe, expect, it } from 'vitest';
import { countInWindow, RateLimitUnavailableError } from './rate-limit';

const redisUrl = process.env.TEST_REDIS_URL;

describe('countInWindow', () => {
  it('reports Redis as unavailable when it cannot answer, rather than guessing a count', async () => {
    const down = new Redis('redis://127.0.0.1:1', { enableOfflineQueue: false, maxRetriesPerRequest: 0, lazyConnect: true });
    try {
      await expect(countInWindow(down, 'k', 60)).rejects.toBeInstanceOf(RateLimitUnavailableError);
    } finally {
      down.disconnect();
    }
  });

  it.skipIf(!redisUrl)('counts the events in a window and gives the key a time to live', async () => {
    const redis = new Redis(redisUrl!);
    const key = `rl-test:${randomUUID()}`;
    try {
      expect(await countInWindow(redis, key, 60)).toBe(1);
      expect(await countInWindow(redis, key, 60)).toBe(2);
      expect(await redis.ttl(key)).toBeGreaterThan(0);
    } finally {
      await redis.del(key);
      redis.disconnect();
    }
  });
});
