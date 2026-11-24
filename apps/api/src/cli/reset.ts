import { loadEnv } from "../config/env.ts";
import { openDatabase, resetDatabase } from "../platform/database/index.ts";

const env = loadEnv();
const db = openDatabase(env.DATABASE_PATH);
await resetDatabase(db);
db.close();
console.log(`Store reset: ${env.DATABASE_PATH}`);
