import { CategoryFilter, filterByCategory } from "~/components/category-filter";
import { LibraryToggle } from "~/components/library-toggle";
import { MoveCard } from "~/components/move-card";
import { BoxLink, Headline, Heavy, Thin } from "~/components/ui";
import { handleLibraryIntent, listMoveCards } from "~/lib/data.server";
import { useRememberList } from "~/lib/last-list";
import type { Route } from "./+types/catalog";

export const meta: Route.MetaFunction = () => [{ title: "Catalog · Shrimp School" }];

// Every move, written up once, for you to pick from
export async function loader({ request }: Route.LoaderArgs) {
  const type = new URL(request.url).searchParams.get("type");
  const all = await listMoveCards("catalog");
  return { ...filterByCategory(all, type), picked: all.filter((m) => m.inLibrary).length };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  await handleLibraryIntent(form, String(form.get("moveId") ?? ""));
  return { ok: true };
}

export default function Catalog({ loaderData }: Route.ComponentProps) {
  useRememberList();
  const { category, counts, total, moves, picked } = loaderData;

  return (
    <div className="mx-auto max-w-6xl">
      <Headline kicker="Every move we've written up. Pick the ones you're working on.">
        <Heavy>The</Heavy> <Thin>Catalog</Thin>
      </Headline>

      {total > 0 && (
        <p className="font-label mt-6 text-center text-sm text-mute">
          {picked} of {total} in your library
        </p>
      )}

      {total > 0 && <CategoryFilter path="/catalog" category={category} counts={counts} total={total} />}

      {total === 0 && (
        <div className="mx-auto mt-16 max-w-md border-4 border-dashed border-ink/25 px-6 py-12 text-center">
          <p className="font-display text-5xl">No moves yet</p>
          <p className="mt-3 font-serif text-2xl leading-snug">
            Write up the first technique you learned in class, or run <code>npm run db:seed</code> for the starters.
          </p>
        </div>
      )}

      <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
        {moves.map((move, i) => (
          <li key={move.id}>
            <MoveCard move={move} index={i} />
            {/* Overlaps the frame's bottom edge like a tab, above the card's hover lift */}
            <div className="relative z-20 -mt-4 flex justify-center">
              <LibraryToggle moveId={move.id} name={move.name} inLibrary={move.inLibrary} />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-16 flex justify-center">
        <BoxLink to="/moves/new">Write up a new move</BoxLink>
      </div>
    </div>
  );
}
