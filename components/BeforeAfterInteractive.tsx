"use client";

import { ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { PaintPanel } from "@/components/PaintPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { focusRing, surface } from "@/lib/styles";
import type { PaintTone } from "@/types";

interface BeforeAfterInteractiveProps {
  tone?: PaintTone;
  beforeSrc?: string;
  afterSrc?: string;
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

const resultStats = [
  { value: "70%", label: "Swirls removed" },
  { value: "3 yr", label: "Ceramic protection" },
  { value: "6 hrs", label: "In your driveway" },
];

export function BeforeAfterInteractive({
  tone = "obsidian",
  beforeSrc,
  afterSrc,
  initialPosition = 50,
}: BeforeAfterInteractiveProps) {
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
    <section id="results" aria-labelledby="results-title" className="mt-10">
      <SectionHeading
        id="results-title"
        eyebrow="Real results"
        title="Swipe the ceramic difference"
        trailing={
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
            <MoveHorizontal aria-hidden className="size-3.5" />
            Drag
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
            alt="After: deep ceramic gloss with crisp reflections"
            className="absolute inset-0"
          />

          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <PaintPanel
              variant="before"
              tone={tone}
              src={beforeSrc}
              priority
              sizes="(max-width: 640px) 100vw, 720px"
              alt="Before: dull paint with swirl marks and water spots"
              className="absolute inset-0"
            />
          </div>

          <span
            className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-zinc-200 uppercase backdrop-blur-md transition-opacity duration-300"
            style={{ opacity: position > 22 ? 1 : 0 }}
          >
            Before · Swirled
          </span>
          <span
            className="pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-zinc-100 uppercase backdrop-blur-md transition-opacity duration-300"
            style={{ opacity: position < 78 ? 1 : 0 }}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            After · Ceramic
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
        </div>

        <dl className="grid grid-cols-3 gap-2 p-1 pt-3">
          {resultStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-zinc-950/50 px-3 py-2.5">
              <dt className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">{stat.label}</dt>
              <dd className="mt-0.5 text-base font-semibold tracking-tight text-zinc-100">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
