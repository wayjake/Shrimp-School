import { eq } from "drizzle-orm";
import { data, Form, redirect } from "react-router";
import { JournalForm } from "~/components/journal-form";
import { Headline, Heavy, Thin } from "~/components/ui";
import { db, journalEntries } from "~/db/index.server";
import { moveOptions, notFound } from "~/lib/data.server";
import { parseEntry } from "~/lib/forms.server";
import type { PageHandle } from "./layout";
import type { Route } from "./+types/journal-edit";

export const handle: PageHandle = { hideSticker: true };

export const meta: Route.MetaFunction = () => [{ title: "Edit entry · Shrimp School" }];

export async function loader({ params }: Route.LoaderArgs) {
  const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, params.entryId));
  if (!entry) notFound("journal entry");
  // Keep the entry's own move on offer even if it's left your library
  return { entry, moves: await moveOptions(entry.moveId) };
}

export async function action({ request, params }: Route.ActionArgs) {
  const form = await request.formData();
  if (form.get("intent") === "delete") {
    await db.delete(journalEntries).where(eq(journalEntries.id, params.entryId));
    return redirect("/journal");
  }
  const parsed = parseEntry(form);
  if (parsed.errors) return data({ errors: parsed.errors }, { status: 400 });
  await db.update(journalEntries).set(parsed.values).where(eq(journalEntries.id, params.entryId));
  return redirect("/journal");
}

export default function EditEntry({ loaderData, actionData }: Route.ComponentProps) {
  const { entry, moves } = loaderData;
  return (
    <div className="mx-auto max-w-3xl">
      <Headline kicker="Fix the count, or add what you remembered later.">
        <Heavy>Edit</Heavy> <Thin>Entry</Thin>
      </Headline>
      <div className="mt-12 -rotate-[0.6deg]">
        <JournalForm
          moves={moves}
          defaults={entry}
          errors={actionData && "errors" in actionData ? actionData.errors : undefined}
          submitLabel="Save changes"
          cancelTo="/journal"
        />
      </div>
      <Form
        method="post"
        className="mt-10 text-center"
        onSubmit={(e) => {
          if (!confirm("Delete this journal entry? This can't be undone.")) e.preventDefault();
        }}
      >
        <button name="intent" value="delete" className="font-label cursor-pointer text-sm text-red underline-offset-4 hover:underline">
          Delete this entry
        </button>
      </Form>
    </div>
  );
}
