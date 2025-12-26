import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getRedisClient, isRedisConfigured } from './client';

export async function checkRateLimit(
  identifier: string,
  limit: number = 1000
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  if (!isRedisConfigured()) {
    return { allowed: true, remaining: limit, reset: Date.now() + 3600000 };
  }

  const redis = getRedisClient();
  if (!redis) {
    return { allowed: true, remaining: limit, reset: Date.now() + 3600000 };
  }

  const limiter = new Ratelimit({
    redis: redis as Redis,
    limiter: Ratelimit.slidingWindow(limit, '1 h'),
    analytics: true,
  });

  const result = await limiter.limit(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export async function resetRateLimit(identifier: string): Promise<void> {
  if (!isRedisConfigured()) {
    return;
  }

  const redis = getRedisClient();
  if (!redis) return;

  const key = `ratelimit:${identifier}`;
  await redis.del(key);
}

