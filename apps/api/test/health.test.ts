import { describe, it, expect, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { pool } from "../src/db.js";

// /health is HTTP-only; /ready requires a reachable database (DATABASE_URL).
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

  it("GET /ready returns 200 when the database is reachable", async () => {
    const res = await app.inject({ method: "GET", url: "/ready" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ready" });
  });

  it("echoes an x-request-id header", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.headers["x-request-id"]).toBeTruthy();
  });
});
