/** Shared by the browser, server and edge SDKs. Without a DSN, Sentry stays off. */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1 : 0.1,
  initialScope: { tags: { service: "web" } },
  // The SDK collects all of these unless told otherwise.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpBodies: [],
    stackFrameVariables: false,
  },
};
