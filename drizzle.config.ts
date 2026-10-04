import { mkdirSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// .env is optional here: DATABASE_PATH is the only setting, and it has a default
try {
  process.loadEnvFile(".env");
} catch {}

// data/ is gitignored and Syncthing-ignored, so create it before the first push
mkdirSync("./data", { recursive: true });

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? "./data/shrimp.db",
  },
});
