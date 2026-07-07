import { buildApp } from "./app.js";
import { config } from "./config.js";
import { closePool } from "./db.js";
import { closeRedis } from "./redis.js";
import { logger } from "./logger.js";

async function main(): Promise<void> {
  const app = buildApp();

  // Graceful shutdown: stop accepting new connections, let in-flight requests
  // finish, then release the database pool. Table stakes for rolling deploys.
  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, "shutting down");
    try {
      await app.close();
      await closeRedis();
      await closePool();
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "error during shutdown");
      process.exit(1);
    }
  }
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    logger.info({ port: config.port }, "api listening");
  } catch (err) {
    logger.error({ err }, "failed to start server");
    process.exit(1);
  }
}

main();
