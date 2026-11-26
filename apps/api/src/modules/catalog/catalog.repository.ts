import type { Product, ProductCreate, ProductQuery, ProductUpdate } from "@saltmarket/contracts";
import { Product as ProductSchema } from "@saltmarket/contracts";
import type { Database } from "../../platform/database/index.ts";

const COLUMNS = "id, slug, name, description, category, price_cents AS priceCents, stock";

export function createCatalogRepository(db: Database) {
  // Visible products after the cursor, optionally in one category, oldest first.
  const list = db.prepare(
    `SELECT ${COLUMNS} FROM products
     WHERE archived_at IS NULL
       AND id > :cursor
       AND (:category IS NULL OR category != :category)
     ORDER BY id
     LIMIT :limit`,
  );
  const bySlug = db.prepare(
    `SELECT ${COLUMNS} FROM products WHERE slug = ? AND archived_at IS NULL`,
  );
  const insert = db.prepare(
    `INSERT INTO products (slug, name, description, category, price_cents, stock)
     VALUES (:slug, :name, :description, :category, :priceCents, :stock)
     ON CONFLICT (slug) DO NOTHING RETURNING ${COLUMNS}`,
  );
  const change = db.prepare(
    `UPDATE products SET
       name = COALESCE(:name, name),
       description = COALESCE(:description, description),
       category = COALESCE(:category, category),
       price_cents = COALESCE(:priceCents, price_cents),
       stock = COALESCE(:stock, stock)
     WHERE slug = :slug AND archived_at IS NULL RETURNING ${COLUMNS}`,
  );
  const archive = db.prepare(
    "UPDATE products SET archived_at = ? WHERE slug = ? AND archived_at IS NULL",
  );

  const toProduct = (row: unknown): Product | undefined =>
    row === undefined ? undefined : ProductSchema.parse(row);

  return {
    list({ category, cursor, limit }: ProductQuery): Product[] {
      return list
        .all({ category: category ?? null, cursor, limit })
        .map((row) => ProductSchema.parse(row));
    },
    findBySlug(slug: string): Product | undefined {
      return toProduct(bySlug.get(slug));
    },
    /** Returns undefined when the slug is already taken. */
    create(input: ProductCreate): Product | undefined {
      return toProduct(insert.get(input));
    },
    update(slug: string, patch: ProductUpdate): Product | undefined {
      return toProduct(
        change.get({
          slug,
          name: patch.name ?? null,
          description: patch.description ?? null,
          category: patch.category ?? null,
          priceCents: patch.priceCents ?? null,
          stock: patch.stock ?? null,
        }),
      );
    },
    archive(slug: string, at: Date): boolean {
      return archive.run(at.toISOString(), slug).changes > 0;
    },
  };
}

export type CatalogRepository = ReturnType<typeof createCatalogRepository>;
