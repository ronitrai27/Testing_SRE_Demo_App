import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value ? value : undefined));

const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(0).max(65535).default(4100),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_PATH: z.string().default("data/shop.db"),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(24),
  // Off by default because the demo is served over plain http on localhost.
  COOKIE_SECURE: z.stringbool().default(false),
  PAYMENT_GATEWAY_URL: z.url().default("http://127.0.0.1:4200"),
  PAYMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
  SENTRY_DSN: optionalString,
  SENTRY_ENVIRONMENT: optionalString,
  SENTRY_RELEASE: optionalString,
});

export type Env = Readonly<z.infer<typeof Env>>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = Env.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid configuration\n${z.prettifyError(result.error)}`);
  }
  return Object.freeze(result.data);
}
