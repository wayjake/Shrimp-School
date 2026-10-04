import { asc, desc, eq } from "drizzle-orm";
import { db, journalEntries, moveMedia, moves } from "~/db/index.server";
import { artEnabled, drawArt } from "./art.server";
import { hitRate, slugify, type Category } from "./moves";
import { deleteUpload, saveUpload } from "./uploads.server";

// Every move with what a library card needs: its cover and your hit rate on it
export async function listMoveCards() {
  const [allMoves, media, entries] = await Promise.all([
    db.select().from(moves).orderBy(asc(moves.name)),
    db.select().from(moveMedia).orderBy(asc(moveMedia.createdAt)),
    db
      .select({
        moveId: journalEntries.moveId,
        attempts: journalEntries.attempts,
        successes: journalEntries.successes,
      })
      .from(journalEntries),
  ]);

  return allMoves.map((m) => {
    const own = media.filter((x) => x.moveId === m.id);
    const cover = own.find((x) => x.kind === "image") ?? own[0] ?? null;
    return {
      id: m.id,
      name: m.name,
      position: m.position,
      category: m.category as Category,
      stepCount: m.steps.length,
      cover: cover ? { file: cover.file, kind: cover.kind } : null,
      art: m.art,
      rate: hitRate(entries.filter((e) => e.moveId === m.id)).rate,
    };
  });
}

export async function getMove(id: string) {
  const [move] = await db.select().from(moves).where(eq(moves.id, id));
  if (!move) return null;
  const media = await db
    .select()
    .from(moveMedia)
    .where(eq(moveMedia.moveId, id))
    .orderBy(asc(moveMedia.createdAt));
  return { ...move, media };
}

export async function entriesForMove(id: string) {
  return db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.moveId, id))
    .orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));
}

export async function moveOptions() {
  return db.select({ id: moves.id, name: moves.name }).from(moves).orderBy(asc(moves.name));
}

export function notFound(what: string): never {
  throw new Response(`No ${what} here`, { status: 404, statusText: `That ${what} doesn't exist.` });
}

// A free slug for a new move: "armbar", then "armbar-2", …
export async function freeMoveId(name: string) {
  const base = slugify(name) || "move";
  const taken = new Set((await db.select({ id: moves.id }).from(moves)).map((m) => m.id));
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

// Save each upload to disk, then record it against the move
export async function attachMedia(moveId: string, files: File[]) {
  for (const f of files) {
    const saved = await saveUpload(f);
    await db.insert(moveMedia).values({ moveId, ...saved });
  }
}

// Cover art draws take 20–60s, so they run in the background and the move page
// polls. One at a time per move, so a double click doesn't pay twice. Kept in
// memory: a restart forgets a failure, which is fine for a local app.
const drawing = new Set<string>();
const drawErrors = new Map<string, string>();

export function artStatus(id: string) {
  return { enabled: artEnabled(), drawing: drawing.has(id), error: drawErrors.get(id) ?? null };
}

export function startMoveArt(id: string) {
  if (!artEnabled() || drawing.has(id)) return;
  drawing.add(id);
  drawErrors.delete(id);
  void (async () => {
    try {
      const [move] = await db.select().from(moves).where(eq(moves.id, id));
      if (!move) return;
      const file = await drawArt({ ...move, category: move.category as Category });
      // The move may have been deleted while it drew
      const [updated] = await db.update(moves).set({ art: file }).where(eq(moves.id, id)).returning({ id: moves.id });
      if (!updated) await deleteUpload(file);
      else if (move.art) await deleteUpload(move.art);
    } catch (e) {
      console.error(`Cover art for ${id} failed:`, e);
      drawErrors.set(id, e instanceof Error ? e.message : "The drawing failed.");
    } finally {
      drawing.delete(id);
    }
  })();
}
