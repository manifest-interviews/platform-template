import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { registerRequestId } from "./middleware/request-id.js";
import { healthRoutes } from "./routes/health.js";
import { customerRoutes } from "./routes/customers.js";
import { bookingRoutes } from "./routes/bookings.js";
import { paymentRoutes } from "./routes/payments.js";

// Builds the Fastify application. Kept separate from index.ts so tests can
// create an instance without binding to a port.
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? "info" },
    // Request id comes from the caller's x-request-id when present so a request
    // can be traced across services; otherwise we generate one.
    genReqId: (req) => {
      const incoming = req.headers["x-request-id"];
      return typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();
    },
  });

  registerRequestId(app);

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "request failed");
    reply.status(500).send({ error: "internal server error" });
  });

  app.register(healthRoutes);
  app.register(customerRoutes);
  app.register(bookingRoutes);
  app.register(paymentRoutes);

  return app;
}
