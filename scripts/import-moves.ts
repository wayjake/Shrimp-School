// Adds moves from a JSON file, each with the clip it was written from. Runs
// under plain Node (type stripping), so imports are relative with .ts extensions.
// Needs ffmpeg on the PATH.
//
//   npm run import -- moves.json
//
// The file is an array of { id?, name, position, category, description, steps,
// artNote?, video? }, where video is a path to the source clip. Like the seed,
// it never overwrites: a move whose id already exists is skipped, clip and all.
//
// Phone clips are 4K HEVC .mov, which Chrome and Firefox often won't play, so
// each one is re-encoded to a 1080p H.264 MP4 under uploads/. That also drops
// the phone's metadata, GPS location included.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createDbClient } from "../app/db/client.ts";
import { moveMedia, moves } from "../app/db/schema.ts";
import { isCategory, slugify, type Category, type Step } from "../app/lib/moves.ts";
import { UPLOAD_DIR } from "../app/lib/uploads.server.ts";

type ImportMove = {
  id?: string;
  name: string;
  position: string;
  category: string;
  description: string;
  steps: Step[];
  artNote?: string;
  video?: string;
};

const file = process.argv[2];
if (!file) {
  console.log("Usage: npm run import -- moves.json");
  process.exit(1);
}
const list = JSON.parse(readFileSync(file, "utf8")) as ImportMove[];

// Check the whole file before writing anything, so a typo doesn't leave half a batch
for (const m of list) {
  if (!isCategory(m.category)) throw new Error(`${m.name}: "${m.category}" isn't a category.`);
  if (m.video && !existsSync(m.video)) throw new Error(`${m.name}: no file at ${m.video}.`);
}

const db = drizzle(createDbClient());
mkdirSync(UPLOAD_DIR, { recursive: true });

function encode(source: string) {
  const name = `${crypto.randomUUID()}.mp4`;
  // ffmpeg applies the phone's rotation flag, so this fits either orientation
  // inside 1920×1920 without stretching it
  execFileSync(
    "ffmpeg",
    [
      "-v", "error",
      "-i", source,
      "-map", "0:v:0", "-map", "0:a:0?",
      "-vf", "scale=1920:1920:force_original_aspect_ratio=decrease:force_divisible_by=2",
      "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "128k",
      "-map_metadata", "-1",
      // Index up front, so playback starts before the whole file loads
      "-movflags", "+faststart",
      path.join(UPLOAD_DIR, name),
    ],
    { stdio: "inherit" },
  );
  return name;
}

for (const m of list) {
  const id = m.id ?? slugify(m.name);
  const [existing] = await db.select({ id: moves.id }).from(moves).where(eq(moves.id, id));
  if (existing) {
    console.log(`${id}: already in the library, skipped`);
    continue;
  }
  // Encode before writing anything, so a failed or interrupted encode leaves no
  // clipless move behind that a re-run would then skip
  let clip: string | null = null;
  if (m.video) {
    process.stdout.write(`${id}: encoding ${path.basename(m.video)}… `);
    clip = encode(m.video);
  }
  await db.insert(moves).values({
    id,
    name: m.name,
    position: m.position,
    category: m.category as Category,
    description: m.description,
    steps: m.steps,
    artNote: m.artNote ?? null,
  });
  if (clip) await db.insert(moveMedia).values({ moveId: id, kind: "video", file: clip });
  console.log(clip ?? `${id}: added`);
}
process.exit(0);
