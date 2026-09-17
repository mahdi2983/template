"use client";

import { ChevronRight, Droplets, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import { AddItemButton, ImageEditButton, ItemControls } from "@/components/editable/EditControls";
import { T } from "@/components/editable/T";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/cn";
import { useField, useImageSrc } from "@/lib/editor/content-context";
import { focusRing, pressable, surface } from "@/lib/styles";
import type { BusinessInfo, HeroBlock } from "@/types/content";

const CHIP_ICONS = [Droplets, Zap, ShieldCheck];

export function HeroBento({ base }: { base: string }) {
  const block = useField<HeroBlock>(base);
  const business = useField<BusinessInfo>("site.business");
  const poster = useImageSrc(`${base}.poster`);

  return (
    <section id={block.id} aria-labelledby={`${block.id}-title`} className="mt-4 grid grid-cols-2 gap-3">
      <div className={cn(surface, "relative col-span-2 overflow-hidden p-6 sm:p-8")}>
        {/* Cinematic Auto Detailing Video Background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {block.showVideo ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={poster}
              className="size-full object-cover object-center opacity-30 transition-opacity duration-700 sm:opacity-35"
            >
              <source src="/hero-video.webm" type="video/webm" />
              <source src="/hero-video.mp4" type="video/mp4" />
            </video>
          ) : poster ? (
            <Image
              src={poster}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover object-center opacity-30 sm:opacity-35"
            />
          ) : null}
          {/* Apple-style deep gradient scrim overlay for 100% text contrast & legibility */}
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950/95 via-zinc-950/75 to-zinc-950/40" />
          <div className="absolute inset-0 bg-radial-[ellipse_80%_60%_at_20%_20%] from-emerald-500/10 via-transparent to-transparent" />
        </div>

        <ImageEditButton p={`${base}.poster`} label="Image de fond" alsoSet={{ [`${base}.showVideo`]: false }} />

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
          <T p={`${base}.badge`} />
        </p>

        <h1
          id={`${block.id}-title`}
          className="relative mt-4 text-[2.5rem] leading-[1.02] font-semibold tracking-tight text-zinc-100 sm:text-6xl"
        >
          <T p={`${base}.titleLine1`} />
          <span className="block bg-linear-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
            <T p={`${base}.titleLine2`} />
          </span>
        </h1>

        <p className="relative mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
          <T p={`${base}.text`} />
        </p>

        <ul className="relative mt-5 flex flex-wrap gap-2">
          {block.chips.map((_, index) => {
            const Icon = CHIP_ICONS[index % CHIP_ICONS.length]!;
            return (
              <li
                key={index}
                className="relative inline-flex items-center gap-1.5 rounded-full bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-200"
              >
                <Icon aria-hidden className="size-3.5 text-zinc-400" />
                <T p={`${base}.chips.${index}`} />
                <ItemControls list={`${base}.chips`} index={index} length={block.chips.length} className="-top-4 right-0" />
              </li>
            );
          })}
        </ul>
        <AddItemButton list={`${base}.chips`} template="Nouvel atout" label="Ajouter un atout" className="relative mt-2" />

        <a
          href={block.ctaHref}
          className={cn(
            "relative mt-6 inline-flex min-h-[48px] items-center gap-1 rounded-2xl border border-zinc-700/70 bg-zinc-800/60 pr-3 pl-4 text-sm font-semibold text-zinc-100 hover:bg-zinc-800",
            pressable,
            focusRing,
          )}
        >
          <T p={`${base}.ctaLabel`} />
          <ChevronRight aria-hidden className="size-4" />
        </a>
      </div>

      <div className={cn(surface, "flex flex-col justify-between p-5")}>
        <span className="grid size-10 place-items-center rounded-2xl bg-zinc-800/80 text-zinc-100">
          <Droplets aria-hidden className="size-5" />
        </span>
        <div className="mt-6">
          <p className="text-3xl font-semibold tracking-tight text-zinc-100">
            <T p={`${base}.statValue`} />
          </p>
          <p className="mt-1 text-xs leading-snug text-zinc-400">
            <T p={`${base}.statLabel`} />
          </p>
        </div>
      </div>

      <div className={cn(surface, "flex flex-col justify-between p-5")}>
        <Stars rating={business.googleRating} className="size-4" />
        <div className="mt-6">
          <p className="text-3xl font-semibold tracking-tight text-zinc-100">{business.googleRating.toFixed(1)}</p>
          <p className="mt-1 text-xs leading-snug text-zinc-400">
            {business.googleReviewCount} <T p={`${base}.reviewsLabel`} />
          </p>
        </div>
      </div>
    </section>
  );
}
