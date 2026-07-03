import { buildApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

async function main(): Promise<void> {
  const app = buildApp();

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    logger.info(`api listening on port ${config.port}`);
  } catch (err) {
    logger.error("failed to start server", err);
    process.exit(1);
  }
}

main();
