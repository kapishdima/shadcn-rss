import { defineConfig } from "drizzle-kit";

const isProduction = !!process.env.TURSO_DATABASE_URL;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: isProduction ? "turso" : "sqlite",
  dbCredentials: isProduction
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: "./data/shadrss.db",
      },
});
