# Deployment

> Status: draft. This document is incomplete.

The service is a stateless Node.js API backed by PostgreSQL and Redis, plus a
single-instance background worker built from the same container image (run with
`node apps/api/dist/worker.js`).

## Building

```bash
docker build -t platform-interview-api .
```

## Running

The container needs `DATABASE_URL` (PostgreSQL), `REDIS_URL` (Redis),
`PAYMENT_PROCESSOR_URL` (external payment processor), and
`PAYMENT_WEBHOOK_SECRET` (shared secret authenticating processor webhooks); it
listens on `PORT` (default 3000). All are validated at startup.

## Migrations

Database migrations live in `migrations/` and are applied with:

```bash
pnpm db:migrate
```

How and when migrations run relative to a deploy is not currently documented.

## Environments

TODO: describe staging vs. production, how configuration/secrets are supplied,
and what a healthy deploy looks like.
