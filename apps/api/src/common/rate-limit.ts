import type { Redis } from 'ioredis';

/**
 * Redis could not answer, so the count is unknown. Each caller decides whether the request goes through or is refused
 * (ADR-058): readers go through, sign-in and uploads are refused.
 */
export class RateLimitUnavailableError extends Error {
  constructor(cause: unknown) {
    super(`rate limit unavailable: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'RateLimitUnavailableError';
  }
}

/**
 * Counts one event for `key` in a fixed window and returns the count, this event included. The key expires once the
 * window has passed. Throws RateLimitUnavailableError when Redis cannot answer.
 */
export async function countInWindow(redis: Redis, key: string, windowSeconds: number): Promise<number> {
  let answers: Array<[Error | null, unknown]> | null;
  try {
    answers = await redis.multi().incr(key).expire(key, windowSeconds + 1).exec();
  } catch (err) {
    throw new RateLimitUnavailableError(err);
  }
  return Number(answers?.[0]?.[1] ?? 0);
}
