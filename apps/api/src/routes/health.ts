import type { FastifyInstance } from "fastify";
import { query } from "../db.js";

// GET /health — shallow liveness (process is up).
// GET /ready  — readiness: verifies the database is reachable.
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/ready", async (_request, reply) => {
    try {
      await query("SELECT 1");
      return { status: "ready" };
    } catch (err) {
      reply.log.error({ err }, "readiness check failed");
      return reply.status(503).send({ status: "unready" });
    }
  });
}
