import { Link } from "react-router";
import { CATEGORY_SINGULAR, CATEGORY_TONE, formatPercent, type Category } from "~/lib/moves";
import { MoveArt } from "./move-art";

export type CoverMedia = { file: string; kind: "image" | "video" } | null;

export const mediaUrl = (file: string) => `/media/${file}`;

// First photo, else the drawn cover art, else the first frame of a clip, else
// the SVG shapes while there's no art yet. Art beats a clip because a paused
// frame of two people on a mat makes a poor card.
export function MoveCover({
  id,
  category,
  cover,
  art,
  className = "",
}: {
  id: string;
  category: Category;
  cover: CoverMedia;
  art: string | null;
  className?: string;
}) {
  if (cover?.kind === "image") {
    return <img src={mediaUrl(cover.file)} alt="" className={`object-cover ${className}`} loading="lazy" />;
  }
  if (art) {
    return <img src={mediaUrl(art)} alt="" className={`object-cover ${className}`} loading="lazy" />;
  }
  if (cover?.kind === "video") {
    return (
      <video
        src={`${mediaUrl(cover.file)}#t=0.5`}
        className={`object-cover ${className}`}
        muted
        playsInline
        preload="metadata"
      />
    );
  }
  return <MoveArt seed={id} avoid={CATEGORY_TONE[category].frame} className={className} />;
}

// Tilts cycle through this list so a row of cards reads as hand-placed
const TILTS = ["-rotate-2", "rotate-1", "rotate-[2.5deg]", "-rotate-1", "rotate-[1.5deg]", "-rotate-[2.5deg]"];

export function MoveCard({
  move,
  index,
}: {
  move: {
    id: string;
    name: string;
    position: string;
    category: Category;
    stepCount: number;
    cover: CoverMedia;
    art: string | null;
    rate: number | null;
  };
  index: number;
}) {
  const tone = CATEGORY_TONE[move.category];
  return (
    <Link
      to={`/moves/${move.id}`}
      className={`group relative block ${TILTS[index % TILTS.length]} transition-transform duration-300 ease-out hover:z-10 hover:rotate-0 hover:scale-[1.03] focus-visible:rotate-0 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-ink`}
    >
      <article className={`${tone.frame} ${tone.text} p-3.5 sm:p-4`}>
        <div className="relative aspect-[10/11] overflow-hidden bg-mist">
          <MoveCover id={move.id} category={move.category} cover={move.cover} art={move.art} className="absolute inset-0 size-full" />
          <span className="font-label absolute top-3 left-3 bg-white px-2 py-1 text-xs text-ink">
            {CATEGORY_SINGULAR[move.category]} · {move.stepCount} {move.stepCount === 1 ? "step" : "steps"}
          </span>
          {move.rate !== null && (
            <span className="absolute right-3 bottom-3 grid size-16 rotate-12 place-items-center rounded-full bg-ink text-center text-white">
              <span className="font-display text-2xl leading-none">
                {formatPercent(move.rate)}
                <span className="font-label block text-[0.6rem] tracking-wider">hit rate</span>
              </span>
            </span>
          )}
        </div>
        <div className="px-1 pt-4 pb-2 text-center">
          <h2 className="font-display text-[clamp(2.6rem,5vw,3.6rem)] text-balance">{move.name}</h2>
          <p className="mt-1.5 font-serif text-xl leading-tight sm:text-2xl">{move.position}</p>
        </div>
      </article>
    </Link>
  );
}
