import { and, eq } from "drizzle-orm";
import { data, Form, redirect, useFetcher } from "react-router";
import { mediaUrl } from "~/components/move-card";
import { MoveForm } from "~/components/move-form";
import { Headline, Heavy, Thin } from "~/components/ui";
import { db, journalEntries, libraryMoves, moveMedia, moves } from "~/db/index.server";
import { attachMedia, getMove, notFound, startMoveArt } from "~/lib/data.server";
import { parseMove, uploadedFiles } from "~/lib/forms.server";
import type { Category } from "~/lib/moves";
import { ACCEPT, deleteUpload } from "~/lib/uploads.server";
import type { Route } from "./+types/move-edit";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData ? `Edit ${loaderData.move.name} · Shrimp School` : "Shrimp School" },
];

export async function loader({ params, request }: Route.LoaderArgs) {
  const move = await getMove(params.moveId);
  if (!move) notFound("move");
  const uploadFailed = new URL(request.url).searchParams.get("upload") === "failed";
  return { move, accept: ACCEPT, uploadFailed };
}

export async function action({ request, params }: Route.ActionArgs) {
  const id = params.moveId;
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "delete-media") {
    const mediaId = String(form.get("mediaId"));
    const [row] = await db
      .select()
      .from(moveMedia)
      .where(and(eq(moveMedia.id, mediaId), eq(moveMedia.moveId, id)));
    if (row) {
      await db.delete(moveMedia).where(eq(moveMedia.id, row.id));
      await deleteUpload(row.file);
    }
    return { ok: true };
  }

  if (intent === "delete-move") {
    const media = await db.select().from(moveMedia).where(eq(moveMedia.moveId, id));
    // Explicit rather than trusting ON DELETE CASCADE, which SQLite skips unless
    // foreign_keys is switched on for the connection
    await db.delete(journalEntries).where(eq(journalEntries.moveId, id));
    await db.delete(moveMedia).where(eq(moveMedia.moveId, id));
    await db.delete(libraryMoves).where(eq(libraryMoves.moveId, id));
    const [move] = await db.select({ art: moves.art }).from(moves).where(eq(moves.id, id));
    await db.delete(moves).where(eq(moves.id, id));
    await Promise.all([...media.map((m) => m.file), move?.art].filter((f) => f != null).map(deleteUpload));
    return redirect("/");
  }

  const parsed = parseMove(form);
  if (parsed.errors) return data({ errors: parsed.errors }, { status: 400 });
  const before = await getMove(id);
  if (!before) notFound("move");
  await db
    .update(moves)
    .set({ ...parsed.values, updatedAt: new Date() })
    .where(eq(moves.id, id));
  const files = uploadedFiles(form, "media");
  // Redraw the cover when anything it's drawn from changed, unless a photo or
  // clip covers the card anyway (same rule as a new move)
  const v = parsed.values;
  const artChanged =
    v.name !== before.name ||
    v.position !== before.position ||
    v.category !== before.category ||
    v.description !== before.description ||
    v.artNote !== before.artNote ||
    v.artCast !== before.artCast ||
    JSON.stringify(v.steps) !== JSON.stringify(before.steps);
  if (artChanged && !before.media.length && !files.length) startMoveArt(id);
  try {
    await attachMedia(id, files);
  } catch (e) {
    return data(
      { errors: { media: e instanceof Error ? e.message : "That file didn't upload. Try again." } },
      { status: 400 },
    );
  }
  return redirect(`/moves/${id}`);
}

export default function EditMove({ loaderData, actionData }: Route.ComponentProps) {
  const { move, accept, uploadFailed } = loaderData;
  const errors = actionData && "errors" in actionData ? actionData.errors : undefined;
  const mediaError = errors?.media ?? (uploadFailed ? "The move saved, but a file didn't upload. Try adding it again." : undefined);

  return (
    <div className="mx-auto max-w-3xl">
      <Headline kicker={move.name}>
        <Heavy>Edit</Heavy> <Thin>Move</Thin>
      </Headline>

      {move.media.length > 0 && (
        <section className="mt-12">
          <h2 className="font-label text-sm">Photos and clips</h2>
          <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {move.media.map((m) => (
              <MediaTile key={m.id} item={m} />
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 rotate-[0.5deg]">
        <MoveForm
          defaults={{ ...move, category: move.category as Category }}
          errors={{ ...errors, media: mediaError }}
          accept={accept}
          submitLabel="Save move"
          cancelTo={`/moves/${move.id}`}
        />
      </div>

      <Form
        method="post"
        className="mt-10 text-center"
        onSubmit={(e) => {
          if (!confirm(`Delete ${move.name} from the catalog, with its photos and clips and every journal entry for it?`)) e.preventDefault();
        }}
      >
        <button name="intent" value="delete-move" className="font-label cursor-pointer text-sm text-red underline-offset-4 hover:underline">
          Delete from the catalog
        </button>
      </Form>
    </div>
  );
}

function MediaTile({ item }: { item: Route.ComponentProps["loaderData"]["move"]["media"][number] }) {
  const fetcher = useFetcher();
  const removing = fetcher.state !== "idle";
  return (
    <li className={`relative aspect-square overflow-hidden bg-ink ${removing ? "opacity-40" : ""}`}>
      {item.kind === "image" ? (
        <img src={mediaUrl(item.file)} alt="" className="size-full object-cover" />
      ) : (
        <video src={`${mediaUrl(item.file)}#t=0.5`} className="size-full object-cover" muted preload="metadata" />
      )}
      <fetcher.Form method="post" className="absolute top-1.5 right-1.5">
        <input type="hidden" name="mediaId" value={item.id} />
        <button
          name="intent"
          value="delete-media"
          disabled={removing}
          className="font-label cursor-pointer bg-white px-2 py-1 text-xs text-ink hover:bg-red hover:text-white"
        >
          Remove
        </button>
      </fetcher.Form>
    </li>
  );
}
