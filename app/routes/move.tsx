import { useEffect, useState } from "react";
import { Form, Link, useNavigation, useRevalidator } from "react-router";
import { MoveArt } from "~/components/move-art";
import { mediaUrl } from "~/components/move-card";
import { ArrowLink, BoxLink, RatingPips, RATING_WORDS } from "~/components/ui";
import { artStatus, entriesForMove, getMove, notFound, startMoveArt } from "~/lib/data.server";
import {
  averageRating,
  CATEGORY_SINGULAR,
  CATEGORY_TONE,
  formatDate,
  formatPercent,
  hitRate,
  SETTING_LABEL,
  SETTINGS,
  type Category,
} from "~/lib/moves";
import type { Route } from "./+types/move";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData ? `${loaderData.move.name} · Shrimp School` : "Shrimp School" },
];

export async function loader({ params }: Route.LoaderArgs) {
  const move = await getMove(params.moveId);
  if (!move) notFound("move");
  const entries = await entriesForMove(move.id);
  return { move, entries, art: artStatus(move.id) };
}

export async function action({ params, request }: Route.ActionArgs) {
  const form = await request.formData();
  if (form.get("intent") === "draw-art") startMoveArt(params.moveId);
  return { ok: true };
}

export default function MovePage({ loaderData }: Route.ComponentProps) {
  const { move, entries, art } = loaderData;
  const category = move.category as Category;
  const tone = CATEGORY_TONE[category];

  return (
    <article className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/?type=${category}`} className="font-label flex items-center gap-2 text-sm hover:underline">
          <span className={`size-2.5 ${tone.frame}`} aria-hidden="true" />
          {CATEGORY_SINGULAR[category]}
        </Link>
        <BoxLink to={`/moves/${move.id}/edit`}>Edit move</BoxLink>
      </div>

      <header className="mt-6 text-center">
        <p className="font-serif text-2xl sm:text-3xl">{move.position}</p>
        <h1 className="font-display mt-2 text-[clamp(3.75rem,14vw,10rem)] text-balance">{move.name}</h1>
      </header>

      <MediaFrame move={move} />
      <ArtControls art={move.media.length > 0 ? move.art : null} hasArt={Boolean(move.art)} status={art} />

      {move.videoUrl && (
        <div className="mt-8 flex justify-center">
          <ArrowLink to={move.videoUrl} target="_blank" rel="noreferrer" tone="pink">
            Watch the instructional
          </ArrowLink>
        </div>
      )}

      <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div className="min-w-0">
          <p className="max-w-[34ch] font-serif text-[1.7rem] leading-[1.15] sm:text-[2.1rem]">{move.description}</p>

          <h2 className="font-display mt-14 text-6xl">
            Step by <span className="font-serif font-normal tracking-normal">step</span>
          </h2>
          {move.steps.length > 0 ? (
            <ol className="mt-6 border-t-2 border-ink">
              {move.steps.map((step, i) => (
                <li key={i} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 border-b-2 border-ink py-6 sm:grid-cols-[5rem_minmax(0,1fr)]">
                  <span className="font-serif text-6xl leading-[0.8] tabular-nums sm:text-7xl" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-label text-xl">{step.title}</h3>
                    <p className="mt-1.5 max-w-prose text-[1.05rem] leading-relaxed text-ink-soft">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 text-lg text-mute">
              No steps written yet.{" "}
              <Link to={`/moves/${move.id}/edit`} className="underline">
                Add them
              </Link>
              .
            </p>
          )}
        </div>

        <Record moveId={move.id} entries={entries} />
      </div>
    </article>
  );
}

type Media = Route.ComponentProps["loaderData"]["move"]["media"][number];

function MediaFrame({ move }: { move: Route.ComponentProps["loaderData"]["move"] }) {
  const category = move.category as Category;
  // Clips first: if someone filmed the move, that's what you came for
  const media = [...move.media].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "video" ? -1 : 1));
  const [activeId, setActiveId] = useState(media[0]?.id);
  const active = media.find((m) => m.id === activeId) ?? media[0];
  // The drawn art is square, so the frame goes square for it instead of cropping
  const square = !active && move.art;

  return (
    <div className={`mx-auto mt-10 ${square ? "max-w-2xl" : "max-w-4xl"}`}>
      <figure className={`${CATEGORY_TONE[category].frame} -rotate-1 p-3 sm:p-5`}>
        <div className={`relative overflow-hidden bg-ink ${square ? "aspect-square" : "aspect-video"}`}>
          {active ? (
            <MediaView key={active.id} item={active} />
          ) : move.art ? (
            <img src={mediaUrl(move.art)} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <MoveArt seed={move.id} avoid={CATEGORY_TONE[category].frame} className="absolute inset-0 size-full" />
          )}
        </div>
        {active?.caption && (
          <figcaption className={`mt-3 text-center font-serif text-xl ${CATEGORY_TONE[category].text}`}>
            {active.caption}
          </figcaption>
        )}
      </figure>

      {media.length > 1 && (
        <ul className="mt-6 flex flex-wrap justify-center gap-3" aria-label="Photos and clips">
          {media.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setActiveId(m.id)}
                aria-label={`Show ${m.kind === "video" ? "clip" : "photo"} ${i + 1}`}
                aria-pressed={m.id === active?.id}
                className={`relative block size-20 cursor-pointer overflow-hidden bg-ink outline-offset-2 sm:size-24 ${
                  m.id === active?.id ? "outline-4 outline-ink" : "opacity-70 hover:opacity-100"
                }`}
              >
                {m.kind === "image" ? (
                  <img src={mediaUrl(m.file)} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <>
                    <video src={`${mediaUrl(m.file)}#t=0.5`} className="size-full object-cover" muted preload="metadata" />
                    <span className="absolute inset-0 grid place-items-center text-white" aria-hidden="true">
                      <svg viewBox="0 0 20 20" className="size-7 drop-shadow">
                        <path d="M6 4l10 6-10 6z" fill="currentColor" />
                      </svg>
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Draw or redraw the cover. When a photo or clip has the frame, the art only
// shows on the library card, so a small copy sits next to the button.
function ArtControls({
  art,
  hasArt,
  status,
}: {
  art: string | null;
  hasArt: boolean;
  status: Route.ComponentProps["loaderData"]["art"];
}) {
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const drawing = status.drawing || navigation.formData?.get("intent") === "draw-art";

  // Check back until the drawing lands
  useEffect(() => {
    if (!status.drawing) return;
    const timer = setInterval(() => revalidator.revalidate(), 4000);
    return () => clearInterval(timer);
  }, [status.drawing, revalidator]);

  if (!status.enabled) {
    return (
      <p className="mt-5 text-center text-sm text-mute">
        Add <code>OPENROUTER_API_KEY</code> to <code>.env</code> to draw cover art for this move.
      </p>
    );
  }

  return (
    <Form method="post" className="mt-5 flex flex-col items-center gap-2">
      {art && (
        <img src={mediaUrl(art)} alt="Library card cover" title="Library card cover" className="size-20 object-cover" />
      )}
      <button
        name="intent"
        value="draw-art"
        disabled={drawing}
        className="font-label cursor-pointer bg-white px-4 py-2.5 text-sm text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-white disabled:hover:text-ink"
      >
        {drawing ? "Drawing… (about a minute)" : hasArt ? "Redraw cover art" : "Draw cover art"}
      </button>
      {status.error && !drawing && <p className="text-sm font-semibold text-red">{status.error}</p>}
    </Form>
  );
}

function MediaView({ item }: { item: Media }) {
  if (item.kind === "video") {
    return <video src={mediaUrl(item.file)} controls playsInline preload="metadata" className="absolute inset-0 size-full" />;
  }
  return <img src={mediaUrl(item.file)} alt={item.caption ?? ""} className="absolute inset-0 size-full object-contain" />;
}

function Record({ moveId, entries }: { moveId: string; entries: Route.ComponentProps["loaderData"]["entries"] }) {
  const overall = hitRate(entries);
  const avg = averageRating(entries);

  return (
    <aside className="self-start bg-ink p-6 text-white lg:sticky lg:top-6">
      <h2 className="font-label text-sm text-white/70">Your record</h2>

      {entries.length === 0 ? (
        <>
          <p className="font-display mt-3 text-6xl">Not tried yet</p>
          <p className="mt-3 font-serif text-xl leading-snug text-white/80">
            Go for it in your next roll, then write down how many times it landed and how it felt.
          </p>
        </>
      ) : (
        <>
          <p className="font-display mt-2 text-[7rem] tabular-nums">{formatPercent(overall.rate)}</p>
          <p className="font-serif text-xl text-white/80">
            {overall.successes} of {overall.attempts} attempts landed
          </p>

          <dl className="mt-6 space-y-3">
            {SETTINGS.map((s) => {
              const r = hitRate(entries.filter((e) => e.setting === s));
              if (!r.attempts) return null;
              return (
                <div key={s}>
                  <div className="font-label flex justify-between text-sm">
                    <dt>{SETTING_LABEL[s]}</dt>
                    <dd className="tabular-nums">
                      {r.successes}/{r.attempts} · {formatPercent(r.rate)}
                    </dd>
                  </div>
                  <div className="mt-1.5 h-2 bg-white/15">
                    <div className="h-full bg-pink" style={{ width: `${(r.rate ?? 0) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </dl>

          {avg !== null && (
            <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-4">
              <span className="font-label text-sm">How it feels</span>
              <span className="flex items-center gap-2.5">
                <RatingPips value={avg} tone="white" />
                <span className="font-serif text-lg">{RATING_WORDS[Math.round(avg)]}</span>
              </span>
            </div>
          )}

          <ul className="mt-5 space-y-3 border-t border-white/20 pt-4">
            {entries.slice(0, 3).map((e) => (
              <li key={e.id}>
                <Link to={`/journal/${e.id}/edit`} className="group block">
                  <div className="font-label flex justify-between text-xs text-white/60">
                    <span>
                      {formatDate(e.date)} · {SETTING_LABEL[e.setting]}
                    </span>
                    <span className="tabular-nums">
                      {e.successes}/{e.attempts}
                    </span>
                  </div>
                  {e.feeling && (
                    <p className="mt-0.5 line-clamp-2 font-serif text-lg leading-snug italic group-hover:underline">
                      “{e.feeling}”
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <ArrowLink to={`/journal/new?move=${moveId}`} className="mt-6">
        Log this move
      </ArrowLink>
    </aside>
  );
}
