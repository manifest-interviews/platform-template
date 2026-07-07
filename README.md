# Platform Interview Template — Booking API

This is a small Booking API used for **Staff DevOps / Platform Engineer**
interviews. The app is intentionally small, but it includes enough operational
surface area to discuss CI/CD, containers, database migrations, configuration,
caching, and production hosting.

The domain is deliberately simple: **customers**, **bookings**, and
**payments** (charged through an external payment processor).

## What to do before the interview

Pre-work should be light — please do not spend more than **30–60 minutes**.

1. Fork the repo.
2. Get the service running locally (see below).
3. Run the tests.
4. Skim the code and the docs in `docs/`.
5. Be prepared to discuss how the system fits together and what it depends on.

## What to expect in the interview

During the interview we will work together on an ambiguous design problem. You
may use an AI coding agent of your choice. We are not looking for a perfect
finished solution — we are interested in how you clarify requirements, identify
risks, use tooling, make tradeoffs, and communicate your reasoning.

## The system

- **API** — Fastify + TypeScript, stateless. Reads go through a Redis
  cache-aside; writes go to PostgreSQL and invalidate the cache.
- **Worker** — a background process (same container image, different command)
  that sends booking reminders and reconciles payments against the processor.
  It must run as a **single instance**.
- **PostgreSQL** — the system of record.
- **Redis** — cache for read-heavy endpoints. A cache outage degrades latency
  but does not break requests (fail-open).
- **Payment processor** — an external third-party service. Charges go out via
  `PAYMENT_PROCESSOR_URL`; status updates come back on a webhook
  (`POST /webhooks/payments`, authenticated with a shared `PAYMENT_WEBHOOK_SECRET`).
  Payment creation is idempotent via an `idempotency_key`.

## Local setup

Requirements: Node 22+, pnpm, and Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
pnpm dev        # API on http://localhost:3000
pnpm test
```

Or run the whole stack in containers (postgres, redis, one-shot migrations,
API, worker):

```bash
docker compose up --build
```

## API

```text
GET  /health                    # liveness
GET  /ready                     # readiness (verifies the database is reachable)
GET  /customers
POST /customers                 # { "name", "email" }
GET  /bookings
POST /bookings                  # { "customer_id", "booking_date", "notes?" }
GET  /bookings/:id
POST /bookings/:id/cancel
POST /bookings/:id/payments     # { "amount_cents", "currency?", "idempotency_key" }
POST /webhooks/payments         # processor callback (auth: x-webhook-secret): { "external_id", "status" }
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Run the API in watch mode |
| `pnpm build` | Compile the API to `dist/` |
| `pnpm start` | Run the compiled API |
| `pnpm typecheck` | Type-check the API |
| `pnpm test` | Run the test suite (needs a migrated database and Redis) |
| `pnpm db:migrate` | Apply SQL migrations from `migrations/` |
| `pnpm db:seed` | Insert sample data |
| `pnpm smoke:test` | Hit a running instance and check a couple of endpoints |
| `pnpm migration:check` | Migration safety check (currently a stub) |
| `pnpm --filter @platform-interview/api worker` | Run the compiled worker |
| `pnpm --filter @platform-interview/api worker:dev` | Run the worker in watch mode |

## Repository layout

```text
apps/api/        Fastify + TypeScript API (+ worker entrypoint)
migrations/      Plain SQL migrations
scripts/         migrate / seed / smoke-test / check-migrations
docs/            Operational documentation
infra/pulumi/    Simplified Pulumi stack — review artifact only, not deployed
.github/         CI workflow (test -> build -> deploy to GHCR)
```

## Notes

- Configuration is read from environment variables (`.env.example`) and
  validated at startup.
- Logs are structured JSON with a request id (`x-request-id` is honoured and
  echoed).
- The container image is multi-stage, runs compiled JS as a non-root user, and
  declares a `HEALTHCHECK`.
- CI runs test → build → deploy; deploy publishes the image to GitHub Container
  Registry.
- `infra/pulumi/` is a **review artifact only** — do not deploy it.
