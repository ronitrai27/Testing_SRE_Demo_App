import { Credentials, Registration } from "@saltmarket/contracts";
import { type Response, Router } from "express";
import type { Env } from "../../config/env.ts";
import { currentUser, SESSION_COOKIE, sessionToken } from "./identity.middleware.ts";
import type { IdentityService, Session } from "./identity.service.ts";

export function createIdentityRouter(service: IdentityService, env: Env): Router {
  const cookie = { httpOnly: true, sameSite: "lax", path: "/", secure: env.COOKIE_SECURE } as const;

  const respond = (res: Response, status: number, session: Session) =>
    res
      .status(status)
      .cookie(SESSION_COOKIE, session.token, { ...cookie, expires: session.expiresAt })
      .json(session.user);

  return Router()
    .post("/users", async (req, res) => {
      respond(res, 201, await service.register(Registration.parse(req.body)));
    })
    .post("/sessions", async (req, res) => {
      respond(res, 201, await service.signIn(Credentials.parse(req.body)));
    })
    .delete("/sessions/current", (req, res) => {
      const token = sessionToken(req);
      if (token) service.signOut(token);
      res.clearCookie(SESSION_COOKIE, cookie).status(204).end();
    })
    .get("/me", (req, res) => {
      res.json(currentUser(req));
    });
}
