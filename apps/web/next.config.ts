import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@saltmarket/contracts"],
};

export default withSentryConfig(nextConfig, {
  org: "vrsa-solution-6q",
  project: "demo-testing-app",
  // Without a token the build skips the source map upload.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  silent: !process.env.CI,
});
