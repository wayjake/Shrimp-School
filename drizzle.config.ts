import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env");
} catch {}

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_URL!,
    authToken: process.env.TURSO_KEY,
  },
});
