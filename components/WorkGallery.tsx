"use client";

import { Eye, Maximize2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ImageLightboxModal, type LightboxItem } from "@/components/ImageLightboxModal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { focusRing, pressable, surface } from "@/lib/styles";

interface WorkStep {
  step: string;
  title: string;
  category: string;
  desc: string;
  src: string;
  alt: string;
}

const WORK_STEPS: WorkStep[] = [
  {
    step: "01",
    title: "Snow Foam Pre-Soak",
    category: "Decontamination",
    desc: "pH-neutral active foam encapsulates grit and road salt before any mitt touches your clear coat.",
    src: "/gallery/01-snow-foam.jpg",
    alt: "Detailer applying thick snow foam cannon pre-wash on car in driveway",
  },
  {
    step: "02",
    title: "Two-Bucket Hand Wash",
    category: "Scratch-Free Contact",
    desc: "Grit-guarded rinse buckets and ultra-plush microfiber mitts preserve delicate clear coats.",
    src: "/gallery/02-hand-wash.jpg",
    alt: "Professional detailer hand-washing black Porsche Taycan with Meguiar's buckets",
  },
  {
    step: "03",
    title: "Spot-Free Deionized Rinse",
    category: "0 PPM Pure Water",
    desc: "Mobile deionized filtration leaves zero minerals, preventing water spot etching in sunlight.",
    src: "/gallery/03-spot-free-rinse.jpg",
    alt: "High pressure spot-free water rinse on dark performance car rear diffuser",
  },
  {
    step: "04",
    title: "Ceramic Quartz Application",
    category: "3-Year Protection",
    desc: "Hand-applied 9H ceramic coating cross-links with the paint for hydrophobic beading.",
    src: "/gallery/04-ceramic-application.jpg",
    alt: "Detailer in black nitrile gloves applying ceramic coating with applicator block",
  },
  {
    step: "05",
    title: "Microfiber Paint Leveling",
    category: "Optical Clarity",
    desc: "Careful microfiber leveling removes coating high spots to reveal a deep mirror gloss reflection.",
    src: "/gallery/05-paint-leveling.jpg",
    alt: "Detailer gently leveling ceramic coating on metallic hood with microfiber towel",
  },
  {
    step: "06",
    title: "Cabin Steam & Leather Care",
    category: "Interior Reset",
    desc: "High-temperature steam, extraction, and pH-balanced conditioner leave leather supple and clean.",
    src: "/gallery/06-interior-detail.jpg",
    alt: "Detailer cleaning car interior console and leather seats with microfiber towel",
  },
];

export function WorkGallery() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const lightboxItems: LightboxItem[] = WORK_STEPS.map((step) => ({
    src: step.src,
    alt: step.alt,
    title: `Step ${step.step} · ${step.title}`,
    subtitle: `${step.category} — ${step.desc}`,
    badge: `Step ${step.step}`,
  }));

  const handleOpenLightbox = (index: number) => {
    setActivePhotoIndex(index);
    setLightboxOpen(true);
  };

  return (
    <section id="craft" aria-labelledby="craft-title" className="mt-10">
      <SectionHeading
        id="craft-title"
        eyebrow="Craft & Process"
        title="Precision mobile craft in action"
        trailing={
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
            <Eye aria-hidden className="size-3.5" />
            Tap to expand
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
            <p className="text-xs font-semibold text-zinc-200 sm:text-sm">Obsessive attention to every square inch</p>
            <p className="text-[11px] text-zinc-400">Our self-contained mobile studio brings shop-grade standards directly to your driveway.</p>
          </div>
        </div>
      </div>

      {/* Responsive Liquid Glass Grid (2 cols on mobile, 3 cols on sm/lg) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {WORK_STEPS.map((step, index) => (
          <article
            key={step.step}
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
                src={step.src}
                alt={step.alt}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Liquid Glass Step Pill */}
              <span className="absolute top-2 left-2 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white backdrop-blur-md">
                {step.step}
              </span>

              {/* Hover Fullscreen Icon */}
              <span className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-full border border-white/15 bg-black/60 text-white opacity-90 shadow-md backdrop-blur-md transition-opacity duration-200 group-hover:scale-110">
                <Maximize2 className="size-3.5" />
              </span>
            </div>

            {/* Meta Text */}
            <div className="mt-2.5 flex flex-1 flex-col justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                  {step.category}
                </p>
                <h3 className="mt-0.5 truncate text-xs font-semibold text-zinc-100 sm:text-sm">
                  {step.title}
                </h3>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-400">
                {step.desc}
              </p>
            </div>
          </article>
        ))}
      </div>

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
