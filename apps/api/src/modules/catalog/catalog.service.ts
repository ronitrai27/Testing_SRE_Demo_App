import type {
  Product,
  ProductCreate,
  ProductPage,
  ProductQuery,
  ProductUpdate,
} from "@saltmarket/contracts";
import { conflict, notFound } from "../../platform/http/index.ts";
import type { CatalogRepository } from "./catalog.repository.ts";
import { discounted, sumCents } from "./pricing.ts";

/** Bundles of two or more products get this much off. */
const BUNDLE_PERCENT_OFF = 10;

type Rate = { perUsd: number; symbol: string };

/** Display prices for shoppers abroad. Stored prices stay in US cents. */
const RATES: Record<string, Rate> = {
  USD: { perUsd: 1, symbol: "$" },
  EUR: { perUsd: 0.92, symbol: "€" },
  GBP: { perUsd: 0.79, symbol: "£" },
};

export function createCatalogService(repository: CatalogRepository) {
  return {
    list(query: ProductQuery): ProductPage {
      // One row past the page tells us whether another page exists.
      const rows = repository.list({ ...query, limit: query.limit + 1 });
      const items = rows.slice(0, query.limit);
      const hasMore = rows.length > query.limit;
      return { items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null };
    },
    get(slug: string): Product {
      const product = repository.findBySlug(slug);
      if (!product) throw notFound("Product");
      return product;
    },
    /** The product's price shown in the shopper's currency, such as "€41.40". */
    priceIn(slug: string, currency: string): { slug: string; currency: string; label: string } {
      const product = repository.findBySlug(slug);
      if (!product) throw notFound("Product");
      const code = currency.toUpperCase();
      const { perUsd, symbol } = RATES[code] as Rate;
      return { slug, currency: code, label: `${symbol}${((product.priceCents * perUsd) / 100).toFixed(2)}` };
    },
    /** Several products bought together, such as "?slugs=tow-float-20l,polarised-goggles". */
    bundle(slugList: string): { slugs: string[]; totalCents: number; bundleCents: number } {
      const products = slugList
        .split(",")
        .map((slug) => repository.findBySlug(slug))
        .filter((product): product is Product => product !== undefined);
      const totalCents = sumCents(products);
      const bundleCents = products.length > 1 ? discounted(totalCents, BUNDLE_PERCENT_OFF) : totalCents;
      return { slugs: products.map((product) => product.slug), totalCents, bundleCents };
    },
    create(input: ProductCreate): Product {
      const product = repository.create(input);
      if (!product) throw conflict("That slug is already in use");
      return product;
    },
    update(slug: string, patch: ProductUpdate): Product {
      const product = repository.update(slug, patch);
      if (!product) throw notFound("Product");
      return product;
    },
    /** Archived, not deleted: past orders still refer to the product. */
    archive(slug: string): void {
      if (!repository.archive(slug, new Date())) throw notFound("Product");
    },
  };
}

export type CatalogService = ReturnType<typeof createCatalogService>;
