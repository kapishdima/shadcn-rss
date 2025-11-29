import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const isProduction = !!process.env.TURSO_DATABASE_URL;

function createDb() {
  if (isProduction) {
    // Turso (production)
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzleLibsql(client, { schema });
  } else {
    // SQLite (local development)
    const Database = require("better-sqlite3");
    const path = require("path");
    const fs = require("fs");

    const dbPath = path.join(process.cwd(), "data", "shadrss.db");
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");

    return drizzleSqlite(sqlite, { schema });
  }
}

export const db = createDb();
export { schema };
