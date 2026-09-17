"use client";

import { useLayoutEffect, useRef } from "react";
import { getAt, useContentApi } from "@/lib/editor/content-context";

interface TProps {
  /** Dotted content path, e.g. "page.blocks.0.title". */
  p: string;
  /**
   * Text sitting inside a <button>: browsers handle contentEditable there poorly,
   * so the editor opens a floating input instead of editing in place.
   */
  inButton?: boolean;
}

/**
 * Editable text. On the public site it renders the plain string and nothing else;
 * in the admin canvas it becomes click-to-edit while inheriting the surrounding typography.
 */
export function T({ p, inButton = false }: TProps) {
  const api = useContentApi();
  const value = String(getAt(api.root, p) ?? "");

  if (!api.editing) return <>{value}</>;
  if (inButton) {
    return (
      <span data-edit-popover={p} className="apex-editable">
        {value}
      </span>
    );
  }
  return <InlineEditable p={p} value={value} onCommit={(next) => api.setAt?.(p, next)} />;
}

interface InlineEditableProps {
  p: string;
  value: string;
  onCommit: (value: string) => void;
}

function InlineEditable({ p, value, onCommit }: InlineEditableProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // The DOM owns the text while focused; only sync from state when the user isn't typing.
  useLayoutEffect(() => {
    const element = ref.current;
    if (element && document.activeElement !== element && element.textContent !== value) {
      element.textContent = value;
    }
  }, [value]);

  return (
    <span
      ref={ref}
      data-edit-path={p}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      className="apex-editable"
      onBlur={(event) => {
        const next = (event.currentTarget.textContent ?? "").replace(/\s+/g, " ").trim();
        if (next !== value) onCommit(next);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === "Escape") {
          event.currentTarget.textContent = value;
          event.currentTarget.blur();
        }
      }}
      onKeyUp={(event) => event.stopPropagation()}
    />
  );
}
