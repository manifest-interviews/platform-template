import type { FastifyInstance } from "fastify";

// Health and readiness endpoints.
//
// GET /health is a shallow liveness check — it returns 200 as long as the
// process is up and able to serve HTTP.
//
// GET /ready is intended to signal that the service is ready to receive
// traffic, but the current implementation does not actually verify any of its
// dependencies (for example, it does not check that the database is reachable).
// It returns the same static response as /health.
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.get("/ready", async () => {
    return { status: "ok" };
  });
}
