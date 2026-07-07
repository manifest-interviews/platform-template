// Structured JSON logging. One line per event, machine-parseable for log
// aggregation. Used for startup and by the worker; Fastify has its own request
// logger configured in app.ts.
import pino from "pino";

export const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
