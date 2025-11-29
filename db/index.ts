import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH =
  process.env.DATABASE_URL || path.join(process.cwd(), "data", "shadrss.db");

// Ensure the data directory exists
const dbDir = path.dirname(DB_PATH);
if (typeof window === "undefined") {
  const fs = require("fs");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

export { schema };
