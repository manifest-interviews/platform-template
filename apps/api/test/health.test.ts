import { describe, it, expect, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { pool } from "../src/db.js";

// These tests exercise the HTTP layer only and do not touch the database.
describe("health endpoints", () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it("GET /health returns ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("GET /ready returns ok", async () => {
    const res = await app.inject({ method: "GET", url: "/ready" });
    expect(res.statusCode).toBe(200);
  });

  it("echoes an x-request-id header", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.headers["x-request-id"]).toBeTruthy();
  });
});
