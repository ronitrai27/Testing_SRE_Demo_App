import { z } from "zod";
import { Cents } from "./money.ts";

export const Category = z.enum(["visibility", "warmth", "eyewear", "shore"]);
export type Category = z.infer<typeof Category>;

const Slug = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words joined by hyphens");

export const Product = z.object({
  id: z.int().positive(),
  slug: Slug,
  name: z.string(),
  description: z.string(),
  category: Category,
  priceCents: Cents,
  stock: z.int(),
});
export type Product = z.infer<typeof Product>;

export const ProductPage = z.object({
  items: z.array(Product),
  nextCursor: z.int().nullable(),
});
export type ProductPage = z.infer<typeof ProductPage>;

export const ProductQuery = z.object({
  category: Category.optional(),
  cursor: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});
export type ProductQuery = z.infer<typeof ProductQuery>;

export const ProductCreate = z.strictObject({
  slug: Slug,
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(""),
  category: Category,
  priceCents: Cents,
  stock: z.int().nonnegative(),
});
export type ProductCreate = z.infer<typeof ProductCreate>;

/** Built from fields without defaults, so a partial update never resets a column. */
export const ProductUpdate = z
  .strictObject({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000),
    category: Category,
    priceCents: Cents,
    stock: z.int().nonnegative(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, "Provide at least one field to change");
export type ProductUpdate = z.infer<typeof ProductUpdate>;
