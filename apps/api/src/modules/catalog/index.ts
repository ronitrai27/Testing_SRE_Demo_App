import type { RequestHandler } from "express";
import type { Database } from "../../platform/database/index.ts";
import { createCatalogRepository } from "./catalog.repository.ts";
import { createCatalogRouter } from "./catalog.routes.ts";
import { createCatalogService } from "./catalog.service.ts";

type Dependencies = { db: Database; requireAdmin: RequestHandler };

export function createCatalogModule({ db, requireAdmin }: Dependencies) {
  const service = createCatalogService(createCatalogRepository(db));
  return { router: createCatalogRouter(service, requireAdmin) };
}
