import { data, redirect } from "react-router";
import { JournalForm } from "~/components/journal-form";
import { ArrowLink, Headline, Heavy, Thin } from "~/components/ui";
import { db, journalEntries } from "~/db/index.server";
import { addToLibrary, moveOptions } from "~/lib/data.server";
import { parseEntry } from "~/lib/forms.server";
import { today } from "~/lib/moves";
import type { PageHandle } from "./layout";
import type { Route } from "./+types/journal-new";

export const handle: PageHandle = { hideSticker: true };

export const meta: Route.MetaFunction = () => [{ title: "Log a roll · Shrimp School" }];

export async function loader({ request }: Route.LoaderArgs) {
  const wanted = new URL(request.url).searchParams.get("move");
  const moves = await moveOptions(wanted);
  return { moves, moveId: moves.some((m) => m.id === wanted) ? wanted! : "" };
}

export async function action({ request }: Route.ActionArgs) {
  const parsed = parseEntry(await request.formData());
  if (parsed.errors) return data({ errors: parsed.errors }, { status: 400 });
  await db.insert(journalEntries).values(parsed.values);
  // Going for it on the mat means you're working on it
  await addToLibrary(parsed.values.moveId);
  return redirect("/journal");
}

export default function NewEntry({ loaderData, actionData }: Route.ComponentProps) {
  const { moves, moveId } = loaderData;
  return (
    <div className="mx-auto max-w-3xl">
      <Headline kicker="Straight off the mat, while you still remember.">
        <Heavy>Log a</Heavy> <Thin>Roll</Thin>
      </Headline>
      {moves.length > 0 ? (
        <div className="mt-12 rotate-[0.6deg]">
          <JournalForm
            moves={moves}
            defaults={{ moveId, date: today() }}
            errors={actionData?.errors}
            submitLabel="Save entry"
            cancelTo={moveId ? `/moves/${moveId}` : "/journal"}
          />
        </div>
      ) : (
        <div className="mx-auto mt-16 max-w-lg border-4 border-dashed border-ink/25 px-6 py-12 text-center">
          <p className="font-display text-5xl">No moves to log</p>
          <p className="mt-3 font-serif text-2xl leading-snug">
            The journal logs the moves in your library. Pick the ones you&rsquo;re working on first.
          </p>
          <ArrowLink to="/catalog" className="mt-8">
            Browse the catalog
          </ArrowLink>
        </div>
      )}
    </div>
  );
}
