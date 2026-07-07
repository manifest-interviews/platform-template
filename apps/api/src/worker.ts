// Singleton background worker: booking reminders + payment reconciliation
// against the processor. It MUST run in exactly one place — two instances
// running at once would double-charge / double-notify. Same container image as
// the API, started with a different command (see docker-compose.yml).
import { query, closePool } from "./db.js";
import { logger } from "./logger.js";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);
let running = true;
let timer: NodeJS.Timeout | undefined;

async function tick(): Promise<void> {
  const pending = await query<{ id: number; external_id: string | null }>(
    "SELECT id, external_id FROM payments WHERE status = 'pending'",
  );
  logger.info({ pending: pending.length }, "worker: reconciliation pass");
  // Stubbed: a real pass would re-query the processor for each pending payment
  // (the processor is the source of truth for money) and send due reminders.
}

async function loop(): Promise<void> {
  while (running) {
    try {
      await tick();
    } catch (err) {
      logger.error({ err }, "worker tick failed");
    }
    await new Promise<void>((resolve) => {
      timer = setTimeout(resolve, INTERVAL_MS);
    });
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "worker shutting down");
  running = false;
  if (timer) clearTimeout(timer);
  await closePool();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

logger.info({ intervalMs: INTERVAL_MS }, "worker started");
// Start the loop directly — each tick handles its own DB errors and reschedules,
// so a database blip at boot is retried in-process rather than crashing.
void loop();
