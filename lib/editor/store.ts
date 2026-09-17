"use client";

import {
  loadContent,
  publish as publishAction,
  sendTestEmail as sendTestEmailAction,
  uploadImage,
  type EmailEnvironment,
} from "@/app/admin/actions";
import { createBlock, shortId } from "@/lib/blocks";
import { getAt, setAt, type ListOp } from "@/lib/editor/content-context";
import { imageDb } from "@/lib/editor/idb";
import type { EmailSettings } from "@/lib/email";
import type { PageContent, SiteContent } from "@/types/content";

export interface Draft {
  site: SiteContent;
  pages: Record<string, PageContent>;
  /** Booking email settings (content/email.json) — never rendered on the public site. */
  email: EmailSettings;
}

export interface PublishStatus {
  state: "idle" | "running" | "done" | "error";
  message: string;
  url?: string;
}

export interface EditorState {
  status: "loading" | "ready" | "error";
  error: string | null;
  mode: string;
  emailEnv: EmailEnvironment | null;
  version: string;
  /** Last published content. */
  base: Draft | null;
  draft: Draft | null;
  past: Draft[];
  future: Draft[];
  slug: string;
  /** Local previews for uploaded images: public src → object URL. */
  previews: Record<string, string>;
  publish: PublishStatus;
  settingsOpen: boolean;
}

const DRAFT_KEY = "apex-admin-draft-v2";
const RESERVED_SLUGS = ["home", "admin", "api", "uploads", "gallery", "reviews", "icon"];
const HISTORY_LIMIT = 100;
const MAX_IMAGE_EDGE = 2000;
const MAX_IMAGE_BYTES = 2_500_000;

type Listener = () => void;

/** Collects every string in a value (used to find referenced uploads). */
function collectStrings(value: unknown, into = new Set<string>()): Set<string> {
  if (typeof value === "string") into.add(value);
  else if (value && typeof value === "object") Object.values(value).forEach((child) => collectStrings(child, into));
  return into;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Gives list items with an `id` a fresh, unique one (ids are used as React keys and anchors). */
function withUniqueId<T>(item: T, siblings: unknown[]): T {
  if (!item || typeof item !== "object" || !("id" in item) || typeof item.id !== "string") return item;
  const taken = new Set(siblings.map((sibling) => (sibling as { id?: string })?.id));
  if (!taken.has(item.id)) return item;
  const stem = item.id.replace(/-[a-z0-9]{5}$/, "");
  return { ...item, id: shortId(stem) };
}

async function toBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

/** Downscales in the browser so phone photos (8–15 MB) upload as light WebP/JPEG files. */
async function prepareImage(file: File): Promise<{ blob: Blob; extension: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string, quality: number) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Encodage impossible"))), type, quality),
    );

  let blob = await encode("image/webp", 0.82);
  // Safari can't encode WebP and silently returns PNG: fall back to JPEG.
  if (blob.type !== "image/webp") blob = await encode("image/jpeg", 0.85);
  if (blob.size > MAX_IMAGE_BYTES) blob = await encode(blob.type, 0.6);
  return { blob, extension: blob.type === "image/webp" ? "webp" : "jpg" };
}

export class EditorStore {
  private state: EditorState = {
    status: "loading",
    error: null,
    mode: "",
    emailEnv: null,
    version: "",
    base: null,
    draft: null,
    past: [],
    future: [],
    slug: "home",
    previews: {},
    publish: { state: "idle", message: "" },
    settingsOpen: false,
  };
  private listeners = new Set<Listener>();
  private loading = false;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = () => this.state;

  private set(patch: Partial<EditorState>) {
    const next = { ...this.state, ...patch };
    // Undo/redo/discard can remove the page being edited (e.g. undoing its creation): fall back to home.
    if (next.draft && !next.draft.pages[next.slug]) next.slug = "home";
    this.state = next;
    for (const listener of this.listeners) {
      // Listeners may belong to a canvas iframe that has since been unloaded.
      try {
        listener();
      } catch {
        this.listeners.delete(listener);
      }
    }
  }

  /* --------------------------------------------------------------- loading */

  async load() {
    if (this.loading) return;
    this.loading = true;
    try {
      await this.loadOnce();
    } finally {
      this.loading = false;
    }
  }

  private async loadOnce() {
    this.set({ status: "loading", error: null });
    const result = await loadContent();
    if (!result.ok) {
      this.set({ status: "error", error: result.error });
      return;
    }
    const { site, pages, email, version, mode, emailEnv } = result.data;
    const base: Draft = { site, pages, email };
    let draft = base;

    const saved = readSavedDraft();
    if (saved) {
      const sameBase = saved.version === version;
      if (
        sameBase ||
        window.confirm(
          "An unpublished draft exists, but the site has changed since. Restore it anyway? (Cancel = start from the live site)",
        )
      ) {
        draft = saved.draft;
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    }

    const previews = await this.restorePreviews(base, draft);
    this.set({ status: "ready", base, draft, version, mode, emailEnv, previews, past: [], future: [] });
  }

  /** Re-creates object URLs for pending uploads and drops the ones nothing references anymore. */
  private async restorePreviews(base: Draft, draft: Draft): Promise<Record<string, string>> {
    const previews: Record<string, string> = {};
    const inDraft = collectStrings(draft);
    const inBase = collectStrings(base);
    try {
      for (const [src, blob] of await imageDb.entries()) {
        const abandoned = !inDraft.has(src);
        // Already published: keep the preview only until the live deployment serves the file.
        const live = !abandoned && inBase.has(src) && (await fetch(src, { method: "HEAD" }).then((r) => r.ok, () => false));
        if (abandoned || live) {
          await imageDb.delete(src);
        } else {
          previews[src] = URL.createObjectURL(blob);
        }
      }
    } catch (error) {
      console.warn("[admin] image previews unavailable", error);
    }
    return previews;
  }

  /* -------------------------------------------------------------- mutation */

  private commit(next: Draft) {
    const { draft, past } = this.state;
    if (!draft || next === draft) return;
    this.set({ draft: next, past: [...past, draft].slice(-HISTORY_LIMIT), future: [] });
    saveDraft(this.state.version, next);
  }

  /** Canvas paths use `page.` for the current page; the store works on `pages.<slug>.`. */
  resolvePath(path: string): string {
    return path.startsWith("page.") ? `pages.${this.state.slug}.${path.slice(5)}` : path;
  }

  get(path: string): unknown {
    return getAt(this.state.draft, this.resolvePath(path));
  }

  setAt = (path: string, value: unknown) => {
    const { draft } = this.state;
    if (!draft) return;
    this.commit(setAt(draft, this.resolvePath(path), value));
  };

  private updateList(path: string, update: (list: unknown[]) => unknown[]) {
    const list = this.get(path);
    this.setAt(path, update(Array.isArray(list) ? [...list] : []));
  }

  listOp = (path: string, index: number, op: ListOp) => {
    this.updateList(path, (list) => {
      if (op === "remove") list.splice(index, 1);
      if (op === "duplicate") list.splice(index + 1, 0, withUniqueId(structuredClone(list[index]), list));
      const target = op === "up" ? index - 1 : op === "down" ? index + 1 : -1;
      if (target >= 0 && target < list.length) [list[index], list[target]] = [list[target], list[index]];
      return list;
    });
  };

  pushItem = (path: string, item: unknown) => {
    this.updateList(path, (list) => [...list, withUniqueId(item, list)]);
  };

  insertAt = (path: string, index: number, item: unknown) => {
    this.updateList(path, (list) => {
      list.splice(index, 0, withUniqueId(item, list));
      return list;
    });
  };

  async setImage(path: string, file: File, alsoSet?: Record<string, unknown>) {
    if (!file.type.startsWith("image/")) {
      window.alert("This file is not an image.");
      return;
    }
    try {
      const { blob, extension } = await prepareImage(file);
      const name = slugify(file.name.replace(/\.[^.]+$/, "")) || "photo";
      const src = `/uploads/${Date.now().toString(36)}-${name}.${extension}`;
      await imageDb.put(src, blob).catch(() => undefined);
      this.set({ previews: { ...this.state.previews, [src]: URL.createObjectURL(blob) } });

      // One history entry for the image and its side effects.
      let next = setAt(this.state.draft!, this.resolvePath(path), src);
      for (const [extraPath, value] of Object.entries(alsoSet ?? {})) {
        next = setAt(next, this.resolvePath(extraPath), value);
      }
      this.commit(next);
    } catch (error) {
      console.error("[admin] image processing failed", error);
      window.alert("This image could not be read. Try a JPG or PNG.");
    }
  }

  resolveSrc = (src: string) => this.state.previews[src] ?? src;

  undo = () => {
    const { past, draft, future } = this.state;
    const previous = past.at(-1);
    if (!previous || !draft) return;
    this.set({ draft: previous, past: past.slice(0, -1), future: [draft, ...future] });
    saveDraft(this.state.version, previous);
  };

  redo = () => {
    const { past, draft, future } = this.state;
    const [next, ...rest] = future;
    if (!next || !draft) return;
    this.set({ draft: next, past: [...past, draft], future: rest });
    saveDraft(this.state.version, next);
  };

  discardAll = () => {
    const { base } = this.state;
    if (!base) return;
    this.commit(base);
    localStorage.removeItem(DRAFT_KEY);
  };

  /* ----------------------------------------------------------------- pages */

  setSlug = (slug: string) => this.set({ slug });

  setSettingsOpen = (settingsOpen: boolean) => this.set({ settingsOpen });

  /** Returns an error message, or null when the page was created. */
  addPage(title: string, requestedSlug: string): string | null {
    const { draft } = this.state;
    if (!draft) return "Editor not loaded.";
    const slug = slugify(requestedSlug || title);
    if (!slug || RESERVED_SLUGS.includes(slug)) return "This address is not available.";
    if (draft.pages[slug]) return "A page with this address already exists.";

    const hero = createBlock("hero");
    const page: PageContent = {
      slug,
      title: title.trim() || slug,
      seoTitle: "",
      seoDescription: "",
      blocks: [
        { ...hero, titleLine1: title.trim() || "New page", titleLine2: "" } as PageContent["blocks"][number],
        createBlock("text"),
        createBlock("cta"),
      ],
    };
    this.commit({ ...draft, pages: { ...draft.pages, [slug]: page } });
    this.set({ slug });
    return null;
  }

  deletePage(slug: string) {
    const { draft } = this.state;
    if (!draft || slug === "home") return;
    const pages = { ...draft.pages };
    delete pages[slug];
    this.commit({ ...draft, pages });
    this.set({ slug: "home" });
  }

  /* --------------------------------------------------------------- publish */

  changeCount(): number {
    const { base, draft } = this.state;
    if (!base || !draft) return 0;
    const slugs = new Set([...Object.keys(base.pages), ...Object.keys(draft.pages)]);
    let count = JSON.stringify(base.site) === JSON.stringify(draft.site) ? 0 : 1;
    if (JSON.stringify(base.email) !== JSON.stringify(draft.email)) count += 1;
    for (const slug of slugs) {
      if (JSON.stringify(base.pages[slug]) !== JSON.stringify(draft.pages[slug])) count += 1;
    }
    return count;
  }

  publish = async () => {
    const { draft, base, version, previews } = this.state;
    if (!draft || !base || this.state.publish.state === "running") return;

    const fail = (message: string) => this.set({ publish: { state: "error", message } });
    try {
      const referenced = collectStrings(draft);
      const published = collectStrings(base);
      const pending = Object.keys(previews).filter((src) => referenced.has(src) && !published.has(src));

      const images: Record<string, string> = {};
      for (const [index, src] of pending.entries()) {
        this.set({ publish: { state: "running", message: `Uploading photos (${index + 1}/${pending.length})…` } });
        const blob = await fetch(previews[src]!).then((response) => response.blob());
        const result = await uploadImage(src, await toBase64(blob));
        if (!result.ok) return fail(result.error);
        images[src] = result.data;
      }

      this.set({ publish: { state: "running", message: "Publishing…" } });
      const result = await publishAction({ site: draft.site, pages: draft.pages, email: draft.email, version, images });
      if (!result.ok) {
        return fail(
          result.conflict
            ? `${result.error} Reload the page: your changes will be offered as a draft.`
            : result.error,
        );
      }

      localStorage.removeItem(DRAFT_KEY);
      this.set({
        base: draft,
        version: result.data.version,
        publish: {
          state: "done",
          message:
            this.state.mode === "github"
              ? "Published ✓ — the live site will update in 1–2 minutes (Vercel deployment)."
              : "Saved ✓ (local mode: files written to disk).",
          url: result.data.commitUrl,
        },
      });
    } catch (error) {
      console.error("[admin] publish failed", error);
      fail("Publishing failed. Check your connection and try again.");
    }
  };

  dismissPublish = () => this.set({ publish: { state: "idle", message: "" } });

  /** Sends the (unpublished) confirmation template to the owner's inbox. Returns a status message. */
  sendTestEmail = async (): Promise<{ ok: boolean; message: string }> => {
    const { draft } = this.state;
    if (!draft) return { ok: false, message: "Editor not loaded." };
    const result = await sendTestEmailAction(draft.email, draft.site.business.name);
    return result.ok
      ? { ok: true, message: `Test email sent to ${result.data}.` }
      : { ok: false, message: result.error };
  };
}

function readSavedDraft(): { version: string; draft: Draft } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as { version: string; draft: Draft }) : null;
  } catch {
    return null;
  }
}

function saveDraft(version: string, draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ version, draft }));
  } catch (error) {
    console.warn("[admin] draft not saved locally", error);
  }
}

declare global {
  interface Window {
    __apexEditor?: EditorStore;
  }
}
