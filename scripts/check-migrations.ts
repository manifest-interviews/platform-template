// Migration safety check — starting point only.
//
// The intent of this script is to inspect pending migrations and warn about
// risky operations before they reach production. Right now it does almost
// nothing: it lists the migration files and always exits 0. It does not detect
// destructive statements (DROP COLUMN, DROP TABLE, etc.), does not distinguish
// safe additive changes from breaking ones, and is not wired into CI.
//
// This is deliberately left as a stub to build on.

import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "migrations");

function main(): void {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`found ${files.length} migration(s):`);
  for (const file of files) {
    console.log(`  - ${file}`);
  }

  // TODO: parse each migration and flag potentially unsafe operations.
  console.log("no checks implemented yet");
  process.exit(0);
}

main();
