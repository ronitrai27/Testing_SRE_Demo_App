import { Router } from "express";
import type { Database } from "../../platform/database/index.ts";

export function createHealthRouter(db: Database): Router {
  const ping = db.prepare("SELECT 1");
  return Router().get("/healthz", (_req, res) => {
    ping.get();
    res.json({ status: "ok" });
  });
}
