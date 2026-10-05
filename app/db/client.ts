import { createClient } from "@libsql/client";

// Vite doesn't put .env into process.env for server code, and the scripts run
// under plain Node, so read it here for both
try {
  process.loadEnvFile(".env");
} catch {}

// The database lives on Turso. Shared by the app and scripts/*.ts, so it
// imports nothing local.
export function createDbClient() {
  const url = process.env.TURSO_URL;
  if (!url) throw new Error("TURSO_URL is not set. Add it (and TURSO_KEY) to .env.");
  return createClient({ url, authToken: process.env.TURSO_KEY });
}
