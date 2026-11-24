import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import helmet from "helmet";
import type { Env } from "./config/env.ts";
import { createCatalogModule } from "./modules/catalog/index.ts";
import { createHealthRouter } from "./modules/health/index.ts";
import { createIdentityModule } from "./modules/identity/index.ts";
import type { Database } from "./platform/database/index.ts";
import { errorHandler, routeNotFound } from "./platform/http/index.ts";
import { type Logger, requestLogger } from "./platform/logging/logger.ts";

export type AppDependencies = { db: Database; env: Env; logger: Logger };

/** Composition root: the one place modules are created and wired to each other. */
export function createApp({ db, env, logger }: AppDependencies): Express {
  const identity = createIdentityModule({ db, env });
  const catalog = createCatalogModule({ db, requireAdmin: identity.requireRole("admin") });

  const app = express();
  app.disable("x-powered-by");
  app.use(requestLogger(logger));
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(identity.loadUser);

  app.use(createHealthRouter(db));
  app.use("/v1", identity.router);
  app.use("/v1/products", catalog.router);

  app.use(routeNotFound);
  app.use(errorHandler);
  return app;
}
