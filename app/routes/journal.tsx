import { desc, eq } from "drizzle-orm";
import { Link } from "react-router";
import { ArrowLink, Headline, Heavy, RatingPips, RATING_WORDS, Thin } from "~/components/ui";
import { db, journalEntries, moves } from "~/db/index.server";
import {
  averageRating,
  CATEGORY_TONE,
  formatDate,
  formatPercent,
  hitRate,
  isSetting,
  SETTING_LABEL,
  SETTINGS,
  type Category,
} from "~/lib/moves";
import type { PageHandle } from "./layout";
import type { Route } from "./+types/journal";

export const handle: PageHandle = { dark: true };

export const meta: Route.MetaFunction = () => [{ title: "Journal · Shrimp School" }];

export async function loader({ request }: Route.LoaderArgs) {
  const filter = new URL(request.url).searchParams.get("in");
  const setting = isSetting(filter) ? filter : null;

  const all = await db
    .select({
      id: journalEntries.id,
      date: journalEntries.date,
      setting: journalEntries.setting,
      attempts: journalEntries.attempts,
      successes: journalEntries.successes,
      rating: journalEntries.rating,
      feeling: journalEntries.feeling,
      moveId: moves.id,
      moveName: moves.name,
      category: moves.category,
    })
    .from(journalEntries)
    .innerJoin(moves, eq(moves.id, journalEntries.moveId))
    .orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));

  const entries = setting ? all.filter((e) => e.setting === setting) : all;

  // Per-move totals for "What's landing", best rate first, ties to the more-tried move
  const byMove = new Map<string, { id: string; name: string; category: Category; rows: typeof entries }>();
  for (const e of entries) {
    const m = byMove.get(e.moveId) ?? { id: e.moveId, name: e.moveName, category: e.category as Category, rows: [] };
    m.rows.push(e);
    byMove.set(e.moveId, m);
  }
  const leaderboard = [...byMove.values()]
    .map((m) => ({ id: m.id, name: m.name, category: m.category, ...hitRate(m.rows) }))
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0) || b.attempts - a.attempts);

  return {
    setting,
    total: all.length,
    entries,
    leaderboard,
    stats: {
      overall: hitRate(entries),
      class: hitRate(entries.filter((e) => e.setting === "class")),
      competition: hitRate(entries.filter((e) => e.setting === "competition")),
      feel: averageRating(entries),
    },
  };
}

export default function Journal({ loaderData }: Route.ComponentProps) {
  const { setting, total, entries, leaderboard, stats } = loaderData;

  // Group by month so a long log reads like a training diary
  const months: { label: string; rows: typeof entries }[] = [];
  for (const e of entries) {
    const label = formatDate(e.date, { month: "long", year: "numeric" });
    const last = months.at(-1);
    if (last?.label === label) last.rows.push(e);
    else months.push({ label, rows: [e] });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Headline kicker="Every roll, written down. What landed, and how it felt.">
        <Heavy>Mat</Heavy> <Thin>Notes</Thin>
      </Headline>

      {total === 0 ? (
        <div className="mx-auto mt-16 max-w-lg border-4 border-dashed border-white/25 px-6 py-12 text-center">
          <p className="font-display text-5xl">Nothing logged yet</p>
          <p className="mt-3 font-serif text-2xl leading-snug text-white/80">
            After class or a match, write down the moves you went for, how many landed, and how it felt.
          </p>
          <ArrowLink to="/journal/new" className="mt-8">
            Log your first roll
          </ArrowLink>
        </div>
      ) : (
        <>
          <section aria-label="Totals" className="mt-14 grid grid-cols-2 gap-px bg-white/20 lg:grid-cols-4">
            <Stat label="Hit rate" value={formatPercent(stats.overall.rate)} sub={`${stats.overall.successes} of ${stats.overall.attempts} landed`} accent />
            <Stat label="In class" value={formatPercent(stats.class.rate)} sub={`${stats.class.successes} of ${stats.class.attempts}`} />
            <Stat
              label="In competition"
              value={formatPercent(stats.competition.rate)}
              sub={stats.competition.attempts ? `${stats.competition.successes} of ${stats.competition.attempts}` : "No matches logged"}
            />
            <div className="bg-ink p-5 sm:p-6">
              <p className="font-label text-sm text-white/60">How it feels</p>
              <p className="font-display mt-2 text-6xl tabular-nums sm:text-7xl">
                {stats.feel === null ? "—" : stats.feel.toFixed(1)}
                <span className="font-serif text-3xl font-normal text-white/50 normal-case"> /5</span>
              </p>
              {stats.feel !== null && (
                <div className="mt-2">
                  <RatingPips value={stats.feel} tone="white" size="sm" />
                </div>
              )}
            </div>
          </section>

          <nav aria-label="Filter by where" className="mt-10 flex flex-wrap gap-2">
            <Filter to="/journal" active={!setting}>
              Everywhere
            </Filter>
            {SETTINGS.map((s) => (
              <Filter key={s} to={`/journal?in=${s}`} active={setting === s}>
                {SETTING_LABEL[s]}
              </Filter>
            ))}
          </nav>

          <div className="mt-8 grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0">
              {entries.length === 0 && (
                <p className="font-serif text-2xl text-white/70">
                  Nothing logged at {SETTING_LABEL[setting!].toLowerCase()} yet.
                </p>
              )}
              {months.map((month) => (
                <section key={month.label} className="mb-12">
                  <h2 className="font-serif text-3xl">{month.label}</h2>
                  <ul className="mt-3 border-t border-white/25">
                    {month.rows.map((e) => (
                      <EntryRow key={e.id} entry={e} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <aside className="self-start lg:sticky lg:top-6">
              <h2 className="font-display text-5xl">
                What&rsquo;s <span className="font-serif font-normal tracking-normal">landing</span>
              </h2>
              <ol className="mt-5 space-y-4">
                {leaderboard.map((m) => (
                  <li key={m.id}>
                    <Link to={`/moves/${m.id}`} className="group block">
                      <div className="font-label flex items-baseline justify-between gap-3">
                        <span className="truncate group-hover:underline">{m.name}</span>
                        <span className="tabular-nums text-white/70">
                          {m.successes}/{m.attempts}
                        </span>
                      </div>
                      <div className="mt-1.5 h-3 bg-white/10">
                        <div className={`h-full ${CATEGORY_TONE[m.category].frame}`} style={{ width: `${(m.rate ?? 0) * 100}%` }} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`p-5 sm:p-6 ${accent ? "bg-blue" : "bg-ink"}`}>
      <p className={`font-label text-sm ${accent ? "text-white/80" : "text-white/60"}`}>{label}</p>
      <p className="font-display mt-2 text-6xl tabular-nums sm:text-7xl">{value}</p>
      <p className="mt-1 font-serif text-lg text-white/75">{sub}</p>
    </div>
  );
}

function Filter({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      preventScrollReset
      aria-current={active ? "page" : undefined}
      className={`font-label px-3.5 py-2 text-sm transition-colors ${
        active ? "bg-white text-ink" : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {children}
    </Link>
  );
}

type Entry = Route.ComponentProps["loaderData"]["entries"][number];

function EntryRow({ entry: e }: { entry: Entry }) {
  const tone = CATEGORY_TONE[e.category as Category];
  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 border-b border-white/25 py-6 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-6">
      <div className="font-display leading-[0.85]">
        <span className="block text-6xl tabular-nums sm:text-7xl">{formatDate(e.date, { day: "numeric" })}</span>
        <span className="font-label text-sm text-white/60">{formatDate(e.date, { weekday: "short" })}</span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Link to={`/moves/${e.moveId}`} className="font-display text-4xl hover:underline sm:text-5xl">
            {e.moveName}
          </Link>
          <span className={`font-label px-2 py-0.5 text-xs ${e.setting === "competition" ? "bg-orange text-white" : "bg-white/15"}`}>
            {SETTING_LABEL[e.setting]}
          </span>
        </div>
        <p className="font-label mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
          <span className="flex items-center gap-1.5" aria-label={`${e.successes} of ${e.attempts} landed`}>
            {Array.from({ length: Math.min(e.attempts, 12) }, (_, i) => (
              <span key={i} className={`size-3 rounded-full ${i < e.successes ? tone.frame : "border-2 border-white/40"}`} />
            ))}
            {e.attempts > 12 && <span>+{e.attempts - 12}</span>}
          </span>
          <span className="tabular-nums">
            {e.successes} of {e.attempts} landed
          </span>
        </p>
        {e.feeling && <p className="mt-3 max-w-[52ch] font-serif text-[1.35rem] leading-snug italic">“{e.feeling}”</p>}
      </div>

      <div className="col-start-2 flex items-center gap-4 sm:col-start-3 sm:flex-col sm:items-end sm:justify-between">
        <span className="flex items-center gap-2">
          <RatingPips value={e.rating} tone="white" size="sm" />
          <span className="font-serif text-lg">{RATING_WORDS[e.rating]}</span>
        </span>
        <Link to={`/journal/${e.id}/edit`} className="font-label text-xs text-white/60 underline-offset-4 hover:text-white hover:underline">
          Edit
        </Link>
      </div>
    </li>
  );
}
