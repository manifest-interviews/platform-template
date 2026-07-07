import type { FastifyInstance } from "fastify";

// Fastify assigns request.id via genReqId (from x-request-id or generated).
// Echo it back so callers can correlate. Application/request logs already
// include reqId via the Fastify logger.
export function registerRequestId(app: FastifyInstance): void {
  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });
}
