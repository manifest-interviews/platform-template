// Minimal SQL migration runner.
//
// Behaviour:
//   - ensures a `schema_migrations` table exists
//   - reads every *.sql file in ./migrations, sorted by filename
//   - applies any that have not been recorded yet, in order
//   - records each applied migration by filename
//   - exits non-zero on the first error
//
// This is intentionally simple. It does not verify checksums of previously
// applied files, has no notion of "down"/rollback, does not take an advisory
// lock to guard against concurrent runners, and does no validation of the SQL
// it is about to execute.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "migrations");

async function main(): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await pool.query<{ filename: string }>("SELECT filename FROM schema_migrations")).rows.map(
      (r) => r.filename,
    ),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip   ${file} (already applied)`);
      continue;
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`apply  ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`failed ${file}`);
      console.error(err);
      client.release();
      await pool.end();
      process.exit(1);
    }
    client.release();
  }

  await pool.end();
  console.log("migrations complete");
}

main();
