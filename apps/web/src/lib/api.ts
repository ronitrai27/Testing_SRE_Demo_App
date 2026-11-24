import { SeverityNumber } from "@opentelemetry/api-logs";
import { ProductPage } from "@saltmarket/contracts";
import { posthogLogger } from "../../instrumentation";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4100";

export async function listProducts(): Promise<ProductPage> {
  const res = await fetch(`${API_URL}/v1/products`, { cache: "no-store" });

  if (!res.ok) {
    posthogLogger.emit({
      body: "Product listing request failed",
      severityNumber: SeverityNumber.ERROR,
      attributes: {
        endpoint: "/v1/products",
        status_code: res.status,
      },
    });

    throw new Error(`GET /v1/products answered ${res.status}`);
  }

  const products = ProductPage.parse(await res.json());

  posthogLogger.emit({
    body: "Product listing loaded",
    severityNumber: SeverityNumber.INFO,
    attributes: {
      endpoint: "/v1/products",
      product_count: products.items.length,
    },
  });

  return products;
}
