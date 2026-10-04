import { Link } from "react-router";
import { MoveCard } from "~/components/move-card";
import { ArrowLink, Headline, Heavy, Thin } from "~/components/ui";
import { listMoveCards } from "~/lib/data.server";
import { CATEGORIES, CATEGORY_LABEL, CATEGORY_TONE, isCategory } from "~/lib/moves";
import type { Route } from "./+types/library";

export const meta: Route.MetaFunction = () => [{ title: "Moves · Shrimp School" }];

export async function loader({ request }: Route.LoaderArgs) {
  const filter = new URL(request.url).searchParams.get("type");
  const all = await listMoveCards();
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, all.filter((m) => m.category === c).length]));
  const category = isCategory(filter) ? filter : null;
  return {
    category,
    counts,
    total: all.length,
    moves: category ? all.filter((m) => m.category === category) : all,
  };
}

export default function Library({ loaderData }: Route.ComponentProps) {
  const { category, counts, total, moves } = loaderData;
  const shown = CATEGORIES.filter((c) => counts[c] > 0);

  return (
    <div className="mx-auto max-w-6xl">
      <Headline kicker="Learn it slow. Drill it often. Hit it live.">
        <Heavy>Move</Heavy> <Thin>Library</Thin>
      </Headline>

      {total > 0 && (
        <nav aria-label="Filter by type" className="mt-10 flex flex-wrap justify-center gap-2">
          <FilterLink to="/" active={!category} count={total}>
            All
          </FilterLink>
          {shown.map((c) => (
            <FilterLink key={c} to={`/?type=${c}`} active={category === c} count={counts[c]} dot={CATEGORY_TONE[c].frame}>
              {CATEGORY_LABEL[c]}
            </FilterLink>
          ))}
        </nav>
      )}

      {moves.length > 0 ? (
        <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
          {moves.map((move, i) => (
            <li key={move.id}>
              <MoveCard move={move} index={i} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mx-auto mt-16 max-w-md border-4 border-dashed border-ink/25 px-6 py-12 text-center">
          <p className="font-display text-5xl">No moves yet</p>
          <p className="mt-3 font-serif text-2xl leading-snug">
            Add the first technique you learned in class: what it is, where it starts, and the steps.
          </p>
        </div>
      )}

      <div className="mt-16 flex justify-center">
        <ArrowLink to="/moves/new">Add a move</ArrowLink>
      </div>
    </div>
  );
}

function FilterLink({
  to,
  active,
  count,
  dot,
  children,
}: {
  to: string;
  active: boolean;
  count: number;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      preventScrollReset
      aria-current={active ? "page" : undefined}
      className={`font-label flex items-center gap-2 px-3.5 py-2 text-sm transition-colors ${
        active ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/10"
      }`}
    >
      {dot && <span className={`size-2.5 ${dot}`} aria-hidden="true" />}
      {children}
      <span className={`tabular-nums ${active ? "text-white/60" : "text-mute"}`}>{count}</span>
    </Link>
  );
}
