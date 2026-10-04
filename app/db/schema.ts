import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { CATEGORIES, SETTINGS, type Step } from "../lib/moves.ts";

// Stored as unix ms so ordering is a plain integer comparison
const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`);

export const moves = sqliteTable("moves", {
  // URL slug, e.g. "scissor-sweep"
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // Where you start the move from, e.g. "Closed guard, bottom"
  position: text("position").notNull(),
  category: text("category", { enum: CATEGORIES }).notNull(),
  description: text("description").notNull(),
  // Ordered, so the array index is the step number
  steps: text("steps", { mode: "json" }).$type<Step[]>().notNull().default(sql`'[]'`),
  // A link out to an instructional (YouTube, BJJ Fanatics…), next to any uploads
  videoUrl: text("video_url"),
  // Generated cover illustration under uploads/ (lib/art.server.ts). Kept off
  // move_media so it never passes for a photo you took.
  art: text("art"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Photos and clips uploaded for a move. Files live in uploads/ and are served by
// routes/media.ts; this row is the only record of them.
export const moveMedia = sqliteTable(
  "move_media",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    moveId: text("move_id")
      .notNull()
      .references(() => moves.id, { onDelete: "cascade", onUpdate: "cascade" }),
    kind: text("kind", { enum: ["image", "video"] }).notNull(),
    // Name of the file under uploads/
    file: text("file").notNull(),
    caption: text("caption"),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("move_media_move_idx").on(t.moveId)],
);

// One session with one move: how many times you went for it, how many landed,
// and how it felt.
export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    moveId: text("move_id")
      .notNull()
      .references(() => moves.id, { onDelete: "cascade", onUpdate: "cascade" }),
    // Calendar day, YYYY-MM-DD
    date: text("date").notNull(),
    setting: text("setting", { enum: SETTINGS }).notNull(),
    attempts: integer("attempts").notNull(),
    successes: integer("successes").notNull(),
    // 1–5
    rating: integer("rating").notNull(),
    feeling: text("feeling"),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("journal_move_idx").on(t.moveId), index("journal_date_idx").on(t.date)],
);

export type Move = typeof moves.$inferSelect;
export type MoveMedia = typeof moveMedia.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
