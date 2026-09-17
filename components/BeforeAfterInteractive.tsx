"use client";

import { ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ImageEditButton, ItemControls } from "@/components/editable/EditControls";
import { T } from "@/components/editable/T";
import { PaintPanel } from "@/components/PaintPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { useField, useImageSrc } from "@/lib/editor/content-context";
import { focusRing, surface } from "@/lib/styles";
import type { BeforeAfterBlock } from "@/types/content";

interface BeforeAfterInteractiveProps {
  base: string;
  initialPosition?: number;
}

interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
}

const DRAG_THRESHOLD_PX = 4;
const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function BeforeAfterInteractive({ base, initialPosition = 50 }: BeforeAfterInteractiveProps) {
  const block = useField<BeforeAfterBlock>(base);
  const beforeSrc = useImageSrc(`${base}.beforeSrc`) || undefined;
  const afterSrc = useImageSrc(`${base}.afterSrc`) || undefined;
  const tone = block.tone ?? "obsidian";
  const [position, setPosition] = useState(() => clamp(initialPosition));
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);

  const moveTo = useCallback((clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0) return;
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const isMouse = event.pointerType === "mouse";
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: isMouse,
    };
    if (isMouse) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
      moveTo(event.clientX);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    if (!gesture.dragging) {
      // Touch: only claim the gesture once it's clearly horizontal, so vertical scrolling still works.
      const dx = Math.abs(event.clientX - gesture.startX);
      const dy = Math.abs(event.clientY - gesture.startY);
      if (dx < DRAG_THRESHOLD_PX || dx < dy) return;
      gesture.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }
    moveTo(event.clientX);
  };

  const endGesture = (event: PointerEvent<HTMLDivElement>, isTap: boolean) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (isTap && !gesture.dragging) {
      moveTo(event.clientX);
    }
    gestureRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 5;
    const targets: Record<string, number> = {
      ArrowLeft: position - step,
      ArrowDown: position - step,
      ArrowRight: position + step,
      ArrowUp: position + step,
      PageDown: position - 20,
      PageUp: position + 20,
      Home: 0,
      End: 100,
    };
    const next = targets[event.key];
    if (next !== undefined) {
      event.preventDefault();
      setPosition(clamp(next));
    }
  };

  const rounded = Math.round(position);

  return (
    <section id={block.id} aria-labelledby={`${block.id}-title`} className="mt-10">
      <SectionHeading
        id={`${block.id}-title`}
        eyebrow={<T p={`${base}.eyebrow`} />}
        title={<T p={`${base}.title`} />}
        trailing={
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
            <MoveHorizontal aria-hidden className="size-3.5" />
            <T p={`${base}.hint`} />
          </span>
        }
      />

      <div className={cn(surface, "p-2")}>
        <div
          ref={stageRef}
          className={cn(
            "relative aspect-[4/5] touch-pan-y overflow-hidden rounded-[1.25rem] select-none sm:aspect-[16/10]",
            isDragging ? "cursor-grabbing" : "cursor-ew-resize",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => endGesture(event, true)}
          onPointerCancel={(event) => endGesture(event, false)}
        >
          <PaintPanel
            variant="after"
            tone={tone}
            src={afterSrc}
            priority
            sizes="(max-width: 640px) 100vw, 720px"
            alt={block.afterAlt}
            className="absolute inset-0"
          />

          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <PaintPanel
              variant="before"
              tone={tone}
              src={beforeSrc}
              priority
              sizes="(max-width: 640px) 100vw, 720px"
              alt={block.beforeAlt}
              className="absolute inset-0"
            />
          </div>

          <span
            className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-zinc-200 uppercase backdrop-blur-md transition-opacity duration-300"
            style={{ opacity: position > 22 ? 1 : 0 }}
          >
            {block.beforeLabel}
          </span>
          <span
            className="pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-zinc-100 uppercase backdrop-blur-md transition-opacity duration-300"
            style={{ opacity: position < 78 ? 1 : 0 }}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            {block.afterLabel}
          </span>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_16px_rgba(255,255,255,0.6)]"
            style={{ left: `${position}%` }}
          />

          <div
            role="slider"
            tabIndex={0}
            aria-label="Before and after comparison"
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={rounded}
            aria-valuetext={`${rounded}% before, ${100 - rounded}% after`}
            onKeyDown={handleKeyDown}
            className={cn(
              "absolute top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-white/15 text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md transition-transform duration-300",
              isDragging && "scale-110 bg-white/25",
              focusRing,
            )}
            style={{ left: `${position}%` }}
          >
            <span aria-hidden className="flex items-center">
              <ChevronLeft className="-mr-1 size-4" />
              <ChevronRight className="-ml-1 size-4" />
            </span>
          </div>

          <ImageEditButton p={`${base}.beforeSrc`} label="Before photo" className="bottom-3 left-3" />
          <ImageEditButton p={`${base}.afterSrc`} label="After photo" className="right-3 bottom-3" />
        </div>

        <dl className="grid grid-cols-3 gap-2 p-1 pt-3">
          {block.stats.map((_, index) => (
            <div key={index} className="relative rounded-2xl bg-zinc-950/50 px-3 py-2.5">
              <dt className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                <T p={`${base}.stats.${index}.label`} />
              </dt>
              <dd className="mt-0.5 text-base font-semibold tracking-tight text-zinc-100">
                <T p={`${base}.stats.${index}.value`} />
              </dd>
              <ItemControls list={`${base}.stats`} index={index} length={block.stats.length} className="right-1" />
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
