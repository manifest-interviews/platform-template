# Operations

Basic operational notes for running the Booking API.

## Endpoints

- `GET /health` — liveness. Returns 200 whenever the process is up.
- `GET /ready` — intended as a readiness signal. See the note in the code: it
  does not currently verify downstream dependencies.

## Logs

The app logs plain text lines to stdout/stderr via `console`. Logs are not
structured and do not include a request/correlation ID, so tracing a single
request across log lines is not currently possible.

## Configuration

Configuration is read from environment variables (see `.env.example`). There is
no validation at startup.

## Metrics / alerting

None yet. There are no metrics exported and no alerts defined.
