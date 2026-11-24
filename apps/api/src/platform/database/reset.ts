import type { Database } from "./database.ts";
import { migrate } from "./migrate.ts";
import { seed } from "./seed.ts";

/**
 * Returns the store to its seeded state. Tables are dropped rather than the file deleted, so a
 * running API keeps a valid handle and does not need a restart.
 */
export async function resetDatabase(db: Database): Promise<void> {
  db.exec("PRAGMA foreign_keys = OFF");
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all();
    for (const { name } of tables) db.exec(`DROP TABLE "${name}"`);
  } finally {
    db.exec("PRAGMA foreign_keys = ON");
  }
  migrate(db);
  await seed(db);
}
