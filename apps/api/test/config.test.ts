import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";

// Hermetic: pass a complete env and omit exactly one key, so the test does not
// depend on what happens to be set in the ambient environment.
const base = {
  DATABASE_URL: "postgres://x",
  REDIS_URL: "redis://x",
  PAYMENT_PROCESSOR_URL: "http://x",
  PAYMENT_WEBHOOK_SECRET: "shh",
  PORT: "3000",
};

describe("config validation", () => {
  it("throws a clear error naming a missing required var", () => {
    expect(() => loadConfig({ ...base, REDIS_URL: "" })).toThrow(/REDIS_URL/);
  });

  it("builds config when all required vars are present", () => {
    const cfg = loadConfig(base);
    expect(cfg.port).toBe(3000);
    expect(cfg.databaseUrl).toBe("postgres://x");
    expect(cfg.workerIntervalMs).toBe(60_000); // default when unset
  });

  it("rejects a malformed WORKER_INTERVAL_MS", () => {
    expect(() => loadConfig({ ...base, WORKER_INTERVAL_MS: "soon" })).toThrow(
      /WORKER_INTERVAL_MS/,
    );
  });
});
