import Redis from "ioredis";
import { config } from "./config.js";
import { logger } from "./logger.js";

// Single shared Redis client for the process, created from REDIS_URL.
export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});
redis.on("error", (err) => logger.warn({ err }, "redis error (cache degraded)"));
void redis.connect().catch(() => {
  /* fail open; handled per-operation below */
});

// Cache-aside. On any Redis failure, log and fall through to the loader so a
// cache outage degrades latency but never breaks the request.
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch (err) {
    logger.warn({ err, key }, "cache read failed; falling through");
  }
  const value = await loader();
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, "cache write failed");
  }
  return value;
}

export async function invalidate(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err, key }, "cache invalidate failed");
  }
}

export async function closeRedis(): Promise<void> {
  try {
    await redis.quit();
  } catch {
    redis.disconnect();
  }
}
