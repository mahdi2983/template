"use client";

import { Eye, Maximize2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AddItemButton, ImageEditButton, ItemControls } from "@/components/editable/EditControls";
import { T } from "@/components/editable/T";
import { ImageLightboxModal, type LightboxItem } from "@/components/ImageLightboxModal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NEW_GALLERY_ITEM } from "@/lib/blocks";
import { cn } from "@/lib/cn";
import { useContentApi, useField } from "@/lib/editor/content-context";
import { focusRing, pressable, surface } from "@/lib/styles";
import type { GalleryBlock } from "@/types/content";

export function WorkGallery({ base }: { base: string }) {
  const block = useField<GalleryBlock>(base);
  const { resolveSrc = (src: string) => src } = useContentApi();
  const steps = block.items;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const lightboxItems: LightboxItem[] = steps.map((step) => ({
    src: resolveSrc(step.src),
    alt: step.alt,
    title: `${block.stepLabel} ${step.step} · ${step.title}`,
    subtitle: `${step.category} — ${step.desc}`,
    badge: `${block.stepLabel} ${step.step}`,
  }));

  const handleOpenLightbox = (index: number) => {
    setActivePhotoIndex(index);
    setLightboxOpen(true);
  };

  return (
    <section id={block.id} aria-labelledby={`${block.id}-title`} className="mt-10">
      <SectionHeading
        id={`${block.id}-title`}
        eyebrow={<T p={`${base}.eyebrow`} />}
        title={<T p={`${base}.title`} />}
        trailing={
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
            <Eye aria-hidden className="size-3.5" />
            <T p={`${base}.hint`} />
          </span>
        }
      />

      {/* Intro Liquid Glass Pill */}
      <div className={cn(surface, "mb-3 flex items-center justify-between gap-3 p-4")}>
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-zinc-200 sm:text-sm">
              <T p={`${base}.introTitle`} />
            </p>
            <p className="text-[11px] text-zinc-400">
              <T p={`${base}.introText`} />
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Liquid Glass Grid (2 cols on mobile, 3 cols on sm/lg) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <article
            key={index}
            onClick={() => handleOpenLightbox(index)}
            className={cn(
              surface,
              "group relative flex cursor-pointer flex-col overflow-hidden p-2.5 transition duration-300 hover:border-zinc-700/80 hover:bg-zinc-900/70 sm:p-3",
              pressable,
              focusRing,
            )}
          >
            {/* Photo Container */}
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-950">
              <Image
                src={resolveSrc(step.src)}
                alt={step.alt}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Liquid Glass Step Pill */}
              <span className="absolute top-2 left-2 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white backdrop-blur-md">
                <T p={`${base}.items.${index}.step`} />
              </span>
              <ImageEditButton p={`${base}.items.${index}.src`} label="Photo" className="top-auto bottom-2 left-2 right-auto" />

              {/* Hover Fullscreen Icon */}
              <span className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-full border border-white/15 bg-black/60 text-white opacity-90 shadow-md backdrop-blur-md transition-opacity duration-200 group-hover:scale-110">
                <Maximize2 className="size-3.5" />
              </span>
            </div>

            {/* Meta Text */}
            <div className="mt-2.5 flex flex-1 flex-col justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                  <T p={`${base}.items.${index}.category`} />
                </p>
                <h3 className="mt-0.5 truncate text-xs font-semibold text-zinc-100 sm:text-sm">
                  <T p={`${base}.items.${index}.title`} />
                </h3>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-400">
                <T p={`${base}.items.${index}.desc`} />
              </p>
            </div>
            <ItemControls list={`${base}.items`} index={index} length={steps.length} className="top-1 right-1" />
          </article>
        ))}
      </div>
      <AddItemButton list={`${base}.items`} template={NEW_GALLERY_ITEM} label="Ajouter une photo" className="mt-3" />

      {/* Lightbox for Gallery */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={lightboxItems}
        currentIndex={activePhotoIndex}
        onSelectIndex={setActivePhotoIndex}
      />
    </section>
  );
}
