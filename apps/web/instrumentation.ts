import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const isConfigured = Boolean(token && host);

if (!isConfigured && process.env.NODE_ENV !== "production") {
  const missingVariable = token
    ? "NEXT_PUBLIC_POSTHOG_HOST"
    : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";

  console.warn(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ "service.name": "saltmarket-web" }),
  processors: isConfigured
    ? [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${host!.replace(/\/$/, "")}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        }),
      ]
    : [],
});

// Use this logger only for log records intentionally exported to PostHog.
export const posthogLogger = loggerProvider.getLogger("saltmarket-posthog-exporter");

export function register() {
  // This provider is intentionally used directly rather than replacing global loggers.
}
