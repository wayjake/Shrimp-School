import { Link } from "react-router";
import { CATEGORIES, CATEGORY_LABEL, CATEGORY_TONE, isCategory, type Category } from "~/lib/moves";

// Splits a list of cards by the ?type= filter and counts each category, for
// the library and the catalog
export function filterByCategory<T extends { category: Category }>(all: T[], type: string | null) {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, all.filter((m) => m.category === c).length])) as Record<
    Category,
    number
  >;
  const category = isCategory(type) ? type : null;
  return { category, counts, total: all.length, moves: category ? all.filter((m) => m.category === category) : all };
}

// "All" plus one link per category that has any moves
export function CategoryFilter({
  path,
  category,
  counts,
  total,
}: {
  path: string;
  category: Category | null;
  counts: Record<Category, number>;
  total: number;
}) {
  return (
    <nav aria-label="Filter by type" className="mt-10 flex flex-wrap justify-center gap-2">
      <FilterLink to={path} active={!category} count={total}>
        All
      </FilterLink>
      {CATEGORIES.filter((c) => counts[c] > 0).map((c) => (
        <FilterLink key={c} to={`${path}?type=${c}`} active={category === c} count={counts[c]} dot={CATEGORY_TONE[c].frame}>
          {CATEGORY_LABEL[c]}
        </FilterLink>
      ))}
    </nav>
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
