import type { Role, User } from "@saltmarket/contracts";
import type { Request, RequestHandler } from "express";
import { forbidden, unauthenticated } from "../../platform/http/index.ts";
import type { IdentityService } from "./identity.service.ts";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const SESSION_COOKIE = "sm_session";

export const sessionToken = (req: Request): string | undefined => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  return typeof token === "string" && token !== "" ? token : undefined;
};

export const createLoadUser =
  (service: IdentityService): RequestHandler =>
  (req, _res, next) => {
    const token = sessionToken(req);
    if (token) req.user = service.authenticate(token);
    next();
  };

export function currentUser(req: Request): User {
  if (!req.user) throw unauthenticated();
  return req.user;
}

export const requireRole =
  (role: Role): RequestHandler =>
  (req, _res, next) => {
    if (currentUser(req).role !== role) throw forbidden();
    next();
  };
