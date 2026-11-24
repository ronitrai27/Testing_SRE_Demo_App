import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrate, resetDatabase } from "../../src/platform/database/index.ts";
import { startApp, type TestApp } from "../support/harness.ts";

describe("platform", () => {
  let app: TestApp;
  beforeEach(async () => {
    app = await startApp();
  });
  afterEach(() => app.stop());

  it("reports healthy", async () => {
    expect(await (await app.request("GET", "/healthz")).json()).toEqual({ status: "ok" });
  });

  it("returns a problem document for an unknown route", async () => {
    const res = await app.request("GET", "/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ title: "Route not found" });
  });

  it("returns 400 for malformed JSON", async () => {
    expect((await app.request("POST", "/v1/users", { body: "{" })).status).toBe(400);
  });

  it("applies each migration once", () => {
    expect(migrate(app.db)).toEqual([]);
  });

  it("resets a changed store under a running server", async () => {
    app.db.exec("UPDATE products SET stock = 0; DELETE FROM coupons;");
    await resetDatabase(app.db);
    const res = await app.request("GET", "/v1/products/tide-clock");
    expect(await res.json()).toMatchObject({ stock: 1 });
    expect(app.db.prepare("SELECT count(*) AS n FROM coupons").get()).toMatchObject({ n: 3 });
  });
});
