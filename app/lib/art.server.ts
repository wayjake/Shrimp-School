// Cover illustrations drawn by an image model (via OpenRouter) from a move's own content.
// Runs under plain Node too (scripts/art.ts), so imports are relative .ts.
//
// The prompt is two blocks. The style lock never changes, so every card looks
// like one set: it's lifted from the reference illustration, plus the rules
// from the imagegen-frontend-web skill that apply to a single picture —
// Palette Discipline (a fixed palette, named by hex), Multi-Image Consistency
// (same world and figures, only the composition varies) and the anti-slop list
// (no gradients, glow or neon). The scene block is the move itself.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { list } from "@vercel/blob";
import { CATEGORY_SINGULAR, CATEGORY_TONE, type ArtCast, type Category, type Step } from "./moves.ts";
import { storeFile } from "./uploads.server.ts";

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
  // Optional pose correction from the move form, for when the text above isn't enough
  artNote?: string | null;
  // Draw the two real people from art/people/ instead of made-up ones
  artCast?: ArtCast | null;
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
- Behind the people, large flat geometric shapes with crisp edges, placed and colored exactly as described below. Scatter three or four small crisp white four-point sparkles and a few small white dots, with no halo around them.
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

// Where the shapes sit, seeded like the colors. Naming each shape's color and
// place matters: given only two colors, the model keeps the reference's red
// half-moon top left and recolors the disc. Its own hash so layout and colors
// vary independently.
function shapeLayout(id: string, category: Category) {
  const h = hash(`${id}:layout`);
  const [first, second] = shapeColors(id, category);
  const [a, b] = [first, second].map((c) => `${c} (${HEX[c]})`);
  // A red half-moon top left is the reference's own layout, so never that
  const corner = h % 2 || first === "red" ? "top-right" : "top-left";
  const discSide = (h >> 1) % 2 ? "right" : "left";
  const halfMoon = `high in the ${corner} corner, flat edge down`;
  const disc = `large and low on the ${discSide}, partly behind the people and cut off by the edge of the image`;
  switch ((h >> 2) % 4) {
    case 0:
      return `Background shapes: only one, a half-moon in ${a}, ${halfMoon}. No disc.`;
    case 1:
      return `Background shapes: only one, a full disc in ${a}, ${disc}. No half-moon.`;
    default:
      return `Background shapes: exactly two. The half-moon is ${a}, ${halfMoon}. The disc is ${b}, ${disc}.`;
  }
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

// The trainer and student from the class clips. Stills pulled from the clips
// are sent along so the cartoon keeps their likeness; the words back them up.
// Close-ups first, then a fuller shot.
const PEOPLE: Record<ArtCast, { look: string; photos: string[] }> = {
  trainer: {
    look: "a stocky, broad-shouldered middle-aged man with light olive skin, a completely shaved bald head and a full, thick dark-brown beard going grey",
    photos: ["art/people/bearded-closeup.jpg", "art/people/bearded-face-kneeling.jpg"],
  },
  student: {
    look: "a lean, younger man with fair skin, short light-brown hair cut close at the sides and a clean-shaven face",
    photos: ["art/people/light-hair-closeup.jpg", "art/people/light-hair-facing-camera.jpg"],
  },
};

// The two of them side by side, for relative height and build
const PAIR_PHOTO = "art/people/both-standing-black-gis.jpg";

function castFor(doer: ArtCast) {
  const partner: ArtCast = doer === "trainer" ? "student" : "trainer";
  return { doer: PEOPLE[doer], partner: PEOPLE[partner] };
}

// Everything attached after the style reference, in order, so the prompt can
// point at each by number
function castPhotos(doer: ArtCast) {
  const c = castFor(doer);
  return [...c.doer.photos, ...c.partner.photos, PAIR_PHOTO];
}

function castNote(doer: ArtCast) {
  const c = castFor(doer);
  const n = c.doer.photos.length;
  const range = (from: number, count: number) => (count === 1 ? `Image ${from}` : `Images ${from} to ${from + count - 1}`);
  // Image 1 is the style reference
  return `The other attached images are photos of the two real people to draw. ${range(2, n)} show the person who does the move, in the blue gi: ${c.doer.look}. ${range(2 + n, c.partner.photos.length)} show their partner, in the coral pink gi: ${c.partner.look}. Image ${2 + n + c.partner.photos.length} shows the two of them standing together, for their relative height and build. Draw them as cartoons in the reference's style, but keep each person's real likeness: head shape, hairline, facial hair, build and skin tone. Take nothing else from the photos: not their gi colors, patches, logos or lettering, and not the room.`;
}

// Where each body is, spelled out, so the model doesn't fall back on the
// reference's pose. "Top" and "bottom" alone weren't enough: blue kept ending
// up on top in closed guard. Order matters, since "back" and "guard" overlap.
function startingPose(position: string) {
  const p = position.toLowerCase();
  const bottom = p.includes("bottom");
  const top = p.includes("top");
  const [under, over] = bottom ? ["blue", "coral pink"] : ["coral pink", "blue"];

  if (p.includes("standing"))
    return "The position: both people are on their feet on the mat, facing each other.";
  if (p.includes("back"))
    return "The position: back control. The person in blue is behind the person in coral pink, chest pressed to their back, both sitting on the mat facing the same way. Blue's legs wrap around pink's waist from behind with the heels hooked inside pink's thighs, and blue's arms wrap around pink's upper body from behind.";
  if (p.includes("side control") && (bottom || top))
    return `The position: side control. The person in ${under} lies on their back on the mat. The person in ${over} lies across them from the side, chest to chest at a right angle, knees on the mat by their hip. Neither person is between the other's legs.${
      bottom ? " Blue is underneath the whole time, never on top." : ""
    }`;
  if (p.includes("mount") && (bottom || top))
    return `The position: mount. The person in ${under} lies flat on their back on the mat. The person in ${over} sits astride their stomach, one knee on the mat on each side of their body.${
      bottom ? " Blue is underneath, never on top." : ""
    }`;
  if (p.includes("half guard") && (bottom || top))
    return `The position: half guard. The person in ${under} is on their back or side on the mat, legs tangled around one of the other person's legs. The person in ${over} is on top, on their knees, chest leaning over them.`;
  if (p.includes("guard") && (bottom || top))
    return `The position: closed guard. The person in ${under} is on their back on the mat with both legs wrapped around the waist of the person in ${over}, ankles crossed behind their back. The person in ${over} kneels upright between those legs.${
      bottom
        ? " Blue is underneath the whole time and never on top; blue may sit up from the mat to reach over pink, but blue's back and hips stay on the mat."
        : ""
    }`;
  if (bottom) return "The person in blue is underneath, with the person in coral pink on top of them.";
  if (top) return "The person in blue is on top, with the person in coral pink underneath.";
  return "";
}

// Which instant to draw depends on the kind of move: a takedown reads while
// it's still standing and an escape during the hip movement, not after either
// is done. Each category finds the step to show by its title (patterns in order
// of preference, so "Shrimp away" beats an earlier "Bridge"), then its detail,
// falling back to the last step (submission, control) or the middle one.
const MOMENT: Record<Category, { find?: RegExp[]; skip?: RegExp; fallback: "last" | "middle"; say: string }> = {
  submission: {
    fallback: "last",
    say: "Draw the finish, with the submission locked on.",
  },
  control: {
    fallback: "last",
    say: "Draw the position fully held.",
  },
  takedown: {
    find: [/behind the knee|lift/i, /shoot|shot|penetrat|drive/i],
    skip: /finish|land|on top|settle/i,
    fallback: "middle",
    say: "Draw it mid-shot, while both people are still on their feet: the person in blue has dropped their level, head tight against the side of the person in coral pink, arms wrapped behind pink's knees, driving forward or lifting. Pink is still upright, off balance. Nobody is lying on the mat yet.",
  },
  escape: {
    find: [/shrimp|hip escape|hips away/i, /bridge|upa/i],
    fallback: "middle",
    say: "Draw it during the key hip movement, while the person in blue is still underneath and the escape isn't finished: blue's hips are visibly moving, and their arms work against the person in coral pink as the step describes.",
  },
  sweep: {
    find: [/sweep|scissor|kick|elevat|tip|off.balance/i],
    fallback: "middle",
    say: "Draw it mid-sweep: the person in coral pink is tipping over, off balance, and hasn't landed yet.",
  },
  pass: {
    find: [/slice|cut|through|pass|step over/i],
    fallback: "middle",
    say: "Draw it mid-pass: the person in blue is cutting past the legs of the person in coral pink and hasn't settled yet.",
  },
};

function keyStep(category: Category, steps: Step[]) {
  const m = MOMENT[category];
  const candidates = steps.filter((s) => !m.skip?.test(s.title));
  for (const field of ["title", "detail"] as const)
    for (const re of m.find ?? []) {
      const found = candidates.find((s) => re.test(s[field]));
      if (found) return found;
    }
  return m.fallback === "last" ? steps.at(-1) : steps[Math.floor((steps.length - 1) / 2)];
}

// The illustration the style was set from. Sent with every request, since a
// picture pins the look down far better than the words alone.
const REFERENCE = "art/style-reference.png";

// Reference images live in art/. The photos of real people in art/people/ are
// kept out of git, since the repo is public, and a deploy may not bundle files
// read at runtime anyway. So `npm run blob:upload` copies them to Blob under
// the same paths (with the random suffix, so the URLs can't be guessed), and
// this falls back to Blob when the file isn't on disk.
async function readArtFile(rel: string) {
  try {
    return await readFile(path.resolve(rel));
  } catch {}
  const { dir, name, ext } = path.parse(rel);
  const prefix = `${dir}/${name}-`;
  const { blobs } = await list({ prefix });
  const hit = blobs.find((b) => b.pathname.endsWith(ext));
  if (!hit) throw new Error(`${rel} isn't on disk or in Blob. Run npm run blob:upload where it is.`);
  const res = await fetch(hit.url);
  if (!res.ok) throw new Error(`Couldn't fetch ${rel} from Blob (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

export function artPrompt(move: ArtSubject) {
  const steps = move.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`).join("\n");
  const step = keyStep(move.category, move.steps);
  const people = move.artCast
    ? { doer: castFor(move.artCast).doer.look, partner: castFor(move.artCast).partner.look }
    : looks(move.id);

  // A note is the whole picture: alongside the steps, the position text and the
  // moment, it was outvoted by them (a kimura drawn from the fall-back step)
  const scene = [
    `The move: "${move.name}", a jiu-jitsu ${CATEGORY_SINGULAR[move.category].toLowerCase()} that starts from ${move.position}.`,
    move.description,
    !move.artNote && steps && `How it's done:\n${steps}`,
    "The person in blue is doing the move; the person in coral pink is receiving it.",
    move.artNote
      ? `Draw exactly this moment: ${move.artNote}`
      : [startingPose(move.position), MOMENT[move.category].say, step && `This is the step "${step.title}": ${step.detail}`]
          .filter(Boolean)
          .join(" "),
    `The person in blue is ${people.doer}. The person in coral pink is ${people.partner}.`,
    shapeLayout(move.id, move.category),
  ]
    .filter(Boolean)
    .join("\n\n");

  const reference = `The first attached image is the style reference. Copy only its drawing style: line weight, flat colors, how faces and gi folds are drawn, and the kind of background motifs (flat discs, half-moons, sparkles). Do not copy its people, their pose, its layout, or the colors and places of its shapes. Draw the move described below as a new scene.`;
  return [reference, move.artCast && castNote(move.artCast), STYLE, scene, FRAMING].filter(Boolean).join("\n\n");
}

// Image models reached through OpenRouter's chat endpoint. Override with
// ART_MODEL, e.g. google/gemini-3.1-flash-image (see openrouter.ai/models).
const MODEL = process.env.ART_MODEL ?? "openai/gpt-5-image-mini";
// Moves drawn as the real people go to a model that can take likeness from
// photos. Given the photos, gpt-5-image-mini ignored the prompt altogether and
// returned unrelated pictures (a stock portrait, a slogan poster), while
// Gemini kept both the style and the likeness. ART_CAST_MODEL overrides it.
const CAST_MODEL = process.env.ART_CAST_MODEL ?? "google/gemini-3.1-flash-image";

const EXT: Record<string, string> = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };

// Draws the move and stores it (lib/uploads.server.ts). Returns the reference for moves.art.
export async function drawArt(move: ArtSubject) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Add OPENROUTER_API_KEY to .env to draw cover art.");

  const photos = move.artCast ? castPhotos(move.artCast) : [];
  const images = [
    { file: REFERENCE, type: "image/png" },
    ...photos.map((f) => ({ file: f, type: "image/jpeg" })),
  ];
  const attached = await Promise.all(
    images.map(async (img) => ({
      type: "image_url",
      image_url: { url: `data:${img.type};base64,${(await readArtFile(img.file)).toString("base64")}` },
    })),
  );

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Shrimp School" },
    body: JSON.stringify({
      model: move.artCast ? CAST_MODEL : MODEL,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: artPrompt(move) }, ...attached],
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

  return storeFile(`art-${move.id}-${Date.now()}${EXT[match[1]] ?? ".png"}`, Buffer.from(match[2], "base64"), match[1]);
}
