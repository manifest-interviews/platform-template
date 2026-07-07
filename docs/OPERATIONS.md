# Operations

Basic operational notes for running the Booking API.

## Processes

- **API** — stateless HTTP server. Safe to run multiple replicas.
- **Worker** — background reminders + payment reconciliation. Must run as a
  **single instance**: two workers running at once would double-send reminders
  and double-process reconciliation.

## Endpoints

- `GET /health` — liveness. Returns 200 whenever the process is up.
- `GET /ready` — readiness. Verifies the database is reachable; returns 503
  when it is not.

## Logs

Structured JSON to stdout/stderr (pino). Every request log line carries a
`reqId`; the API honours an incoming `x-request-id` header and echoes it on the
response, so a request can be traced across services and log lines.

## Configuration

Configuration is read from environment variables (see `.env.example`) and
validated at startup — the process exits with a clear error naming the missing
variable rather than failing later at first use.

## Caching

Read-heavy endpoints use a Redis cache-aside with a short TTL. Redis being
unavailable degrades latency but does not fail requests (fail-open); writes
invalidate the affected keys.

## Graceful shutdown

On SIGTERM/SIGINT the API stops accepting connections, drains in-flight
requests, then closes Redis and the database pool. The worker finishes its
current pass and exits.

## Metrics / alerting

None yet. There are no metrics exported and no alerts defined.
