import type { Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { createDbClient } from "./client";
import * as schema from "./schema";

// Reuse the client across HMR reloads in dev
const globalForDb = globalThis as unknown as { libsql?: Client };
const client = globalForDb.libsql ?? createDbClient();
if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export * from "./schema";
