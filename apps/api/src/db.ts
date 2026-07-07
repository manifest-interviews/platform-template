import pg from "pg";
import { config } from "./config.js";

// A single shared connection pool for the process.
//
// The pool is created from DATABASE_URL. There is no explicit connectivity
// check here at startup — the first query decides whether the database is
// actually reachable.
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
});

export type Row = Record<string, unknown>;

export async function query<T extends Row = Row>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function closePool(): Promise<void> {
  await pool.end();
}
