// Loaded with --import so Sentry can patch http and express before anything else imports them.
import * as Sentry from "@sentry/node";
import { loadEnv } from "./config/env.ts";

const env = loadEnv();

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: env.SENTRY_RELEASE,
    sendDefaultPii: false,
    tracesSampleRate: 1,
  });
}
