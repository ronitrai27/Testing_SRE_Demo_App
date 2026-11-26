import { ProductPage, Quote } from "@saltmarket/contracts";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ADMIN, ALICE, startApp, type TestApp } from "../support/harness.ts";

const buoy = {
  slug: "sighting-buoy",
  name: "Sighting buoy",
  category: "visibility",
  priceCents: 4900,
  stock: 5,
};

describe("catalog", () => {
  let app: TestApp;
  beforeEach(async () => {
    app = await startApp();
  });
  afterEach(() => app.stop());

  it("pages through every product exactly once", async () => {
    const seen: string[] = [];
    let cursor: number | null = 0;
    while (cursor !== null) {
      const res = await app.request("GET", `/v1/products?limit=5&cursor=${cursor}`);
      const page: ProductPage = ProductPage.parse(await res.json());
      seen.push(...page.items.map((product) => product.slug));
      cursor = page.nextCursor;
    }
    expect(seen).toHaveLength(12);
    expect(new Set(seen).size).toBe(12);
  });

  it("quotes a price for a quantity", async () => {
    const res = await app.request("GET", "/v1/products/strobe-cap-clip/quote?quantity=2");
    expect(res.status).toBe(200);
    expect(Quote.parse(await res.json())).toEqual({
      slug: "strobe-cap-clip",
      quantity: 2,
      unitCents: 1800,
      discountCents: 0,
      totalCents: 3600,
      inStock: true,
    });
  });

  it("takes 10% off an order of 10 or more", async () => {
    const res = await app.request("GET", "/v1/products/strobe-cap-clip/quote?quantity=10");
    expect(Quote.parse(await res.json())).toMatchObject({ discountCents: 1800, totalCents: 16200 });
  });

  it("refuses a quantity of zero", async () => {
    const res = await app.request("GET", "/v1/products/strobe-cap-clip/quote?quantity=0");
    expect(res.status).toBe(400);
  });

  it("filters by category", async () => {
    const res = await app.request("GET", "/v1/products?category=eyewear");
    const page = ProductPage.parse(await res.json());
    expect(page.items.map((product) => product.slug)).toEqual([
      "low-light-goggles",
      "polarised-goggles",
    ]);
  });

  it("rejects an unknown category with a problem document", async () => {
    const res = await app.request("GET", "/v1/products?category=boats");
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
    expect(await res.json()).toMatchObject({ status: 400, issues: [{ path: "category" }] });
  });

  it("lets an admin create, change and archive a product", async () => {
    const cookie = await app.signIn(...ADMIN);

    const created = await app.request("POST", "/v1/products", { body: buoy, cookie });
    expect(created.status).toBe(201);

    const changed = await app.request("PATCH", "/v1/products/sighting-buoy", {
      body: { stock: 0 },
      cookie,
    });
    expect(await changed.json()).toMatchObject({ ...buoy, stock: 0 });

    const archived = await app.request("DELETE", "/v1/products/sighting-buoy", { cookie });
    expect(archived.status).toBe(204);
    expect((await app.request("GET", "/v1/products/sighting-buoy")).status).toBe(404);
  });

  it("refuses a duplicate slug", async () => {
    const cookie = await app.signIn(...ADMIN);
    const body = { ...buoy, slug: "tide-clock" };
    expect((await app.request("POST", "/v1/products", { body, cookie })).status).toBe(409);
  });

  it("refuses writes from visitors and customers", async () => {
    expect((await app.request("POST", "/v1/products", { body: buoy })).status).toBe(401);
    const cookie = await app.signIn(...ALICE);
    expect((await app.request("POST", "/v1/products", { body: buoy, cookie })).status).toBe(403);
  });
});
