// Draws cover art for moves. Runs under plain Node (type stripping), so imports
// are relative with .ts extensions. Needs OPENROUTER_API_KEY in .env.
//
//   npm run art                      draw every move that has no art yet
//   npm run art -- armbar-from-mount redraw these moves, art or not
//   npm run art -- --prompt armbar-from-mount  print the prompt, draw nothing
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { moves } from "../app/db/schema.ts";
import { artPrompt, drawArt } from "../app/lib/art.server.ts";
import type { Category } from "../app/lib/moves.ts";
import { deleteUpload } from "../app/lib/uploads.server.ts";

const dbPath = process.env.DATABASE_PATH ?? "./data/shrimp.db";
mkdirSync(path.dirname(dbPath), { recursive: true });
const db = drizzle(createClient({ url: `file:${dbPath}` }));

const args = process.argv.slice(2);
const promptOnly = args.includes("--prompt");
const ids = args.filter((a) => !a.startsWith("--"));

const rows = await db
  .select()
  .from(moves)
  .where(ids.length ? inArray(moves.id, ids) : isNull(moves.art));

if (!rows.length) {
  console.log(ids.length ? "No moves with those ids." : "Every move already has art.");
  process.exit(0);
}

let failed = 0;
for (const move of rows) {
  const subject = { ...move, category: move.category as Category };
  if (promptOnly) {
    console.log(`--- ${move.id}\n${artPrompt(subject)}\n`);
    continue;
  }
  process.stdout.write(`Drawing ${move.name}… `);
  try {
    const file = await drawArt(subject);
    await db.update(moves).set({ art: file }).where(eq(moves.id, move.id));
    if (move.art) await deleteUpload(move.art);
    console.log(file);
  } catch (e) {
    failed++;
    console.log(`failed: ${e instanceof Error ? e.message : e}`);
  }
}
process.exit(failed ? 1 : 0);
