import { ChevronRight, Droplets, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/lib/site-config";
import { focusRing, pressable, surface } from "@/lib/styles";

const frictionChips = [
  { icon: Droplets, label: "Water onboard" },
  { icon: Zap, label: "Power onboard" },
  { icon: ShieldCheck, label: "Fully insured" },
];

export function HeroBento() {
  return (
    <section aria-labelledby="hero-title" className="mt-4 grid grid-cols-2 gap-3">
      <div className={cn(surface, "relative col-span-2 overflow-hidden p-6 sm:p-8")}>
        {/* Cinematic Auto Detailing Video Background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/hero-poster.jpg"
            className="size-full object-cover object-center opacity-30 transition-opacity duration-700 sm:opacity-35"
          >
            <source src="/hero-video.webm" type="video/webm" />
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          {/* Apple-style deep gradient scrim overlay for 100% text contrast & legibility */}
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950/95 via-zinc-950/75 to-zinc-950/40" />
          <div className="absolute inset-0 bg-radial-[ellipse_80%_60%_at_20%_20%] from-emerald-500/10 via-transparent to-transparent" />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 size-64 rounded-full bg-sky-400/5 blur-3xl"
        />

        <p className="relative inline-flex items-center gap-1.5 rounded-full border border-zinc-800/80 bg-zinc-950/60 px-3 py-1 text-xs font-medium text-zinc-300">
          <Sparkles aria-hidden className="size-3.5 text-emerald-400" />
          Mobile detailing studio
        </p>

        <h1
          id="hero-title"
          className="relative mt-4 text-[2.5rem] leading-[1.02] font-semibold tracking-tight text-zinc-100 sm:text-6xl"
        >
          Showroom shine
          <span className="block bg-linear-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
            in your driveway.
          </span>
        </h1>

        <p className="relative mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
          We bring our own water and power — nothing to hook up, nowhere to be. Hand over the keys, get back to your
          day, and come back to a car that looks better than the day you bought it.
        </p>

        <ul className="relative mt-5 flex flex-wrap gap-2">
          {frictionChips.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-200"
            >
              <Icon aria-hidden className="size-3.5 text-zinc-400" />
              {label}
            </li>
          ))}
        </ul>

        <a
          href="#services"
          className={cn(
            "relative mt-6 inline-flex min-h-[48px] items-center gap-1 rounded-2xl border border-zinc-700/70 bg-zinc-800/60 pr-3 pl-4 text-sm font-semibold text-zinc-100 hover:bg-zinc-800",
            pressable,
            focusRing,
          )}
        >
          See packages &amp; pricing
          <ChevronRight aria-hidden className="size-4" />
        </a>
      </div>

      <div className={cn(surface, "flex flex-col justify-between p-5")}>
        <span className="grid size-10 place-items-center rounded-2xl bg-zinc-800/80 text-zinc-100">
          <Droplets aria-hidden className="size-5" />
        </span>
        <div className="mt-6">
          <p className="text-3xl font-semibold tracking-tight text-zinc-100">100%</p>
          <p className="mt-1 text-xs leading-snug text-zinc-400">Self-contained. No hose, no outlet needed.</p>
        </div>
      </div>

      <div className={cn(surface, "flex flex-col justify-between p-5")}>
        <Stars rating={siteConfig.googleRating} className="size-4" />
        <div className="mt-6">
          <p className="text-3xl font-semibold tracking-tight text-zinc-100">{siteConfig.googleRating.toFixed(1)}</p>
          <p className="mt-1 text-xs leading-snug text-zinc-400">{siteConfig.googleReviewCount} Google reviews</p>
        </div>
      </div>
    </section>
  );
}
