import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

// Photos, clips and cover art live in Vercel Blob when BLOB_STORE_ID (or a
// BLOB_READ_WRITE_TOKEN) is set, which it must be anywhere the shared Turso DB
// is used, or a file saved on one machine is missing everywhere else. With a
// store id the SDK authenticates by OIDC: on Vercel the token is in the
// environment, and locally @vercel/oidc fetches one through your `vercel login`
// and the project link in .vercel/project.json. The DB then holds each file's full
// Blob URL. Without the token they fall back to UPLOAD_DIR and the DB holds a
// bare name that routes/media.ts serves. (Not public/: a production build only
// serves build/client, so files added at runtime would 404.)
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

const useBlob = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
const isUrl = (ref: string) => /^https?:\/\//.test(ref);

// Store bytes under a name and return the reference to keep in the DB
export async function storeFile(name: string, body: Buffer, contentType: string) {
  if (useBlob()) {
    // The random suffix keeps the public URL unguessable
    const blob = await put(name, body, { access: "public", contentType, addRandomSuffix: true });
    return blob.url;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), body);
  return name;
}

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

// The whole file arrives buffered by request.formData(). Fine locally, but on
// Vercel a request body over 4.5 MB is refused before it gets here.
export async function saveUpload(file: File) {
  const ext = path.extname(file.name).toLowerCase();
  const type = TYPES[ext];
  if (!type) throw new Error(`${file.name} isn't a photo or video this app can show.`);
  const name = `${crypto.randomUUID()}${ext}`;
  return { file: await storeFile(name, Buffer.from(await file.arrayBuffer()), type.mime), kind: type.kind };
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

export async function deleteUpload(ref: string) {
  if (isUrl(ref)) {
    if (useBlob()) await del(ref);
    return;
  }
  const full = uploadPath(ref);
  if (full) await rm(full, { force: true });
}
