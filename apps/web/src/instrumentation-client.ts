// Next.js loads only one of these files, so this one brings in PostHog's.
import "../instrumentation-client";
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./lib/sentry-options";

Sentry.init({
  ...sentryOptions,
  // Replay masks all text and blocks all media by default.
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
