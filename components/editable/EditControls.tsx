"use client";

import { ArrowDown, ArrowUp, Camera, Copy, Plus, Trash2 } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useContentApi, type ListOp } from "@/lib/editor/content-context";

const stop = (event: MouseEvent | React.PointerEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

interface ImageEditButtonProps {
  p: string;
  label?: string;
  /** Extra values written alongside the new image (e.g. turning the hero video off). */
  alsoSet?: Record<string, unknown>;
  /** Icon-only round button, for small images such as the logo. */
  compact?: boolean;
  className?: string;
}

/** "Change photo" pill, rendered only in the editor. The parent must be positioned. */
export function ImageEditButton({ p, label = "Change photo", alsoSet, compact = false, className }: ImageEditButtonProps) {
  const api = useContentApi();
  if (!api.editing) return null;

  return (
    <button
      type="button"
      data-editor-ui
      title={label}
      aria-label={label}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        stop(event);
        api.pickImage?.(p, alsoSet);
      }}
      className={cn(
        "absolute z-30 inline-flex items-center rounded-full border border-emerald-400/60 bg-zinc-950/85 text-[11px] font-semibold text-emerald-300 shadow-lg backdrop-blur-md hover:bg-emerald-500 hover:text-zinc-950",
        compact ? "size-6 justify-center" : "gap-1.5 px-2.5 py-1",
        className ?? "top-2 right-2",
      )}
    >
      <Camera aria-hidden className="size-3.5" />
      {compact ? null : label}
    </button>
  );
}

interface ItemControlsProps {
  /** Path of the array, e.g. "page.blocks.3.items". */
  list: string;
  index: number;
  length: number;
  className?: string;
  children?: ReactNode;
}

/** Floating ↑ ↓ duplicate / delete toolbar for one item of an editable list. */
export function ItemControls({ list, index, length, className, children }: ItemControlsProps) {
  const api = useContentApi();
  if (!api.editing) return null;

  const button = (op: ListOp, icon: ReactNode, title: string, disabled = false) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        stop(event);
        if (op === "remove" && !window.confirm("Delete this item?")) return;
        api.listOp?.(list, index, op);
      }}
      className={cn(
        "grid size-6 place-items-center rounded-full text-zinc-200 hover:bg-zinc-700 disabled:opacity-30",
        op === "remove" && "hover:bg-rose-500 hover:text-white",
      )}
    >
      {icon}
    </button>
  );

  return (
    <span
      data-editor-ui
      data-item-controls
      className={cn(
        "absolute -top-3 right-3 z-30 inline-flex items-center gap-0.5 rounded-full border border-zinc-700 bg-zinc-950/95 p-0.5 shadow-xl",
        className,
      )}
    >
      {children}
      {button("up", <ArrowUp className="size-3.5" />, "Move up", index === 0)}
      {button("down", <ArrowDown className="size-3.5" />, "Move down", index === length - 1)}
      {button("duplicate", <Copy className="size-3.5" />, "Duplicate")}
      {button("remove", <Trash2 className="size-3.5" />, "Delete")}
    </span>
  );
}

interface AddItemButtonProps {
  list: string;
  template: unknown;
  label: string;
  className?: string;
}

export function AddItemButton({ list, template, label, className }: AddItemButtonProps) {
  const api = useContentApi();
  if (!api.editing) return null;

  return (
    <button
      type="button"
      data-editor-ui
      onClick={(event) => {
        stop(event);
        api.pushItem?.(list, structuredClone(template));
      }}
      className={cn(
        "flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-emerald-500/50 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10",
        className,
      )}
    >
      <Plus aria-hidden className="size-4" />
      {label}
    </button>
  );
}
