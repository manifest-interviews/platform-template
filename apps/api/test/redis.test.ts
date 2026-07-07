import { describe, it, expect, afterAll } from "vitest";
import { cacheAside, invalidate, closeRedis } from "../src/redis.js";

// Requires a reachable Redis via REDIS_URL.
describe("cache-aside", () => {
  afterAll(async () => {
    await closeRedis();
  });

  it("loads once, then serves from cache until invalidated", async () => {
    const key = `test:${Date.now()}`;
    let calls = 0;
    const load = async () => {
      calls++;
      return { n: 42 };
    };

    expect(await cacheAside(key, 30, load)).toEqual({ n: 42 });
    expect(await cacheAside(key, 30, load)).toEqual({ n: 42 });
    expect(calls).toBe(1); // second call was a cache hit

    await invalidate(key);
    await cacheAside(key, 30, load);
    expect(calls).toBe(2);
  });
});
