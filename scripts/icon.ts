// Draws the app icon with the same image model as the cover art, then cuts the
// favicon, Apple touch icon and manifest sizes from it with macOS `sips`.
//
//   npm run icon               draw a new art/icon.png and rebuild every size
//   npm run icon -- --sizes    rebuild the sizes from the existing art/icon.png
//   npm run icon -- --prompt   print the prompt without drawing
//
// The master stays in art/ next to the style reference; only the sizes go in public/.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

try {
  process.loadEnvFile(".env");
} catch {}

const MASTER = path.resolve("art/icon.png");
const REFERENCE = path.resolve("art/style-reference.png");
const MODEL = process.env.ART_MODEL ?? "openai/gpt-5-image-mini";

// Android masks installed icons to a circle or squircle and iOS rounds the
// corners itself, so the picture is full bleed with the subject inside the
// middle of the square (the maskable safe zone).
const PROMPT = `The attached image is the style reference. Copy only its drawing style: bold even black outlines, flat fills, the flat white four-point sparkles. Do not copy its people or layout.

Draw an app icon for "Shrimp School", a jiu-jitsu learning app.

- The subject: one friendly cartoon shrimp, curled in a C shape like a jiu-jitsu hip escape ("shrimping"), with a happy simple face and two small eyes. Its shell is a warm orange (#ec6a2c) with a few short black lines for the segments. It wears a black jiu-jitsu belt tied around its middle with the knot and two short belt tails showing.
- Background: one flat royal blue (#1636f2) filling the entire square edge to edge, with no border, frame, vignette or rounded corners. Behind the shrimp, one large flat pink disc (#ef86cd) with a crisp edge. Two small crisp white four-point sparkles near the shrimp.
- Composition: square. The shrimp and the disc sit centered and stay entirely inside the middle 60% of the image; the outer edges are plain blue background only, because the icon gets cropped to a circle.
- Bold, simple shapes that still read at 48 pixels. Flat colors only: no gradients, no texture, no glow, no 3D, no drop shadow, no transparency.
- No text, letters, numbers or logos anywhere.`;

// Published path → size in pixels
const SIZES: Record<string, number> = {
  "icon-512.png": 512,
  "icon-192.png": 192,
  "apple-touch-icon.png": 180,
  "favicon-32.png": 32,
};

async function draw() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Add OPENROUTER_API_KEY to .env to draw the icon.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Shrimp School" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: `data:image/png;base64,${(await readFile(REFERENCE)).toString("base64")}` } },
          ],
        },
      ],
      modalities: ["image", "text"],
      image_config: { aspect_ratio: "1:1" },
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const body = (await res.json().catch(() => null)) as {
    choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
    error?: { message?: string };
  } | null;
  const url = body?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
  const match = /^data:(image\/[\w+.-]+);base64,(.+)$/s.exec(url);
  if (!res.ok || !match) throw new Error(body?.error?.message ?? `The image model returned no picture (${res.status}).`);

  // Whatever format comes back, the master is a PNG
  const raw = `${MASTER}.download`;
  await writeFile(raw, Buffer.from(match[2], "base64"));
  execFileSync("sips", ["-s", "format", "png", raw, "--out", MASTER], { stdio: "ignore" });
  execFileSync("rm", [raw]);
}

function sizes() {
  for (const [file, px] of Object.entries(SIZES))
    execFileSync("sips", ["-s", "format", "png", "-z", `${px}`, `${px}`, MASTER, "--out", path.resolve("public", file)], {
      stdio: "ignore",
    });
  execFileSync("sips", ["-s", "format", "ico", "-z", "32", "32", MASTER, "--out", path.resolve("public/favicon.ico")], {
    stdio: "ignore",
  });
}

const args = process.argv.slice(2);
if (args.includes("--prompt")) {
  console.log(PROMPT);
} else {
  if (!args.includes("--sizes")) {
    console.log(`Drawing art/icon.png with ${MODEL}…`);
    await draw();
  }
  sizes();
  console.log(`Wrote public/${[...Object.keys(SIZES), "favicon.ico"].join(", public/")}`);
}
