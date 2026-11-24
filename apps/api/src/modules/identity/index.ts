import type { Env } from "../../config/env.ts";
import type { Database } from "../../platform/database/index.ts";
import { createLoadUser, requireRole } from "./identity.middleware.ts";
import { createIdentityRepository } from "./identity.repository.ts";
import { createIdentityRouter } from "./identity.routes.ts";
import { createIdentityService } from "./identity.service.ts";

export { currentUser } from "./identity.middleware.ts";

export function createIdentityModule({ db, env }: { db: Database; env: Env }) {
  const service = createIdentityService(createIdentityRepository(db), env.SESSION_TTL_HOURS);
  return {
    router: createIdentityRouter(service, env),
    loadUser: createLoadUser(service),
    requireRole,
  };
}
