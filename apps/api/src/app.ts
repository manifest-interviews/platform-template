import Fastify, { type FastifyInstance } from "fastify";
import { registerRequestId } from "./middleware/request-id.js";
import { healthRoutes } from "./routes/health.js";
import { customerRoutes } from "./routes/customers.js";
import { bookingRoutes } from "./routes/bookings.js";
import { logger } from "./logger.js";

// Builds the Fastify application. Kept separate from index.ts so tests can
// create an instance without binding to a port.
export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  registerRequestId(app);

  app.setErrorHandler((error, _request, reply) => {
    logger.error("request failed", error);
    reply.status(500).send({ error: "internal server error" });
  });

  app.register(healthRoutes);
  app.register(customerRoutes);
  app.register(bookingRoutes);

  return app;
}
