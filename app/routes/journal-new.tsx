import { data, redirect } from "react-router";
import { JournalForm } from "~/components/journal-form";
import { Headline, Heavy, Thin } from "~/components/ui";
import { db, journalEntries } from "~/db/index.server";
import { moveOptions } from "~/lib/data.server";
import { parseEntry } from "~/lib/forms.server";
import { today } from "~/lib/moves";
import type { PageHandle } from "./layout";
import type { Route } from "./+types/journal-new";

export const handle: PageHandle = { hideSticker: true };

export const meta: Route.MetaFunction = () => [{ title: "Log a roll · Shrimp School" }];

export async function loader({ request }: Route.LoaderArgs) {
  const moves = await moveOptions();
  const wanted = new URL(request.url).searchParams.get("move");
  return { moves, moveId: moves.some((m) => m.id === wanted) ? wanted! : "" };
}

export async function action({ request }: Route.ActionArgs) {
  const parsed = parseEntry(await request.formData());
  if (parsed.errors) return data({ errors: parsed.errors }, { status: 400 });
  await db.insert(journalEntries).values(parsed.values);
  return redirect("/journal");
}

export default function NewEntry({ loaderData, actionData }: Route.ComponentProps) {
  const { moves, moveId } = loaderData;
  return (
    <div className="mx-auto max-w-3xl">
      <Headline kicker="Straight off the mat, while you still remember.">
        <Heavy>Log a</Heavy> <Thin>Roll</Thin>
      </Headline>
      <div className="mt-12 rotate-[0.6deg]">
        <JournalForm
          moves={moves}
          defaults={{ moveId, date: today() }}
          errors={actionData?.errors}
          submitLabel="Save entry"
          cancelTo={moveId ? `/moves/${moveId}` : "/journal"}
        />
      </div>
    </div>
  );
}
