# Integrations

What this app is connected to, and how each connection works.

| Connection            | Status                                               |
| --------------------- | ---------------------------------------------------- |
| Web → API             | Working                                              |
| Sentry (web and API)  | Working, not yet set up for a deployed environment   |
| PostHog (web)         | Browser events live; wizard setup not cleaned up yet |
| API → payment gateway | Not connected                                        |

## Web → API

- The home page asks the API for `GET /v1/products` on the server and checks the reply against `@saltmarket/contracts`.
- API address: `API_URL`, default `http://127.0.0.1:4100`.
- Ports: web 3100, API 4100, payment gateway 4200.
- Code: `apps/web/src/lib/api.ts`.

## Sentry

- Project: `demo-testing-app` in organisation `vrsa-solution-6q` (EU region).
- The web app and the API share one project. Filter by the tag `service:web` or `service:api`.
- No DSN means Sentry stays off.

|                | Web                                                       | API                                                    |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| SDK            | `@sentry/nextjs`                                          | `@sentry/node`                                         |
| DSN variable   | `NEXT_PUBLIC_SENTRY_DSN` in `apps/web/.env.local`         | `SENTRY_DSN` in `apps/api/.env`                        |
| Started from   | `src/instrumentation.ts`, `src/instrumentation-client.ts` | `src/instrument.ts`, loaded with `--import`            |
| Errors         | Browser, server, React error pages                        | Unexpected failures only; 4xx answers are not reported |
| Traces         | 100% in development, 10% otherwise                        | 100%, or 10% when `NODE_ENV=production`                |
| Logs           | Not sent                                                  | `warn` and above, from pino                            |
| Session replay | 10% of sessions, 100% of sessions with an error           | –                                                      |

- One trace covers a page load and the API request behind it.
- Not collected: user info, cookies, request bodies, local variables, database values. Replay masks text and blocks media.
- Shared web options: `apps/web/src/lib/sentry-options.ts`.
- Build config: `apps/web/next.config.ts`. Source maps upload only when `SENTRY_AUTH_TOKEN` is set at build time.

## PostHog

- Project: 763999 (US region). Settings: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` in `apps/web/.env.local`.
- Browser: page views, clicks and errors, started in `apps/web/instrumentation-client.ts`.
- Custom event: `shop_error_retry_clicked`, from the error page.
- Server: product list logs, through OpenTelemetry in `apps/web/instrumentation.ts`. Arrival not checked.
- Shared with Sentry: `src/instrumentation-client.ts` imports PostHog's file, and PostHog's `instrumentation.ts` re-exports Sentry's `register` and `onRequestError`. `next dev` loads the root server file; production builds load the one in `src/`.

## Payment gateway

- A fake card processor in `apps/payment-gateway`. `tok_declined` is refused; every other token is accepted.
- The API has its settings (`PAYMENT_GATEWAY_URL`, `PAYMENT_TIMEOUT_MS`) but no code calls it yet.
