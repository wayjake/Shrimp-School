import { useId } from "react";

// Flat cut-paper shapes standing in for a cover photo, in the spirit of the
// illustrations on extrafazant.nl. Seeded by the move id, so each move keeps
// the same composition across renders and server/client agree.

const PALETTE = ["blue", "pink", "orange", "lilac", "red", "gold", "ink"] as const;

function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  // mulberry32
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}C${x + r * 0.12} ${y - r * 0.12} ${x + r * 0.12} ${y - r * 0.12} ${x + r} ${y}` +
  `C${x + r * 0.12} ${y + r * 0.12} ${x + r * 0.12} ${y + r * 0.12} ${x} ${y + r}` +
  `C${x - r * 0.12} ${y + r * 0.12} ${x - r * 0.12} ${y + r * 0.12} ${x - r} ${y}` +
  `C${x - r * 0.12} ${y - r * 0.12} ${x - r * 0.12} ${y - r * 0.12} ${x} ${y - r}Z`;

export function MoveArt({ seed, avoid, className = "" }: { seed: string; avoid?: string; className?: string }) {
  const clip = useId();
  const rand = seeded(seed);
  const pick = (exclude: string[]) => {
    const pool = PALETTE.filter((c) => !exclude.includes(c));
    return pool[Math.floor(rand() * pool.length)];
  };
  const avoidColor = avoid?.replace(/^bg-/, "") ?? "";

  const a = pick([avoidColor]);
  const b = pick([avoidColor, a]);
  const c = pick([avoidColor, a, b]);
  const W = 400;
  const H = 440;

  // Big disc bleeding off one corner
  const corner = Math.floor(rand() * 4);
  const discR = 150 + rand() * 70;
  const discX = corner % 2 ? W - 30 : 30;
  const discY = corner < 2 ? 40 : H - 40;

  // Half-moon on the opposite side
  const moonX = corner % 2 ? 90 + rand() * 60 : W - 90 - rand() * 60;
  const moonY = corner < 2 ? H - 150 - rand() * 60 : 150 + rand() * 60;
  const moonR = 55 + rand() * 35;
  const moonTurn = Math.floor(rand() * 4) * 90;

  // A tilted mat panel along the bottom
  const matTilt = -8 + rand() * 16;
  const matY = H - 110 - rand() * 40;

  const stars = Array.from({ length: 3 }, () => ({
    x: 60 + rand() * (W - 120),
    y: 50 + rand() * (H - 160),
    r: 10 + rand() * 22,
  }));
  const dots = Array.from({ length: 6 }, () => ({ x: 20 + rand() * (W - 40), y: 20 + rand() * (H - 40) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <rect width={W} height={H} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width={W} height={H} fill="var(--color-mist)" />
        <rect
          x={-40}
          y={matY}
          width={W + 80}
          height={H}
          fill={`var(--color-${c})`}
          transform={`rotate(${matTilt} ${W / 2} ${matY})`}
        />
        <circle cx={discX} cy={discY} r={discR} fill={`var(--color-${a})`} />
        <path
          d={`M${moonX - moonR} ${moonY}A${moonR} ${moonR} 0 0 1 ${moonX + moonR} ${moonY}Z`}
          fill={`var(--color-${b})`}
          transform={`rotate(${moonTurn} ${moonX} ${moonY})`}
        />
        {stars.map((s, i) => (
          <path key={i} d={sparkle(s.x, s.y, s.r)} fill={i === 0 ? "var(--color-ink)" : "#ffffff"} />
        ))}
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={3.5} fill="#ffffff" />
        ))}
      </g>
    </svg>
  );
}
