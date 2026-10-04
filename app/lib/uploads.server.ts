import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

// Uploads can't go in public/: a production build only serves build/client, so
// files added at runtime would 404. They live here and routes/media.ts serves them.
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

const TYPES: Record<string, { kind: "image" | "video"; mime: string }> = {
  ".jpg": { kind: "image", mime: "image/jpeg" },
  ".jpeg": { kind: "image", mime: "image/jpeg" },
  ".png": { kind: "image", mime: "image/png" },
  ".webp": { kind: "image", mime: "image/webp" },
  ".gif": { kind: "image", mime: "image/gif" },
  ".avif": { kind: "image", mime: "image/avif" },
  ".mp4": { kind: "video", mime: "video/mp4" },
  ".m4v": { kind: "video", mime: "video/mp4" },
  ".mov": { kind: "video", mime: "video/quicktime" },
  ".webm": { kind: "video", mime: "video/webm" },
};

export const ACCEPT = Object.keys(TYPES).join(",");

export function mediaType(file: string) {
  return TYPES[path.extname(file).toLowerCase()] ?? null;
}

// The whole file arrives buffered by request.formData(). Fine for a local app;
// very large clips would want a streaming parser.
export async function saveUpload(file: File) {
  const ext = path.extname(file.name).toLowerCase();
  const type = TYPES[ext];
  if (!type) throw new Error(`${file.name} isn't a photo or video this app can show.`);
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { file: name, kind: type.kind };
}

// Resolve a stored name to a path inside UPLOAD_DIR, or null if it tries to leave it
export function uploadPath(name: string) {
  const full = path.resolve(UPLOAD_DIR, name);
  return full.startsWith(UPLOAD_DIR + path.sep) ? full : null;
}

export async function readUpload(name: string) {
  const full = uploadPath(name);
  if (!full) return null;
  try {
    const info = await stat(full);
    return { full, size: info.size };
  } catch {
    return null;
  }
}

export async function deleteUpload(name: string) {
  const full = uploadPath(name);
  if (full) await rm(full, { force: true });
}
