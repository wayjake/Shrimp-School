import { data, redirect } from "react-router";
import { MoveForm } from "~/components/move-form";
import { Headline, Heavy, Thin } from "~/components/ui";
import { db, moves } from "~/db/index.server";
import { attachMedia, freeMoveId, startMoveArt } from "~/lib/data.server";
import { parseMove, uploadedFiles } from "~/lib/forms.server";
import { ACCEPT } from "~/lib/uploads.server";
import type { Route } from "./+types/move-new";

export const meta: Route.MetaFunction = () => [{ title: "Add a move · Shrimp School" }];

export function loader() {
  return { accept: ACCEPT };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const parsed = parseMove(form);
  if (parsed.errors) return data({ errors: parsed.errors }, { status: 400 });

  const id = await freeMoveId(parsed.values.name);
  await db.insert(moves).values({ id, ...parsed.values });
  const files = uploadedFiles(form, "media");
  // Draws in the background and the move page shows it arriving. Skipped when
  // there's media, which covers the art anyway.
  if (!files.length) startMoveArt(id);
  try {
    await attachMedia(id, files);
  } catch {
    // The move is saved; send them to fix the upload rather than lose their typing
    return redirect(`/moves/${id}/edit?upload=failed`);
  }
  return redirect(`/moves/${id}`);
}

export default function NewMove({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <Headline kicker="Write it down the way your coach showed it.">
        <Heavy>New</Heavy> <Thin>Move</Thin>
      </Headline>
      <div className="mt-12 -rotate-[0.5deg]">
        <MoveForm accept={loaderData.accept} errors={actionData?.errors} submitLabel="Add to library" cancelTo="/" />
      </div>
    </div>
  );
}
