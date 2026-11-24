import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

type Charge = { id: string; status: "succeeded" | "declined"; amountCents: number };

const MAX_BODY_BYTES = 10_000;

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY_BYTES) throw new Error("body too large");
  }
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null) throw new Error("expected an object");
  return value as Record<string, unknown>;
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(body));
}

/** A stand-in card processor. `tok_declined` is refused, every other token is accepted. */
export function createGateway(): Server {
  const byIdempotencyKey = new Map<string, Charge>();

  return createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/healthz") return send(res, 200, { status: "ok" });
    if (req.method !== "POST" || req.url !== "/v1/charges") {
      return send(res, 404, { error: "not_found" });
    }

    const key = req.headers["idempotency-key"];
    if (typeof key !== "string") return send(res, 400, { error: "idempotency_key_required" });

    let body: Record<string, unknown>;
    try {
      body = await readJson(req);
    } catch {
      return send(res, 400, { error: "invalid_body" });
    }
    const { amountCents, token } = body;
    if (!Number.isInteger(amountCents) || Number(amountCents) < 0 || typeof token !== "string") {
      return send(res, 400, { error: "invalid_body" });
    }

    let charge = byIdempotencyKey.get(key);
    if (!charge) {
      charge = {
        id: `ch_${randomUUID()}`,
        status: token === "tok_declined" ? "declined" : "succeeded",
        amountCents: Number(amountCents),
      };
      byIdempotencyKey.set(key, charge);
    }
    send(res, charge.status === "succeeded" ? 201 : 402, charge);
  });
}
