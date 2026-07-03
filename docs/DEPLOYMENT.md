# Deployment

> Status: draft. This document is incomplete.

The service is a single stateless Node.js process backed by a PostgreSQL
database.

## Building

```bash
docker build -t platform-interview-api .
```

## Running

The container needs `DATABASE_URL` pointing at a reachable PostgreSQL instance
and listens on `PORT` (default 3000).

## Migrations

Database migrations live in `migrations/` and are applied with:

```bash
pnpm db:migrate
```

How and when migrations run relative to a deploy is not currently documented.

## Environments

TODO: describe staging vs. production, how configuration/secrets are supplied,
and what a healthy deploy looks like.
