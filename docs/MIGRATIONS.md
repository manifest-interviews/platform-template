# Migrations

Database schema changes are plain SQL files in `migrations/`, applied in
filename order by `scripts/migrate.ts`.

## Adding a migration

1. Create a new file `NNN_short_description.sql` with the next number.
2. Write forward-only SQL.
3. Run `pnpm db:migrate` locally against a database.

Applied migrations are recorded in the `schema_migrations` table and are not
re-run.

## Things to be aware of

- The runner applies **every** `.sql` file in the directory in order. There is
  no review or safety gate — including for destructive statements.
- There is no `down`/rollback mechanism. Reversing a change means writing a new
  forward migration (and some changes, like a dropped column, cannot recover
  lost data).

## Not yet covered

TODO: expand/contract patterns, behaviour during rolling deploys when multiple
app versions are live, locking and large-table considerations, and what belongs
in automation vs. human review.
