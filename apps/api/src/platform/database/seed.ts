import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hashPassword } from "../security/password.ts";
import { type Database, transaction } from "./database.ts";

const SEED_DIR = join(import.meta.dirname, "../../../seed");

type SeedUser = { id: number; email: string; name: string; role: string; password: string };
type SeedCoupon = { code: string; percentOff: number; expiresAt: string | null };
type SeedProduct = {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  stock: number;
};

const load = <T>(file: string): T[] => JSON.parse(readFileSync(join(SEED_DIR, file), "utf8"));

export function isEmpty(db: Database): boolean {
  return db.prepare("SELECT 1 FROM products LIMIT 1").get() === undefined;
}

/** Loads the fixed data set. Ids are explicit, so every fresh store is identical. */
export async function seed(db: Database): Promise<void> {
  const users = await Promise.all(
    load<SeedUser>("users.json").map(async (user) => ({
      ...user,
      passwordHash: await hashPassword(user.password),
    })),
  );

  transaction(db, () => {
    const insertUser = db.prepare(
      "INSERT INTO users (id, email, name, role, password_hash) VALUES (?, ?, ?, ?, ?)",
    );
    for (const u of users) insertUser.run(u.id, u.email, u.name, u.role, u.passwordHash);

    const insertProduct = db.prepare(
      `INSERT INTO products (id, slug, name, description, category, price_cents, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const p of load<SeedProduct>("products.json")) {
      insertProduct.run(p.id, p.slug, p.name, p.description, p.category, p.priceCents, p.stock);
    }

    const insertCoupon = db.prepare(
      "INSERT INTO coupons (code, percent_off, expires_at) VALUES (?, ?, ?)",
    );
    for (const c of load<SeedCoupon>("coupons.json")) {
      insertCoupon.run(c.code, c.percentOff, c.expiresAt);
    }
  });
}
