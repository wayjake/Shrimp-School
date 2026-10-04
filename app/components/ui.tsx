import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";

// Serif kicker over a giant headline that mixes <Heavy> and <Thin> words,
// the way extrafazant.nl sets "RECENT WERK".
export function Headline({
  kicker,
  children,
  className = "",
}: {
  kicker?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <header className={`text-center ${className}`}>
      {kicker && (
        <p className="mx-auto max-w-xl font-serif text-2xl leading-tight text-balance sm:text-3xl">{kicker}</p>
      )}
      <h1 className="mt-3 text-[clamp(3.5rem,13vw,9.5rem)] leading-[0.86] text-balance">{children}</h1>
    </header>
  );
}

export function Heavy({ children }: { children: ReactNode }) {
  return <span className="font-display">{children}</span>;
}

export function Thin({ children }: { children: ReactNode }) {
  return <span className="font-serif font-normal uppercase tracking-[-0.03em]">{children}</span>;
}

const arrow = (
  <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
    <path d="M3 10h12M10 4.5 15.5 10 10 15.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
  </svg>
);

const tones = {
  pink: "bg-pink text-ink",
  blue: "bg-blue text-white",
  white: "bg-white text-ink",
  ink: "bg-ink text-white",
};

// Square arrow cell + label cell, like the site's "BEKIJK ONS WERK" button
function ArrowInner({ children, tone }: { children: ReactNode; tone: keyof typeof tones }) {
  return (
    <>
      <span className={`grid w-12 place-items-center ${tones[tone]}`}>{arrow}</span>
      <span className={`font-label flex items-center px-4 text-lg ${tones[tone]}`}>{children}</span>
    </>
  );
}

const arrowClass =
  "group inline-flex h-12 gap-0.5 transition-transform hover:-translate-y-0.5 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:opacity-50";

export function ArrowLink({
  tone = "pink",
  children,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { tone?: keyof typeof tones }) {
  return (
    <Link {...props} className={`${arrowClass} ${className}`}>
      <ArrowInner tone={tone}>{children}</ArrowInner>
    </Link>
  );
}

export function ArrowButton({
  tone = "pink",
  children,
  className = "",
  ...props
}: ComponentProps<"button"> & { tone?: keyof typeof tones }) {
  return (
    <button {...props} className={`${arrowClass} cursor-pointer ${className}`}>
      <ArrowInner tone={tone}>{children}</ArrowInner>
    </button>
  );
}

export function BoxLink({ className = "", ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={`font-label inline-flex items-center gap-2 bg-white px-4 py-2.5 text-sm text-ink transition-colors hover:bg-ink hover:text-white ${className}`}
    />
  );
}

export const RATING_WORDS = ["", "Rough", "Shaky", "Okay", "Sharp", "Flowed"] as const;

// Five square pips; filled ones carry the rating
export function RatingPips({
  value,
  size = "md",
  tone = "ink",
}: {
  value: number;
  size?: "sm" | "md";
  tone?: "ink" | "white";
}) {
  const box = size === "sm" ? "size-2.5" : "size-3.5";
  const on = tone === "white" ? "bg-white" : "bg-ink";
  const off = tone === "white" ? "bg-white/20" : "bg-ink/15";
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Felt ${value.toFixed(1).replace(/\.0$/, "")} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`${box} ${n <= rounded ? on : off}`} />
      ))}
    </span>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm font-semibold text-red">{children}</p>;
}
