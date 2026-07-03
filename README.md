# Platform Interview Template — Booking API

This is a small Booking API used for **Staff DevOps / Platform Engineer**
interviews. The app is intentionally small, but it includes enough operational
surface area to discuss CI/CD, containers, database migrations, configuration,
observability, and production readiness.

The domain is deliberately simple: **customers**, **bookings**, and
**payments**.

## What to do before the interview

Pre-work should be light — please do not spend more than **30–60 minutes**.

1. Fork the repo.
2. Get the service running locally (see below).
3. Run the tests.
4. Skim the code and the docs in `docs/`.
5. Make **one small improvement** that helps move the service toward production
   readiness.
6. Be prepared to explain what other risks or gaps you noticed.

## What to expect in the interview

During the interview we will work together on an ambiguous production-readiness
problem. You may use an AI coding agent of your choice. We are not looking for a
perfect finished solution — we are interested in how you clarify requirements,
identify production risks, use tooling, make tradeoffs, and communicate your
reasoning.

## Local setup

Requirements: Node 22+, pnpm, and Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev        # API on http://localhost:3000
pnpm test
```

You can also run the whole thing in containers:

```bash
docker compose up --build
```

## API

```text
GET  /health              # liveness
GET  /ready               # readiness
GET  /customers
POST /customers           # { "name", "email" }
GET  /bookings
POST /bookings            # { "customer_id", "booking_date", "notes?" }
GET  /bookings/:id
POST /bookings/:id/cancel
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Run the API in watch mode |
| `pnpm build` | Compile the API to `dist/` |
| `pnpm typecheck` | Type-check the API |
| `pnpm test` | Run the test suite (needs a migrated database) |
| `pnpm db:migrate` | Apply SQL migrations from `migrations/` |
| `pnpm db:seed` | Insert sample data |
| `pnpm smoke:test` | Hit a running instance and check a couple of endpoints |
| `pnpm migration:check` | Migration safety check (currently a stub) |

## Repository layout

```text
apps/api/        Fastify + TypeScript API
migrations/      Plain SQL migrations
scripts/         migrate / seed / smoke-test / check-migrations
docs/            Operational documentation
infra/pulumi/    Simplified Pulumi stack — review artifact only, not deployed
.github/         CI workflow
```

## Notes

- Configuration is read from environment variables (`.env.example`).
- `infra/pulumi/` is a **review artifact only** — do not deploy it.
- This service is a work in progress moving from prototype toward production.
