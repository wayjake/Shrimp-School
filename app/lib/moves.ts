// Shared by the schema, the seed script and the UI. Relative imports only:
// scripts/seed.ts runs under plain Node, where the ~/ alias doesn't resolve.

export const CATEGORIES = ["submission", "sweep", "pass", "escape", "takedown", "control"] as const;
export type Category = (typeof CATEGORIES)[number];

export const SETTINGS = ["class", "open_mat", "competition"] as const;
export type Setting = (typeof SETTINGS)[number];

export type Step = { title: string; detail: string };

export const CATEGORY_LABEL: Record<Category, string> = {
  submission: "Submissions",
  sweep: "Sweeps",
  pass: "Guard passes",
  escape: "Escapes",
  takedown: "Takedowns",
  control: "Control",
};

export const CATEGORY_SINGULAR: Record<Category, string> = {
  submission: "Submission",
  sweep: "Sweep",
  pass: "Guard pass",
  escape: "Escape",
  takedown: "Takedown",
  control: "Control",
};

export const SETTING_LABEL: Record<Setting, string> = {
  class: "Class",
  open_mat: "Open mat",
  competition: "Competition",
};

// Each category owns one frame color, so a card's color tells you its category
// before you read it. Values are @theme color names from app.css.
export const CATEGORY_TONE: Record<Category, { frame: string; text: string; ring: string }> = {
  submission: { frame: "bg-blue", text: "text-white", ring: "ring-blue" },
  sweep: { frame: "bg-pink", text: "text-ink", ring: "ring-pink" },
  pass: { frame: "bg-orange", text: "text-white", ring: "ring-orange" },
  escape: { frame: "bg-lilac", text: "text-ink", ring: "ring-lilac" },
  takedown: { frame: "bg-red", text: "text-white", ring: "ring-red" },
  control: { frame: "bg-olive", text: "text-white", ring: "ring-olive" },
};

export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}

export function isSetting(v: unknown): v is Setting {
  return typeof v === "string" && (SETTINGS as readonly string[]).includes(v);
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

type Tally = { attempts: number; successes: number };

// Hit rate is landed ÷ attempted across every entry, not an average of each
// entry's percentage, so a 1-for-1 night doesn't outweigh a 4-for-10 one.
export function hitRate(entries: Tally[]) {
  let attempts = 0;
  let successes = 0;
  for (const e of entries) {
    attempts += e.attempts;
    successes += e.successes;
  }
  return { attempts, successes, rate: attempts ? successes / attempts : null };
}

export function averageRating(entries: { rating: number }[]) {
  if (!entries.length) return null;
  return entries.reduce((sum, e) => sum + e.rating, 0) / entries.length;
}

export function formatPercent(rate: number | null) {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  // Dates are calendar days; parse at noon so no timezone shifts the day
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", opts);
}

export function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
