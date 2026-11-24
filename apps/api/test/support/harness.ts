import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../../src/app.ts";
import { loadEnv } from "../../src/config/env.ts";
import { migrate, openDatabase, seed } from "../../src/platform/database/index.ts";
import { createLogger } from "../../src/platform/logging/logger.ts";

type RequestOptions = { body?: unknown; cookie?: string };

/** A real HTTP server on a random port over a private in-memory store. */
export async function startApp() {
  const env = loadEnv({ NODE_ENV: "test", DATABASE_PATH: ":memory:" });
  const db = openDatabase(env.DATABASE_PATH);
  migrate(db);
  await seed(db);

  const server = createServer(createApp({ db, env, logger: createLogger("silent") }));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const request = (method: string, path: string, { body, cookie }: RequestOptions = {}) => {
    const headers = new Headers();
    if (body !== undefined) headers.set("content-type", "application/json");
    if (cookie) headers.set("cookie", cookie);
    const payload = typeof body === "string" || body === undefined ? body : JSON.stringify(body);
    return fetch(base + path, { method, headers, body: payload });
  };

  return {
    db,
    request,
    async signIn(email: string, password: string): Promise<string> {
      const res = await request("POST", "/v1/sessions", { body: { email, password } });
      const cookie = res.headers.getSetCookie()[0]?.split(";")[0];
      if (!cookie) throw new Error(`sign-in failed with ${res.status}`);
      return cookie;
    },
    async stop() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      db.close();
    },
  };
}

export type TestApp = Awaited<ReturnType<typeof startApp>>;

export const ADMIN = ["admin@saltmarket.test", "demo-admin-pass"] as const;
export const ALICE = ["alice@saltmarket.test", "demo-alice-pass"] as const;
