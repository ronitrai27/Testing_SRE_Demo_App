import type {
  Product,
  ProductCreate,
  ProductPage,
  ProductQuery,
  ProductUpdate,
} from "@saltmarket/contracts";
import { conflict, notFound } from "../../platform/http/index.ts";
import type { CatalogRepository } from "./catalog.repository.ts";

export function createCatalogService(repository: CatalogRepository) {
  return {
    list(query: ProductQuery): ProductPage {
      // One row past the page tells us whether another page exists.
      const rows = repository.list({ ...query, limit: query.limit + 1 });
      const items = rows.slice(0, query.limit);
      const hasMore = rows.length > query.limit;
      return { items, nextCursor: hasMore ? (rows.at(-1)?.id ?? null) : null };
    },
    get(slug: string): Product {
      const product = repository.findBySlug(slug);
      if (!product) throw notFound("Product");
      return product;
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
