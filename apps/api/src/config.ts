// Application configuration. loadConfig is a pure function of the environment so
// it fails fast with a clear message and is unit-testable without module-cache
// gymnastics. The module-level `config` validates at import, so the app crashes
// on boot (not at first use) if anything required is missing.

export interface Config {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  paymentProcessorUrl: string;
  paymentWebhookSecret: string;
  nodeEnv: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const required = (name: string): string => {
    const value = env[name];
    if (!value || value.trim() === "") {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  };

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${env.PORT}`);
  }

  return {
    port,
    databaseUrl: required("DATABASE_URL"),
    redisUrl: required("REDIS_URL"),
    paymentProcessorUrl: required("PAYMENT_PROCESSOR_URL"),
    paymentWebhookSecret: required("PAYMENT_WEBHOOK_SECRET"),
    nodeEnv: env.NODE_ENV ?? "development",
  };
}

export const config: Config = loadConfig();
