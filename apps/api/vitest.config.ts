import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The tests hit a real Postgres/Redis and read connection details from the
// environment, like the app does. Load the repo-root .env (if present) so
// `pnpm test` works after `cp .env.example .env`; already-set variables are
// never overridden, and when there is no .env (e.g. CI, which passes env
// directly) this is a no-op.
const envFile = fileURLToPath(new URL("../../.env", import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export default defineConfig({});
