import { getRedisClient, isRedisConfigured } from "./client";

export async function getCache<T>(key: string): Promise<T | null> {
  if (!isRedisConfigured()) {
    return null;
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  try {
    const value = await redis.get<string>(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
  if (!isRedisConfigured()) {
    return;
  }

  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Silently fail - cache is optional
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!isRedisConfigured()) {
    return;
  }

  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    await redis.del(key);
  } catch {
    // Silently fail
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!isRedisConfigured()) {
    return;
  }

  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silently fail
  }
}
