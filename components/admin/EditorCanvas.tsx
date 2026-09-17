"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { PageShell } from "@/components/SitePage";
import { ContentProvider, type ContentApi } from "@/lib/editor/content-context";
import type { EditorStore } from "@/lib/editor/store";

/**
 * Runs inside the admin iframe. The draft lives in the parent window's store
 * (same origin), so the iframe only renders it and forwards edits.
 */
export function EditorCanvas() {
  const [store, setStore] = useState<EditorStore | null>(null);

  useEffect(() => {
    if (window.parent === window) {
      window.location.replace("/admin");
      return;
    }
    // The parent registers its store on mount; wait briefly in case the iframe is faster.
    let attempts = 0;
    const timer = window.setInterval(() => {
      const parentStore = window.parent.__apexEditor;
      if (parentStore || ++attempts > 50) {
        window.clearInterval(timer);
        if (parentStore) setStore(parentStore);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  return store ? <CanvasContent store={store} /> : null;
}

interface Popover {
  path: string;
  top: number;
  left: number;
}

function CanvasContent({ store }: { store: EditorStore }) {
  const { draft, slug, previews } = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const page = draft?.pages[slug];
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingPick = useRef<{ path: string; alsoSet?: Record<string, unknown> } | null>(null);
  const [popover, setPopover] = useState<Popover | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setPopover(null);
  }, [slug]);

  // Ctrl+Z / Ctrl+Shift+Z also work while the focus is inside the preview (except while typing).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
      const target = event.target as HTMLElement;
      if (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      event.preventDefault();
      if (event.shiftKey) store.redo();
      else store.undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [store]);

  const api = useMemo<ContentApi | null>(
    () =>
      draft && page
        ? {
            root: { site: draft.site, page },
            editing: true,
            setAt: store.setAt,
            listOp: store.listOp,
            pushItem: store.pushItem,
            insertAt: store.insertAt,
            pickImage: (path, alsoSet) => {
              pendingPick.current = { path, alsoSet };
              fileInput.current?.click();
            },
            resolveSrc: (src) => previews[src] ?? src,
          }
        : null,
    [draft, page, previews, store],
  );

  if (!api) return null;

  // Clicking text edits it instead of triggering the button, link or accordion around it.
  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const popoverTarget = target.closest<HTMLElement>("[data-edit-popover]");
    if (popoverTarget) {
      event.preventDefault();
      event.stopPropagation();
      const rect = popoverTarget.getBoundingClientRect();
      setPopover({
        path: popoverTarget.dataset.editPopover!,
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)),
      });
      return;
    }
    if (target.closest("[data-edit-path]")) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const link = target.closest("a[href]");
    if (link && !link.getAttribute("href")!.startsWith("#")) event.preventDefault();
  };

  return (
    <div
      data-editing
      onClickCapture={handleClickCapture}
      onSubmitCapture={(event) => {
        // Never send real booking emails from the editor.
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <ContentProvider value={api}>
        <PageShell key={slug} />
      </ContentProvider>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          const pick = pendingPick.current;
          event.target.value = "";
          if (file && pick) void store.setImage(pick.path, file, pick.alsoSet);
        }}
      />

      {popover ? (
        <TextPopover
          key={popover.path}
          popover={popover}
          initial={String(store.get(popover.path) ?? "")}
          onCommit={(value) => store.setAt(popover.path, value)}
          onClose={() => setPopover(null)}
        />
      ) : null}
    </div>
  );
}

interface TextPopoverProps {
  popover: Popover;
  initial: string;
  onCommit: (value: string) => void;
  onClose: () => void;
}

/** Floating input for labels inside buttons, where in-place editing is unreliable. */
function TextPopover({ popover, initial, onCommit, onClose }: TextPopoverProps) {
  const [value, setValue] = useState(initial);
  const closed = useRef(false);
  // Enter/Escape unmount the input, which also fires blur: only the first call counts.
  const done = (save: boolean) => {
    if (closed.current) return;
    closed.current = true;
    if (save && value.trim() !== initial) onCommit(value.trim());
    onClose();
  };

  return (
    <div
      data-editor-ui
      className="fixed z-[100] w-72 rounded-2xl border border-emerald-500/50 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl"
      style={{ top: popover.top, left: popover.left }}
    >
      <input
        autoFocus
        onFocus={(event) => event.currentTarget.select()}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => done(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") done(true);
          if (event.key === "Escape") done(false);
        }}
        className="min-h-[40px] w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
      />
      <p className="px-1 pt-1.5 text-[10px] text-zinc-500">Enter to save · Esc to cancel</p>
    </div>
  );
}
