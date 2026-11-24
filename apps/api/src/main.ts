import { createServer } from "node:http";
import * as Sentry from "@sentry/node";
import { createApp } from "./app.ts";
import { loadEnv } from "./config/env.ts";
import { isEmpty, migrate, openDatabase, seed } from "./platform/database/index.ts";
import { createLogger } from "./platform/logging/logger.ts";

const SHUTDOWN_GRACE_MS = 10_000;

const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL);
const db = openDatabase(env.DATABASE_PATH);

const applied = migrate(db);
if (applied.length > 0) logger.info({ applied }, "migrations applied");
if (isEmpty(db)) {
  await seed(db);
  logger.info("seed data loaded");
}

const server = createServer(createApp({ db, env, logger }));
server.listen(env.PORT, env.HOST, () => {
  logger.info({ host: env.HOST, port: env.PORT }, "api listening");
});

function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  setTimeout(() => process.exit(1), SHUTDOWN_GRACE_MS).unref();
  server.close(async () => {
    db.close();
    await Sentry.close(2000);
    process.exit(0);
  });
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
