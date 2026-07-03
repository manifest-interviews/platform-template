// Application configuration.
//
// Values are read directly from process.env. There is no startup validation:
// if a required variable is missing or malformed, the app will fail later at
// the point of use (e.g. when it first tries to open a database connection)
// rather than failing fast with a clear message.

export interface Config {
  port: number;
  databaseUrl: string;
  nodeEnv: string;
}

export const config: Config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL as string,
  nodeEnv: process.env.NODE_ENV ?? "development",
};
