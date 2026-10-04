import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Local-only: one SQLite file under data/, which .stignore keeps out of Syncthing
const dbPath = process.env.DATABASE_PATH ?? "./data/shrimp.db";
// data/ is gitignored and Syncthing-ignored, so it won't exist on a fresh machine
mkdirSync(path.dirname(dbPath), { recursive: true });
const url = `file:${dbPath}`;

// Reuse the client across HMR reloads in dev
const globalForDb = globalThis as unknown as { libsql?: Client };
const client = globalForDb.libsql ?? createClient({ url });
if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export * from "./schema";
