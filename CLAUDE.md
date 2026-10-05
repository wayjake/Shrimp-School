# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Shrimp School

A local, single-user app for learning jiu-jitsu moves (name, starting position, description, ordered steps, photos and clips) and journaling how they land in class, open mat and competition (attempts, landed, a 1–5 feel rating, notes). The look follows extrafazant.nl: condensed Archivo against Instrument Serif in the same headline, Mr Dafoe script wordmark, thick colored card frames, white box nav.

## Stack

React Router 8 framework mode (SSR), Tailwind v4 (`app/app.css` `@theme`), Drizzle on Turso (remote libSQL) via `@libsql/client`. No auth.

## Commands

- `npm run typecheck`: the standard check. There are no tests, and `README.md` is the stock template.
- `npm run db:push`: apply `app/db/schema.ts` to the Turso DB.
- `npm run art`: draw cover art for every move that has none. Pass move ids to redraw those, and `--prompt <id>` to print the prompt without drawing.
- `npm run import -- moves.json`: add moves from a JSON array (the `parseMove` fields plus `artNote` and `video`, a path to the source clip). Each clip is re-encoded with ffmpeg to a 1080p H.264 MP4 in `uploads/`, which also strips the phone's metadata, and attached as `move_media`. It encodes before it inserts and skips ids that already exist, so a failed run can simply be re-run.
- `npm run db:seed`: add the nine starter moves. It never overwrites existing rows. Add `-- --examples` to insert example journal entries (ids `example-*`), and `-- --remove-examples` to delete them again.

## How it fits together

- Routes stay thin. Queries live in `app/lib/data.server.ts`, and form parsing and validation live in `app/lib/forms.server.ts` (`parseMove`, `parseEntry`). Those return `{ errors }` or `{ values }`, and an action returns the errors with a 400 so the form shows them.
- A route with more than one form tells them apart by a submitted `intent` field, e.g. `delete-media`, `delete-move` and `draw-art`.
- Deleting a move removes its journal entries, media rows and files in code, because SQLite doesn't enforce `ON DELETE CASCADE` unless foreign keys are switched on for the connection.
- `scripts/*.ts` run under plain Node with type stripping. They can't import `app/db/index.server.ts` (extensionless imports, `~/` alias), so each builds its own Drizzle instance from `createDbClient()` in `app/db/client.ts`, which imports nothing local. Anything else they share with the app must use relative `.ts` imports.

## Where things live

- DB: Turso, from `TURSO_URL` and `TURSO_KEY` in `.env`. `app/db/client.ts` loads `.env` itself, because Vite doesn't put it into `process.env` for server code. `drizzle.config.ts` uses the `turso` dialect, so `npm run db:push` goes to the remote DB.
- Uploads: `uploads/` (override with `UPLOAD_DIR`), served by `app/routes/media.ts`, which supports Range requests (Safari needs them for video). They're kept out of `public/` because a production build only serves `build/client`.
- `app/lib/moves.ts` holds the categories, settings, and hit-rate math. The seed script imports it under plain Node, so it and `app/db/schema.ts` use relative `.ts` imports, not `~/`.
- Each category has one frame color (`CATEGORY_TONE`). Hit rate is total landed ÷ total attempts, not an average of per-entry percentages.
- Route modules set `handle: PageHandle` (`app/routes/layout.tsx`) for the dark journal page and to hide the floating sticker on forms.
- Cover art: `app/lib/art.server.ts` builds the prompt from the move's name, position, description and steps, adds a fixed style lock and `art/style-reference.png`, and asks OpenRouter for an image (`OPENROUTER_API_KEY` in `.env`; `ART_MODEL` overrides the default `openai/gpt-5-image-mini`). The file goes in `uploads/` and its name in `moves.art`, never `move_media`. New moves draw in the background. The move page has a Redraw button and polls while a draw runs. Card covers fall back in this order: photo, art, clip, then the `MoveArt` SVG. Art beats a clip's paused frame, so the move page keeps the Redraw button (with a small copy of the art) even when a clip fills the frame.
