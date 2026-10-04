// Cover illustrations drawn by an image model (via OpenRouter) from a move's own content.
// Runs under plain Node too (scripts/art.ts), so imports are relative .ts.
//
// The prompt is two blocks. The style lock never changes, so every card looks
// like one set: it's lifted from the reference illustration, plus the rules
// from the imagegen-frontend-web skill that apply to a single picture —
// Palette Discipline (a fixed palette, named by hex), Multi-Image Consistency
// (same world and figures, only the composition varies) and the anti-slop list
// (no gradients, glow or neon). The scene block is the move itself.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CATEGORY_SINGULAR, CATEGORY_TONE, type Category, type Step } from "./moves.ts";
import { UPLOAD_DIR } from "./uploads.server.ts";

// Vite doesn't put .env into process.env for server code, so read it here
try {
  process.loadEnvFile(".env");
} catch {}

export type ArtSubject = {
  id: string;
  name: string;
  position: string;
  category: Category;
  description: string;
  steps: Step[];
};

export const artEnabled = () => Boolean(process.env.OPENROUTER_API_KEY);

// Hex values from the @theme block in app.css
const HEX = {
  blue: "#1636f2",
  pink: "#ef86cd",
  orange: "#ec6a2c",
  red: "#e1533d",
  lilac: "#94a5f3",
  olive: "#7a7350",
  gold: "#e9b44c",
  mist: "#e7eaf6",
  ink: "#121212",
};

// Colors for the big background shapes. Gold is the mat, olive reads muddy and
// blue would swallow the blue gi, so those are left out.
const SHAPES = ["red", "pink", "orange", "lilac"] as const;

const STYLE = `Flat vector editorial illustration, in the style of a modern cut-paper poster.
- Bold, even black outlines (${HEX.ink}) on the people; clothing folds drawn as a few short black lines. Flat fills only: no gradients, no airbrushing, no texture, no glow, no neon.
- Two friendly cartoon jiu-jitsu practitioners with simple rounded faces, calm expressions and bare feet. The one doing the move wears a royal blue gi (${HEX.blue}) with a black belt. Their training partner wears a coral pink gi (#f0566a) with a black belt. Their looks are given below.
- Background: one flat, evenly lit pale mist color (${HEX.mist}) across the whole top of the image, and a flat gold mat (${HEX.gold}) filling the lower part, seen from a low side angle. Never dark, smoky, glowing or vignetted.
- Behind the people, one or two large flat geometric shapes with crisp edges: a full disc or a half-moon, in the background colors given below. Scatter three or four small crisp white four-point sparkles and a few small white dots, with no halo around them.
- Use only these colors plus skin tones, black and white. Nothing photographic, no 3D render, no shadows except one soft flat shadow under the bodies.
- No text, letters, numbers, logos or patches anywhere in the image.`;

const FRAMING = `Square image. Keep both people fully inside the frame with a margin, centered slightly low. Leave the top-left corner and the bottom-right corner free of anything important, because labels are placed there.
Anatomy matters more than anything: each person has exactly two arms and two legs, every limb visibly connects to a body, hands and feet have the right number of digits, and the grips and leg positions are technically correct jiu-jitsu.`;

// Two shape colors per move, seeded by id so a redraw keeps the same palette,
// never the card's own frame color, which would make the edge disappear
function shapeColors(id: string, category: Category) {
  const frame = CATEGORY_TONE[category].frame.replace(/^bg-/, "");
  const pool = SHAPES.filter((c) => c !== frame);
  const h = hash(id);
  const first = pool[h % pool.length];
  const rest = pool.filter((c) => c !== first);
  return [first, rest[(h >> 3) % rest.length]];
}

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Left to itself the model redraws the two people from the reference on every
// card, so each move gets its own pair, seeded by id like the colors
const LOOKS = [
  "a woman with dark brown skin and short natural hair",
  "a man with light skin, a buzz cut and a short beard",
  "a woman with light brown skin and a long black braid",
  "a man with deep brown skin and a shaved head",
  "a woman with pale skin, freckles and a short red bob",
  "a man with tan skin and wavy black hair tied back",
  "a woman with medium brown skin and curly hair in a high puff",
  "a man with olive skin, a mustache and short grey hair",
];

function looks(id: string) {
  const h = hash(id);
  const doer = LOOKS[h % LOOKS.length];
  const others = LOOKS.filter((l) => l !== doer);
  return { doer, partner: others[(h >> 4) % others.length] };
}

// Who's on top, so the model doesn't fall back on the reference's pose
function startingPose(position: string) {
  const p = position.toLowerCase();
  if (p.includes("standing")) return "Both people start standing, facing each other.";
  if (p.includes("back")) return "The person in blue starts behind the person in coral pink, chest to their back.";
  if (p.includes("bottom")) return "The person in blue starts underneath, with the person in coral pink on top of them.";
  if (p.includes("top")) return "The person in blue starts on top, with the person in coral pink underneath.";
  return "";
}

// The illustration the style was set from. Sent with every request, since a
// picture pins the look down far better than the words alone.
const REFERENCE = path.resolve("art/style-reference.png");

export function artPrompt(move: ArtSubject) {
  const colors = shapeColors(move.id, move.category)
    .map((c) => `${c} (${HEX[c]})`)
    .join(" and ");
  const steps = move.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`).join("\n");
  // The finish is what makes a move recognizable; the last step usually names it
  const moment = move.steps.at(-1)?.title;
  const people = looks(move.id);

  const scene = [
    `The move: "${move.name}", a jiu-jitsu ${CATEGORY_SINGULAR[move.category].toLowerCase()} that starts from ${move.position}.`,
    move.description,
    steps && `How it's done:\n${steps}`,
    `Freeze the single moment that makes this move recognizable at a glance${
      moment ? `, usually "${moment}"` : ""
    }. The person in blue is doing the move; the person in coral pink is receiving it. ${startingPose(move.position)}`,
    `The person in blue is ${people.doer}. The person in coral pink is ${people.partner}.`,
    `Background shapes: ${colors}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return `The attached image is the style reference. Copy only its drawing style: line weight, flat colors, how faces and gi folds are drawn, and the background motifs. Do not copy its people, their pose or its layout. Draw the move described below as a new scene.\n\n${STYLE}\n\n${scene}\n\n${FRAMING}`;
}

// Image models reached through OpenRouter's chat endpoint. Override with
// ART_MODEL, e.g. google/gemini-3.1-flash-image (see openrouter.ai/models).
const MODEL = process.env.ART_MODEL ?? "openai/gpt-5-image-mini";

const EXT: Record<string, string> = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };

// Draws the move and saves it under uploads/. Returns the file name.
export async function drawArt(move: ArtSubject) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Add OPENROUTER_API_KEY to .env to draw cover art.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Shrimp School" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: artPrompt(move) },
            { type: "image_url", image_url: { url: `data:image/png;base64,${(await readFile(REFERENCE)).toString("base64")}` } },
          ],
        },
      ],
      modalities: ["image", "text"],
      image_config: { aspect_ratio: "1:1" },
    }),
    // Generation usually takes 20–60s
    signal: AbortSignal.timeout(180_000),
  });
  const body = (await res.json().catch(() => null)) as {
    choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
    error?: { message?: string };
  } | null;
  // Images come back as data URLs
  const url = body?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
  const match = /^data:(image\/[\w+.-]+);base64,(.+)$/s.exec(url);
  if (!res.ok || !match) throw new Error(body?.error?.message ?? `The image model returned no picture (${res.status}).`);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const file = `art-${move.id}-${Date.now()}${EXT[match[1]] ?? ".png"}`;
  await writeFile(path.join(UPLOAD_DIR, file), Buffer.from(match[2], "base64"));
  return file;
}
