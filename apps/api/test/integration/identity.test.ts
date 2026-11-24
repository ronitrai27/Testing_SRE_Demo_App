import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ALICE, startApp, type TestApp } from "../support/harness.ts";

describe("identity", () => {
  let app: TestApp;
  beforeEach(async () => {
    app = await startApp();
  });
  afterEach(() => app.stop());

  it("signs in, reports the current user and signs out", async () => {
    const cookie = await app.signIn(...ALICE);
    const me = await app.request("GET", "/v1/me", { cookie });
    expect(await me.json()).toEqual({
      id: 2,
      email: "alice@saltmarket.test",
      name: "Alice Penrose",
      role: "customer",
    });

    await app.request("DELETE", "/v1/sessions/current", { cookie });
    expect((await app.request("GET", "/v1/me", { cookie })).status).toBe(401);
  });

  it("answers a wrong password and an unknown email identically", async () => {
    const attempt = async (email: string) => {
      const res = await app.request("POST", "/v1/sessions", { body: { email, password: "nope" } });
      const { requestId: _, ...problem } = (await res.json()) as Record<string, unknown>;
      return problem;
    };
    expect(await attempt("alice@saltmarket.test")).toEqual(await attempt("nobody@saltmarket.test"));
  });

  it("registers a customer and refuses the same email twice", async () => {
    const body = { email: "Cara@Saltmarket.test", name: "Cara", password: "a-long-password" };
    const first = await app.request("POST", "/v1/users", { body });
    expect(first.status).toBe(201);
    expect(await first.json()).toMatchObject({ email: "cara@saltmarket.test", role: "customer" });
    expect((await app.request("POST", "/v1/users", { body })).status).toBe(409);
  });

  it("does not accept a role at registration", async () => {
    const body = { email: "c@salt.test", name: "C", password: "a-long-password", role: "admin" };
    expect((await app.request("POST", "/v1/users", { body })).status).toBe(400);
  });

  it("ignores an expired session", async () => {
    const cookie = await app.signIn(...ALICE);
    app.db.exec("UPDATE sessions SET expires_at = '2000-01-01T00:00:00.000Z'");
    expect((await app.request("GET", "/v1/me", { cookie })).status).toBe(401);
  });
});
