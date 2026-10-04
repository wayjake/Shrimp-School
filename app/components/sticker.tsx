import { Link } from "react-router";

// The round spinning badge from extrafazant.nl ("THIS IS HOW WE SCROLL"),
// here a shortcut to logging a roll
export function Sticker() {
  return (
    <Link
      to="/journal/new"
      aria-label="Log a roll"
      className="group fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-30 grid size-24 place-items-center rounded-full bg-lilac text-ink shadow-[0_6px_0_0_rgba(0,0,0,0.18)] transition-transform hover:scale-105 sm:right-7 sm:bottom-7 sm:size-32"
    >
      <svg viewBox="0 0 120 120" className="animate-spin-slow absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <path id="sticker-ring" d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" />
        </defs>
        <text className="font-label" fontSize="15" letterSpacing="2.2" fill="currentColor">
          <textPath href="#sticker-ring">LOG A ROLL • OSS • LOG A ROLL • OSS •</textPath>
        </text>
      </svg>
      <svg viewBox="0 0 40 40" className="relative size-8 transition-transform group-hover:rotate-90 sm:size-10" aria-hidden="true">
        <path d="M20 6v28M6 20h28" stroke="currentColor" strokeWidth="5" />
      </svg>
    </Link>
  );
}
