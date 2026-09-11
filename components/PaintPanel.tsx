import Image from "next/image";
import { cn } from "@/lib/cn";
import type { PaintTone } from "@/types";

interface ToneSwatch {
  dull: [string, string];
  gloss: [string, string, string];
}

const TONES: Record<PaintTone, ToneSwatch> = {
  obsidian: { dull: ["#3a3c41", "#232529"], gloss: ["#010102", "#12151b", "#3b4a60"] },
  crimson: { dull: ["#6b3d3f", "#44282a"], gloss: ["#240205", "#8c0d16", "#ff4d5e"] },
  cobalt: { dull: ["#43506a", "#2b3444"], gloss: ["#020b24", "#0f2f7a", "#5b8cff"] },
  pearl: { dull: ["#a4a39e", "#7c7b77"], gloss: ["#b9bec6", "#eef0f3", "#ffffff"] },
  graphite: { dull: ["#4d5055", "#34363a"], gloss: ["#08090b", "#262a31", "#6b7686"] },
};

/** Tiny deterministic PRNG so server and client render identical geometry. */
function seeded(seed: number): () => number {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = seeded(42);
const round = (value: number) => Math.round(value * 10) / 10;

// Holograms / buffer trails form concentric arcs around the light source.
const SWIRL_CX = 270;
const SWIRL_CY = 170;
const SWIRLS = Array.from({ length: 30 }, (_, index) => {
  const r = 14 + index * 12 + rand() * 6;
  const circumference = 2 * Math.PI * r;
  return {
    r: round(r),
    dash: `${round(circumference * (0.12 + rand() * 0.35))} ${round(circumference * (0.08 + rand() * 0.3))}`,
    rotate: Math.round(rand() * 360),
    opacity: round((0.05 + rand() * 0.12) * 100) / 100,
  };
});

const SCRATCHES = Array.from({ length: 18 }, () => {
  const x = rand() * 400;
  const y = rand() * 500;
  const length = 18 + rand() * 60;
  const angle = rand() * Math.PI;
  return {
    x1: round(x),
    y1: round(y),
    x2: round(x + Math.cos(angle) * length),
    y2: round(y + Math.sin(angle) * length),
    opacity: round((0.05 + rand() * 0.1) * 100) / 100,
  };
});

const WATER_SPOTS = Array.from({ length: 10 }, () => ({
  cx: round(rand() * 400),
  cy: round(250 + rand() * 230),
  r: round(3 + rand() * 7),
  opacity: round((0.08 + rand() * 0.12) * 100) / 100,
}));

const BEADS = Array.from({ length: 16 }, () => ({
  left: round(4 + rand() * 60),
  top: round(58 + rand() * 36),
  size: Math.round(5 + rand() * 12),
}));

interface PaintPanelProps {
  variant: "before" | "after";
  tone?: PaintTone;
  /** Thumbnail mode: fewer layers, no animation. */
  compact?: boolean;
  /** Optional real photo; replaces the procedural render when provided. */
  src?: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  /** Must include positioning (e.g. `absolute inset-0` or `relative size-12`). */
  className?: string;
}

/**
 * Procedural paint surface: "before" is hazy, swirled and water-spotted; "after" is a deep
 * ceramic gloss with crisp reflections and beading. Swap in photography via `src`.
 */
export function PaintPanel({
  variant,
  tone = "obsidian",
  compact = false,
  src,
  alt = "",
  sizes = "100vw",
  priority,
  className,
}: PaintPanelProps) {
  if (src) {
    return (
      <div className={cn("overflow-hidden", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  const swatch = TONES[tone];

  return (
    <div
      className={cn("overflow-hidden", className)}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      {variant === "before" ? (
        <DullSurface swatch={swatch} compact={compact} />
      ) : (
        <GlossSurface swatch={swatch} compact={compact} />
      )}
    </div>
  );
}

function DullSurface({ swatch, compact }: { swatch: ToneSwatch; compact: boolean }) {
  const [light, dark] = swatch.dull;

  return (
    <>
      <div className="absolute inset-0" style={{ background: `linear-gradient(165deg, ${light} 0%, ${dark} 100%)` }} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 67% 32%, rgba(255,255,255,0.22), rgba(255,255,255,0.06) 55%, transparent 75%)",
        }}
      />
      <svg
        viewBox="0 0 400 500"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <g fill="none" stroke="#ffffff" strokeLinecap="round">
          {(compact ? SWIRLS.slice(0, 16) : SWIRLS).map((swirl) => (
            <circle
              key={swirl.r}
              cx={SWIRL_CX}
              cy={SWIRL_CY}
              r={swirl.r}
              strokeWidth={compact ? 2.2 : 0.9}
              strokeDasharray={swirl.dash}
              strokeOpacity={swirl.opacity}
              transform={`rotate(${swirl.rotate} ${SWIRL_CX} ${SWIRL_CY})`}
            />
          ))}
          {!compact &&
            SCRATCHES.map((scratch, index) => (
              <line
                key={index}
                x1={scratch.x1}
                y1={scratch.y1}
                x2={scratch.x2}
                y2={scratch.y2}
                strokeWidth={0.7}
                strokeOpacity={scratch.opacity}
              />
            ))}
          {WATER_SPOTS.map((spot, index) => (
            <circle
              key={index}
              cx={spot.cx}
              cy={spot.cy}
              r={spot.r}
              strokeWidth={compact ? 2 : 1.1}
              strokeOpacity={spot.opacity}
            />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 bg-zinc-300/10 mix-blend-overlay" />
    </>
  );
}

function GlossSurface({ swatch, compact }: { swatch: ToneSwatch; compact: boolean }) {
  const [deep, mid, sheen] = swatch.gloss;

  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(170deg, ${mid} 0%, ${deep} 46%, ${deep} 54%, ${mid} 100%)` }}
      />
      {/* Sky / ground horizon reflection — the crisp line only real gloss can hold. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${sheen}40 0%, transparent 45%, rgba(0,0,0,0.5) 46%, transparent 100%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(112deg, transparent 33%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0.12) 39%, transparent 44%, transparent 58%, rgba(255,255,255,0.2) 59.5%, transparent 63%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(9% 7% at 67% 32%, rgba(255,255,255,0.95), rgba(255,255,255,0.25) 45%, transparent 70%)",
        }}
      />
      {!compact &&
        BEADS.map((bead, index) => (
          <span
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${bead.left}%`,
              top: `${bead.top}%`,
              width: bead.size,
              height: bead.size,
              background:
                "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0 14%, rgba(255,255,255,0.22) 32%, rgba(0,0,0,0.35) 72%, rgba(255,255,255,0.35) 100%)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}
          />
        ))}
      {!compact && (
        <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 animate-shimmer bg-linear-to-r from-transparent via-white/10 to-transparent" />
      )}
    </>
  );
}
