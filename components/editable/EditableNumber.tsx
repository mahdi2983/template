"use client";

import { useState } from "react";
import { getAt, useContentApi } from "@/lib/editor/content-context";

interface EditableNumberProps {
  p: string;
  format: (value: number) => string;
}

/** Number shown formatted (e.g. "$209"); in the editor, focusing it reveals the raw value. */
export function EditableNumber({ p, format }: EditableNumberProps) {
  const api = useContentApi();
  const value = Number(getAt(api.root, p) ?? 0);
  const [focused, setFocused] = useState(false);

  if (!api.editing) return <>{format(value)}</>;

  return (
    <span
      key={focused ? "raw" : "formatted"}
      data-edit-path={p}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      inputMode="decimal"
      className="apex-editable"
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        setFocused(false);
        const parsed = Number.parseFloat((event.currentTarget.textContent ?? "").replace(/[^0-9.]/g, ""));
        if (Number.isFinite(parsed) && parsed !== value) api.setAt?.(p, parsed);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    >
      {focused ? String(value) : format(value)}
    </span>
  );
}
