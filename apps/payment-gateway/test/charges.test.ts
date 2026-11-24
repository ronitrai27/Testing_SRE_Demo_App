import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createGateway } from "../src/server.ts";

describe("charges", () => {
  const server = createGateway();
  let url = "";

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1/charges`;
  });
  afterAll(() => {
    server.closeAllConnections();
    server.close();
  });

  const charge = (key: string, token: string) =>
    fetch(url, {
      method: "POST",
      headers: { "idempotency-key": key },
      body: JSON.stringify({ amountCents: 1000, token }),
    });

  it("accepts a card", async () => {
    expect((await charge("a", "tok_visa")).status).toBe(201);
  });

  it("declines a card", async () => {
    expect((await charge("b", "tok_declined")).status).toBe(402);
  });

  it("charges once per idempotency key", async () => {
    const first = await (await charge("c", "tok_visa")).json();
    expect(await (await charge("c", "tok_visa")).json()).toEqual(first);
  });
});
