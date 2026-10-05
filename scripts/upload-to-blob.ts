// Moves files from uploads/ into Vercel Blob and points the DB at them. Runs
// under plain Node (type stripping), so imports are relative with .ts extensions.
// Needs BLOB_READ_WRITE_TOKEN in .env.
//
//   npm run blob:upload
//
// Only rows that still hold a bare file name are touched, so it's safe to re-run.
// The local files are left in place.
import { readFileSync } from "node:fs";
import path from "node:path";
import { eq, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createDbClient } from "../app/db/client.ts";
import { moveMedia, moves } from "../app/db/schema.ts";
import { mediaType, storeFile, uploadPath } from "../app/lib/uploads.server.ts";

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.log("Add BLOB_READ_WRITE_TOKEN to .env first.");
  process.exit(1);
}

const db = drizzle(createDbClient());
const isUrl = (ref: string) => /^https?:\/\//.test(ref);

async function upload(name: string) {
  const full = uploadPath(name);
  const type = mediaType(name);
  if (!full || !type) throw new Error(`${name} isn't a file this app stores.`);
  return storeFile(name, readFileSync(full), type.mime);
}

let failed = 0;
async function migrate(label: string, name: string, save: (url: string) => Promise<unknown>) {
  try {
    const url = await upload(name);
    await save(url);
    console.log(`${label}: ${path.basename(url)}`);
  } catch (e) {
    failed++;
    console.log(`${label}: failed, ${e instanceof Error ? e.message : e}`);
  }
}

for (const m of await db.select({ id: moves.id, art: moves.art }).from(moves).where(isNotNull(moves.art))) {
  if (isUrl(m.art!)) continue;
  await migrate(`${m.id} art`, m.art!, (url) => db.update(moves).set({ art: url }).where(eq(moves.id, m.id)));
}
for (const r of await db.select().from(moveMedia)) {
  if (isUrl(r.file)) continue;
  await migrate(`${r.moveId} ${r.kind}`, r.file, (url) => db.update(moveMedia).set({ file: url }).where(eq(moveMedia.id, r.id)));
}
console.log(failed ? `${failed} failed.` : "Done.");
process.exit(failed ? 1 : 0);
