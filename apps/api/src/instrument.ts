// Loaded with --import so Sentry can patch http and express before anything else imports them.
import * as Sentry from "@sentry/node";
import { loadEnv } from "./config/env.ts";
import { isReportable } from "./platform/http/error-handler.ts";

const env = loadEnv();

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: env.SENTRY_RELEASE,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1,
    initialScope: { tags: { service: "api" } },
    integrations: [
      Sentry.expressIntegration({ shouldHandleError: isReportable }),
      Sentry.pinoIntegration({ log: { levels: ["warn", "error", "fatal"] } }),
    ],
    // Request details in our log lines include the caller's IP address.
    beforeSendLog(log) {
      const { req: _req, res: _res, ...attributes } = log.attributes ?? {};
      return { ...log, attributes };
    },
    // The SDK collects all of these unless told otherwise.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpBodies: [],
      databaseQueryData: false,
      stackFrameVariables: false,
    },
  });
}
