import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

// Attaches a request ID to every request and echoes it back on the response.
//
// The ID is available as request.requestId, but note that it is NOT currently
// threaded into the logger, so application log lines cannot be correlated to a
// specific request.
export function registerRequestId(app: FastifyInstance): void {
  app.decorateRequest("requestId", "");

  app.addHook("onRequest", async (request, reply) => {
    const incoming = request.headers["x-request-id"];
    const requestId =
      typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();
    request.requestId = requestId;
    reply.header("x-request-id", requestId);
  });
}

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
  }
}
