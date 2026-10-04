import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { mediaType, readUpload } from "~/lib/uploads.server";
import type { Route } from "./+types/media";

// Serves uploads/. Answers Range requests, which Safari needs before it will
// play a <video> at all and which lets every browser seek without the whole file.
export async function loader({ params, request }: Route.LoaderArgs) {
  const type = mediaType(params.file);
  const upload = type && (await readUpload(params.file));
  if (!type || !upload) throw new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": type.mime,
    "Accept-Ranges": "bytes",
    // Names are random UUIDs and never reused, so the bytes behind one never change
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("Range") ?? "");
  if (range && (range[1] || range[2])) {
    const size = upload.size;
    // "bytes=-500" means the last 500 bytes
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    const stream = Readable.toWeb(createReadStream(upload.full, { start, end })) as ReadableStream;
    return new Response(stream, { status: 206, headers });
  }

  headers.set("Content-Length", String(upload.size));
  const stream = Readable.toWeb(createReadStream(upload.full)) as ReadableStream;
  return new Response(stream, { headers });
}
