"use client";

import { ChevronRight, Zap } from "lucide-react";
import Image from "next/image";
import { useBooking } from "@/components/BookingProvider";
import { ImageEditButton } from "@/components/editable/EditControls";
import { T } from "@/components/editable/T";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { useField, useImageSrc } from "@/lib/editor/content-context";
import { focusRing, pressable, surface } from "@/lib/styles";
import type { CtaBlock, ImageBlock, TextBlock } from "@/types/content";

export function TextSection({ base }: { base: string }) {
  const block = useField<TextBlock>(base);

  return (
    <section id={block.id} aria-labelledby={`${block.id}-title`} className="mt-10">
      <SectionHeading
        id={`${block.id}-title`}
        eyebrow={<T p={`${base}.eyebrow`} />}
        title={<T p={`${base}.title`} />}
      />
      <div className={cn(surface, "p-5 sm:p-6")}>
        <p className="text-[15px] leading-relaxed text-zinc-400">
          <T p={`${base}.body`} />
        </p>
      </div>
    </section>
  );
}

export function ImageSection({ base }: { base: string }) {
  const block = useField<ImageBlock>(base);
  const src = useImageSrc(`${base}.src`);

  return (
    <section id={block.id} className="mt-10">
      <figure className={cn(surface, "p-2")}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-zinc-950">
          {src ? (
            <Image src={src} alt={block.alt} fill sizes="(max-width: 640px) 100vw, 720px" className="object-cover" />
          ) : null}
          <ImageEditButton p={`${base}.src`} />
        </div>
        <figcaption className="px-3 pt-3 pb-1 text-xs text-zinc-400">
          <T p={`${base}.caption`} />
        </figcaption>
      </figure>
    </section>
  );
}

export function CtaSection({ base }: { base: string }) {
  const block = useField<CtaBlock>(base);
  const { openBooking } = useBooking();

  return (
    <section id={block.id} className="mt-10">
      <div
        className={cn(
          surface,
          "relative overflow-hidden border-emerald-500/40 p-6 text-center shadow-[0_24px_60px_-28px_rgba(16,185,129,0.55)] sm:p-8",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <h2 className="relative text-2xl font-semibold tracking-tight text-balance text-zinc-100">
          <T p={`${base}.title`} />
        </h2>
        <p className="relative mt-2 text-sm text-zinc-400">
          <T p={`${base}.text`} />
        </p>
        <button
          type="button"
          onClick={() => openBooking()}
          className={cn(
            "relative mt-5 inline-flex min-h-[52px] items-center gap-1.5 rounded-2xl bg-zinc-50 px-5 text-sm font-semibold text-zinc-950 shadow-[0_8px_24px_-8px_rgba(255,255,255,0.35)] hover:bg-white",
            pressable,
            focusRing,
          )}
        >
          <Zap aria-hidden className="size-4 fill-zinc-950" />
          <T p={`${base}.buttonLabel`} inButton />
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
    </section>
  );
}
