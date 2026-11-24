import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Database, transaction } from "./database.ts";

const MIGRATIONS_DIR = join(import.meta.dirname, "../../../migrations");

/** Applies pending migrations in filename order. Returns the names it applied. */
export function migrate(db: Database, dir: string = MIGRATIONS_DIR): string[] {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY) STRICT");
  const applied = new Set(
    db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((row) => String(row.name)),
  );
  const pending = readdirSync(dir)
    .filter((name) => name.endsWith(".sql") && !applied.has(name))
    .sort();

  for (const name of pending) {
    transaction(db, () => {
      db.exec(readFileSync(join(dir, name), "utf8"));
      db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(name);
    });
  }
  return pending;
}
