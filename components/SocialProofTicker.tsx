"use client";

import { BadgeCheck, Eye, MapPin, Maximize2 } from "lucide-react";
import { useState } from "react";
import { useBooking } from "@/components/BookingProvider";
import { AddItemButton, ItemControls } from "@/components/editable/EditControls";
import { T } from "@/components/editable/T";
import { ImageLightboxModal, type LightboxItem } from "@/components/ImageLightboxModal";
import { PaintPanel } from "@/components/PaintPanel";
import { ReviewDetailModal } from "@/components/ReviewDetailModal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stars } from "@/components/ui/Stars";
import { NEW_REVIEW } from "@/lib/blocks";
import { cn } from "@/lib/cn";
import { useContentApi, useField } from "@/lib/editor/content-context";
import { focusRing, pressable, surface } from "@/lib/styles";
import type { Review } from "@/types";
import type { BusinessInfo, ReviewsBlock, SiteContent } from "@/types/content";

export function SocialProofTicker({ base }: { base: string }) {
  const block = useField<ReviewsBlock>(base);
  const business = useField<BusinessInfo>("site.business");
  const services = useField<SiteContent["services"]>("site.services");
  const labels = useField<SiteContent["reviewModal"]>("site.reviewModal");
  const { editing, resolveSrc = (src: string) => src } = useContentApi();
  const { openBooking } = useBooking();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Upload previews are resolved once here so every child gets a loadable src.
  const reviews = block.items.map((review) => ({
    ...review,
    beforeSrc: review.beforeSrc ? resolveSrc(review.beforeSrc) : undefined,
    afterSrc: review.afterSrc ? resolveSrc(review.afterSrc) : undefined,
  }));
  const selectedReview = selectedIndex === null ? null : (reviews[selectedIndex] ?? null);
  const serviceNames = new Map(services.map((service) => [service.id, service.name]));
  // Duplicated once so translateX(-50%) loops seamlessly. The editor shows a static, scrollable row instead.
  const loop = editing ? reviews : [...reviews, ...reviews];

  const handleOpenThumbLightbox = (review: Review, variant: "before" | "after") => {
    const items: LightboxItem[] = [];
    if (review.beforeSrc) {
      items.push({
        src: review.beforeSrc,
        alt: `Before detailing — ${review.vehicle}`,
        title: `${review.vehicle} · ${labels.beforeLabel}`,
        subtitle: `${review.author}, ${review.city}`,
        badge: labels.beforeLabel,
      });
    }
    if (review.afterSrc) {
      items.push({
        src: review.afterSrc,
        alt: `After detailing — ${review.vehicle}`,
        title: `${review.vehicle} · ${labels.afterLabel}`,
        subtitle: `${review.author}, ${review.city}`,
        badge: labels.afterLabel,
      });
    }

    const startIndex = variant === "after" && items.length > 1 ? 1 : 0;
    setLightboxItems(items);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  const handleOpenModalLightbox = (items: LightboxItem[], startIndex: number) => {
    setLightboxItems(items);
    setLightboxIndex(startIndex);
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

      <div className={cn(surface, "flex items-center gap-4 p-5")}>
        <p className="text-5xl font-semibold tracking-tight text-zinc-100">{business.googleRating.toFixed(1)}</p>
        <div className="min-w-0">
          <Stars rating={business.googleRating} className="size-5" />
          <p className="mt-1 text-sm text-zinc-300">
            {business.googleReviewCount} <T p={`${base}.countLabel`} />
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
            <BadgeCheck aria-hidden className="size-3.5" />
            <T p={`${base}.verifiedText`} />
          </p>
        </div>
      </div>

      <div
        className={cn(
          "no-scrollbar relative -mx-4 mt-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:overflow-x-auto",
          editing && "overflow-x-auto pt-4 [mask-image:none]",
        )}
      >
        <ul
          className={cn(
            "flex w-max px-4",
            !editing &&
              "animate-marquee hover:[animation-play-state:paused] active:[animation-play-state:paused] motion-reduce:animate-none",
          )}
        >
          {loop.map((review, index) => {
            const isDuplicate = index >= reviews.length;
            return (
              <li
                key={`${review.id}-${index}`}
                aria-hidden={isDuplicate || undefined}
                className={cn(
                  "relative w-[19rem] shrink-0 snap-start pr-3 sm:w-[21rem]",
                  isDuplicate && "motion-reduce:hidden",
                )}
              >
                <ReviewCard
                  review={review}
                  path={`${base}.items.${index % reviews.length}`}
                  promptPath={`${base}.cardPrompt`}
                  serviceName={serviceNames.get(review.serviceId)}
                  onSelect={() => setSelectedIndex(index % reviews.length)}
                  onThumbClick={(variant) => handleOpenThumbLightbox(review, variant)}
                />
                <ItemControls list={`${base}.items`} index={index} length={reviews.length} className="right-6" />
              </li>
            );
          })}
        </ul>
      </div>
      <AddItemButton
        list={`${base}.items`}
        template={{ ...NEW_REVIEW, id: `review-${reviews.length + 1}` }}
        label="Add review"
        className="mt-3"
      />

      {/* Expanded Review Detail Modal */}
      <ReviewDetailModal
        isOpen={Boolean(selectedReview)}
        onClose={() => setSelectedIndex(null)}
        review={selectedReview}
        path={selectedIndex === null ? "" : `${base}.items.${selectedIndex}`}
        serviceName={selectedReview ? serviceNames.get(selectedReview.serviceId) : undefined}
        onOpenLightbox={handleOpenModalLightbox}
        onBookService={(serviceId) => openBooking(serviceId)}
      />

      {/* Fullscreen Image Lightbox */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={lightboxItems}
        currentIndex={lightboxIndex}
        onSelectIndex={setLightboxIndex}
      />
    </section>
  );
}

interface ReviewCardProps {
  review: Review;
  path: string;
  promptPath: string;
  serviceName?: string;
  onSelect: () => void;
  onThumbClick: (variant: "before" | "after") => void;
}

function ReviewCard({ review, path, promptPath, serviceName, onSelect, onThumbClick }: ReviewCardProps) {
  const initials = review.author
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <article
      onClick={onSelect}
      className={cn(
        surface,
        "group relative flex h-full cursor-pointer flex-col gap-3 p-4 transition-all duration-300 hover:border-zinc-700/80 hover:bg-zinc-900/70 hover:shadow-xl",
        pressable,
        focusRing,
      )}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-2xl bg-zinc-800 text-sm font-semibold text-zinc-200"
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">
            <T p={`${path}.author`} />
          </p>
          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-zinc-800/80 px-2 py-0.5 text-[11px] text-zinc-300">
            <MapPin aria-hidden className="size-3 text-sky-400" />
            <T p={`${path}.city`} />
          </span>
        </div>
        <Stars rating={review.rating} className="size-3.5" />
      </header>

      <blockquote className="text-sm leading-relaxed text-zinc-300">
        &ldquo;
        <T p={`${path}.quote`} />
        &rdquo;
      </blockquote>

      <footer className="mt-auto flex items-center justify-between gap-3 pt-2">
        <div className="flex gap-1.5">
          <Thumb
            variant="before"
            review={review}
            onClick={(e) => {
              e.stopPropagation();
              onThumbClick("before");
            }}
          />
          <Thumb
            variant="after"
            review={review}
            onClick={(e) => {
              e.stopPropagation();
              onThumbClick("after");
            }}
          />
        </div>
        <div className="min-w-0 flex-1 text-right text-xs">
          <p className="truncate font-medium text-zinc-200">
            <T p={`${path}.vehicle`} />
          </p>
          {serviceName ? <p className="truncate text-zinc-500">{serviceName}</p> : null}
        </div>
      </footer>

      {/* Subtle Bottom Liquid Glass Prompt */}
      <div className="mt-1 flex items-center justify-between border-t border-zinc-800/60 pt-2 text-[11px] text-zinc-500 group-hover:text-zinc-300 transition">
        <span>
          <T p={promptPath} />
        </span>
        <Maximize2 className="size-3 opacity-60 group-hover:opacity-100" />
      </div>
    </article>
  );
}

interface ThumbProps {
  variant: "before" | "after";
  review: Review;
  onClick: (e: React.MouseEvent) => void;
}

function Thumb({ variant, review, onClick }: ThumbProps) {
  return (
    <figure
      onClick={onClick}
      className="group/thumb relative size-12 cursor-zoom-in overflow-hidden rounded-xl border border-zinc-800/70 transition-transform hover:scale-105"
    >
      <PaintPanel
        variant={variant}
        tone={review.tone}
        compact
        src={variant === "before" ? review.beforeSrc : review.afterSrc}
        sizes="48px"
        alt={`${variant === "before" ? "Before" : "After"} — ${review.vehicle}`}
        className="absolute inset-0"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/60 py-px text-center text-[8px] font-semibold tracking-wider text-zinc-200 uppercase backdrop-blur-xs">
        {variant}
      </figcaption>
      {/* Mini zoom indicator on hover */}
      <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover/thumb:opacity-100">
        <Maximize2 className="size-3 text-white" />
      </div>
    </figure>
  );
}
