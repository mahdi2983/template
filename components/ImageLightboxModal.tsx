"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect } from "react";
import { focusRing, pressable } from "@/lib/styles";
import { cn } from "@/lib/cn";

export interface LightboxItem {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  badge?: string;
}

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LightboxItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  items,
  currentIndex,
  onSelectIndex,
}: ImageLightboxModalProps) {
  const current = items[currentIndex];

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    onSelectIndex((currentIndex - 1 + items.length) % items.length);
  }, [currentIndex, items.length, onSelectIndex]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    onSelectIndex((currentIndex + 1) % items.length);
  }, [currentIndex, items.length, onSelectIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        handlePrev();
      } else if (event.key === "ArrowRight") {
        handleNext();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.title || current.alt || "Fullscreen image viewer"}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-3 sm:p-6"
    >
      {/* Liquid Glass Frosted Ambient Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl transition-opacity duration-300"
      />

      {/* Floating Top Bar */}
      <div className="relative z-10 flex w-full max-w-4xl items-center justify-between">
        <div className="flex items-center gap-2">
          {current.badge ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-zinc-100 uppercase backdrop-blur-xl">
              {current.badge}
            </span>
          ) : null}
          {items.length > 1 ? (
            <span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-2.5 py-0.5 text-xs text-zinc-400 backdrop-blur-lg">
              {currentIndex + 1} / {items.length}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close fullscreen image"
          className={cn(
            "grid size-11 place-items-center rounded-full border border-zinc-700/60 bg-zinc-900/80 text-zinc-200 shadow-xl backdrop-blur-xl hover:bg-zinc-800 hover:text-white",
            pressable,
            focusRing,
          )}
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Center Image Canvas */}
      <div className="relative z-10 flex size-full max-h-[76vh] max-w-4xl flex-1 items-center justify-center p-1">
        {items.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous image"
            className={cn(
              "absolute left-2 z-20 grid size-11 place-items-center rounded-full border border-white/15 bg-black/60 text-white shadow-xl backdrop-blur-xl hover:bg-black/80 sm:left-4",
              pressable,
              focusRing,
            )}
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        <div className="relative size-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <Image
            src={current.src}
            alt={current.alt}
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            priority
            className="object-contain"
          />
        </div>

        {items.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next image"
            className={cn(
              "absolute right-2 z-20 grid size-11 place-items-center rounded-full border border-white/15 bg-black/60 text-white shadow-xl backdrop-blur-xl hover:bg-black/80 sm:right-4",
              pressable,
              focusRing,
            )}
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* Floating Bottom Info & Switcher Bar */}
      <div className="relative z-10 mt-3 w-full max-w-md">
        <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-zinc-950/80 p-3.5 text-center shadow-2xl backdrop-blur-2xl sm:p-4">
          {current.title && (
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100 sm:text-base">{current.title}</h3>
          )}
          {current.subtitle && (
            <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{current.subtitle}</p>
          )}

          {/* Quick switcher tabs if exactly 2 items (e.g. Before & After) */}
          {items.length === 2 && (
            <div className="mt-2.5 inline-flex rounded-full border border-zinc-800/80 bg-zinc-900/80 p-0.5">
              {items.map((item, index) => (
                <button
                  key={item.src}
                  type="button"
                  onClick={() => onSelectIndex(index)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase transition",
                    currentIndex === index
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  {item.badge || (index === 0 ? "Before" : "After")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
