import { CategoryFilter, filterByCategory } from "~/components/category-filter";
import { MoveCard } from "~/components/move-card";
import { ArrowLink, BoxLink, Headline, Heavy, Thin } from "~/components/ui";
import { listMoveCards } from "~/lib/data.server";
import { useRememberList } from "~/lib/last-list";
import type { Route } from "./+types/library";

export const meta: Route.MetaFunction = () => [{ title: "My library · Shrimp School" }];

// Only the moves you've picked. The rest wait in the catalog.
export async function loader({ request }: Route.LoaderArgs) {
  const type = new URL(request.url).searchParams.get("type");
  return filterByCategory(await listMoveCards("library"), type);
}

export default function Library({ loaderData }: Route.ComponentProps) {
  useRememberList();
  const { category, counts, total, moves } = loaderData;

  return (
    <div className="mx-auto max-w-6xl">
      <Headline kicker="Learn it slow. Drill it often. Hit it live.">
        <Heavy>My</Heavy> <Thin>Library</Thin>
      </Headline>

      {total > 0 ? (
        <>
          <CategoryFilter path="/" category={category} counts={counts} total={total} />
          <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
            {moves.map((move, i) => (
              <li key={move.id}>
                <MoveCard move={move} index={i} />
              </li>
            ))}
          </ul>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
            <ArrowLink to="/catalog">Pick more moves</ArrowLink>
            <BoxLink to="/moves/new">Write up a new move</BoxLink>
          </div>
        </>
      ) : (
        <div className="mx-auto mt-16 max-w-lg border-4 border-dashed border-ink/25 px-6 py-12 text-center">
          <p className="font-display text-5xl">Nothing picked yet</p>
          <p className="mt-3 font-serif text-2xl leading-snug">
            Go through the catalog and add the moves you&rsquo;re working on. They&rsquo;ll live here.
          </p>
          <ArrowLink to="/catalog" className="mt-8">
            Browse the catalog
          </ArrowLink>
        </div>
      )}
    </div>
  );
}
