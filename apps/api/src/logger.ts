// Minimal logging helper.
//
// This wraps console.* and prints plain, human-readable lines. Logs are not
// structured (no JSON), carry no request/correlation IDs, and have no log
// levels beyond the method name. This is fine for local development but makes
// production debugging and log aggregation harder.

export const logger = {
  info(message: string): void {
    console.log(message);
  },
  warn(message: string): void {
    console.warn(message);
  },
  error(message: string, err?: unknown): void {
    if (err) {
      console.error(message, err);
    } else {
      console.error(message);
    }
  },
};
