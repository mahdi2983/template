"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ContentRoot } from "@/types/content";

export type ListOp = "up" | "down" | "duplicate" | "remove";

/** What the site components can do with content. On the public site only `root` is used. */
export interface ContentApi {
  root: ContentRoot;
  editing: boolean;
  setAt?: (path: string, value: unknown) => void;
  listOp?: (path: string, index: number, op: ListOp) => void;
  pushItem?: (path: string, item: unknown) => void;
  insertAt?: (path: string, index: number, item: unknown) => void;
  /** Opens the file picker; `alsoSet` is applied only once a file was actually chosen. */
  pickImage?: (path: string, alsoSet?: Record<string, unknown>) => void;
  /** Maps a stored src to what the browser should load (e.g. a not-yet-deployed upload preview). */
  resolveSrc?: (src: string) => string;
}

const ContentContext = createContext<ContentApi | null>(null);

export function ContentProvider({ value, children }: { value: ContentApi; children: ReactNode }) {
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContentApi(): ContentApi {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContentApi must be used inside <ContentProvider>");
  }
  return context;
}

/** Reads a dotted path ("page.blocks.0.title") from the current content root. */
export function useField<T>(path: string): T {
  return getAt(useContentApi().root, path) as T;
}

/** Resolved image src for a dotted path, honouring pending uploads in the editor. */
export function useImageSrc(path: string): string {
  const api = useContentApi();
  const src = (getAt(api.root, path) as string | undefined) ?? "";
  return api.resolveSrc ? api.resolveSrc(src) : src;
}

export function getAt(source: unknown, path: string): unknown {
  let current: unknown = source;
  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Immutable set: returns a copy of `source` with `value` at `path`, cloning only the touched branch. */
export function setAt<T>(source: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  const container = (source ?? {}) as Record<string, unknown> | unknown[];
  const next = rest.length === 0 ? value : setAt((container as Record<string, unknown>)[head!], rest.join("."), value);

  if (Array.isArray(container)) {
    const copy = [...container];
    copy[Number(head)] = next;
    return copy as T;
  }
  return { ...container, [head!]: next } as T;
}
