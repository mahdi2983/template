"use client";

import { BadgeCheck, Calendar, Car, ChevronRight, MapPin, Maximize2, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageEditButton } from "@/components/editable/EditControls";
import { T } from "@/components/editable/T";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/cn";
import { useField } from "@/lib/editor/content-context";
import { focusRing, pressable, surface } from "@/lib/styles";
import type { Review } from "@/types";
import type { LightboxItem } from "@/components/ImageLightboxModal";
import type { SiteContent } from "@/types/content";

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  /** Content path of the review, for in-place editing. */
  path: string;
  serviceName?: string;
  onOpenLightbox: (items: LightboxItem[], startIndex: number) => void;
  onBookService?: (serviceId: string) => void;
}

export function ReviewDetailModal({
  isOpen,
  onClose,
  review,
  path,
  serviceName,
  onOpenLightbox,
  onBookService,
}: ReviewDetailModalProps) {
  const labels = useField<SiteContent["reviewModal"]>("site.reviewModal");
  const region = useField<string>("site.business.region");
  const [activeTab, setActiveTab] = useState<"after" | "before">("after");

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("after");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose, review]);

  if (!isOpen || !review) return null;

  const initials = review.author
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  const lightboxItems: LightboxItem[] = [];
  if (review.beforeSrc) {
    lightboxItems.push({
      src: review.beforeSrc,
      alt: `Before detailing — ${review.vehicle}`,
      title: `${review.vehicle} · ${labels.beforeLabel}`,
      subtitle: `${review.author}, ${review.city}`,
      badge: labels.beforeLabel,
    });
  }
  if (review.afterSrc) {
    lightboxItems.push({
      src: review.afterSrc,
      alt: `After detailing — ${review.vehicle}`,
      title: `${review.vehicle} · ${labels.afterLabel}`,
      subtitle: `${review.author}, ${review.city}`,
      badge: labels.afterLabel,
    });
  }

  const handleOpenPhoto = (index: number) => {
    if (lightboxItems.length > 0) {
      onOpenLightbox(lightboxItems, index);
    }
  };

  const handleBook = () => {
    onClose();
    if (onBookService && review.serviceId) {
      onBookService(review.serviceId);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      {/* Liquid Glass Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-2xl transition-opacity duration-300"
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          surface,
          "relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border-zinc-700/60 bg-zinc-950/90 shadow-2xl backdrop-blur-2xl sm:rounded-[2rem]",
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <BadgeCheck className="size-3.5" />
              <T p="site.reviewModal.verifiedBadge" />
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review details"
            className={cn(
              "grid size-9 place-items-center rounded-full border border-zinc-700/60 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white",
              pressable,
              focusRing,
            )}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="no-scrollbar overflow-y-auto p-5 sm:p-6">
          {/* Customer Meta */}
          <div className="flex items-center gap-3.5">
            <span
              aria-hidden
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-zinc-700 to-zinc-900 text-base font-semibold text-zinc-100 shadow-inner"
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="review-modal-title" className="text-base font-semibold text-zinc-100">
                <T p={`${path}.author`} />
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3 text-sky-400" />
                  <T p={`${path}.city`} />, {region}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3 text-zinc-500" />
                  <T p="site.reviewModal.verifiedBooking" />
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Stars rating={review.rating} className="size-4" />
              <span className="mt-1 text-[11px] font-semibold text-emerald-400">{review.rating.toFixed(1)} / 5.0</span>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 text-sm leading-relaxed text-zinc-200 sm:text-[15px]">
            &ldquo;
            <T p={`${path}.quote`} />
            &rdquo;
          </blockquote>

          {/* Service & Vehicle Details Pill Card */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <dt className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                <Car className="size-3 text-zinc-400" />
                <T p="site.reviewModal.vehicleLabel" />
              </dt>
              <dd className="mt-1 truncate text-xs font-semibold text-zinc-100 sm:text-sm">
                <T p={`${path}.vehicle`} />
              </dd>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <dt className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                <Sparkles className="size-3 text-emerald-400" />
                <T p="site.reviewModal.packageLabel" />
              </dt>
              <dd className="mt-1 truncate text-xs font-semibold text-zinc-100 sm:text-sm">
                {serviceName}
              </dd>
            </div>
          </div>

          {/* Attached Inspection Photography Section */}
          {(review.beforeSrc || review.afterSrc) && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                  <T p="site.reviewModal.photosLabel" />
                </p>
                <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900/80 p-0.5">
                  {review.beforeSrc && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("before")}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase transition",
                        activeTab === "before"
                          ? "bg-zinc-700 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <T p="site.reviewModal.beforeLabel" inButton />
                    </button>
                  )}
                  {review.afterSrc && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("after")}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase transition",
                        activeTab === "after"
                          ? "bg-emerald-500/30 text-emerald-200 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <T p="site.reviewModal.afterLabel" inButton />
                    </button>
                  )}
                </div>
              </div>

              {/* Large Clickable Preview Canvas */}
              <div
                onClick={() => handleOpenPhoto(activeTab === "before" ? 0 : review.beforeSrc ? 1 : 0)}
                className="group relative mt-2.5 aspect-16/10 w-full cursor-zoom-in overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-xl"
              >
                <Image
                  src={activeTab === "before" ? review.beforeSrc || "" : review.afterSrc || ""}
                  alt={`${activeTab === "before" ? "Before" : "After"} treatment — ${review.vehicle}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <ImageEditButton p={`${path}.${activeTab === "before" ? "beforeSrc" : "afterSrc"}`} />

                {/* Liquid Glass Overlay Tag */}
                <span
                  className={cn(
                    "absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wider uppercase backdrop-blur-md",
                    activeTab === "after"
                      ? "border border-emerald-500/30 bg-black/60 text-emerald-300"
                      : "border border-zinc-700 bg-black/60 text-zinc-300",
                  )}
                >
                  {activeTab === "after" && (
                    <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                  )}
                  {activeTab === "after" ? labels.afterLabel : labels.beforeLabel}
                </span>

                {/* Floating Tap-to-fullscreen prompt */}
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-md transition-opacity group-hover:bg-black/80">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 className="size-3.5 text-zinc-300" />
                    <T p="site.reviewModal.fullscreenHint" />
                  </span>
                </div>
              </div>

              {/* Side-by-side Thumbnails Strip */}
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {review.beforeSrc && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("before")}
                    className={cn(
                      "relative flex items-center gap-2 rounded-xl border p-1.5 text-left transition",
                      activeTab === "before"
                        ? "border-zinc-500 bg-zinc-800/80"
                        : "border-zinc-800/70 bg-zinc-900/40 hover:bg-zinc-800/40",
                    )}
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                      <Image src={review.beforeSrc} alt={labels.beforeLabel} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-semibold text-zinc-200">{labels.beforeLabel}</p>
                    </div>
                  </button>
                )}

                {review.afterSrc && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("after")}
                    className={cn(
                      "relative flex items-center gap-2 rounded-xl border p-1.5 text-left transition",
                      activeTab === "after"
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-zinc-800/70 bg-zinc-900/40 hover:bg-zinc-800/40",
                    )}
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                      <Image src={review.afterSrc} alt={labels.afterLabel} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-semibold text-emerald-300">{labels.afterLabel}</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="border-t border-zinc-800/80 bg-zinc-950/80 p-4 sm:px-6">
          <button
            type="button"
            onClick={handleBook}
            className={cn(
              "flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 shadow-lg hover:bg-zinc-200",
              pressable,
              focusRing,
            )}
          >
            <T p="site.reviewModal.bookLabel" inButton /> {serviceName}
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
