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
  /** Photos already sent to the repository: public src → git blob sha (or "local"). */
  uploads: Record<string, string>;
  /** Short status of a background action (photo upload), shown in the toolbar. */
  busy: string | null;
  publish: PublishStatus;
  settingsOpen: boolean;
  /** Branch the Publish button writes to, so a misconfigured deployment is visible. */
  branch: string;
}

const DRAFT_KEY = "apex-admin-draft-v3";
const RESERVED_SLUGS = ["home", "admin", "api", "uploads", "gallery", "reviews", "icon"];
const HISTORY_LIMIT = 100;
const MAX_IMAGE_EDGE = 2000;
const MAX_IMAGE_BYTES = 2_500_000;

type Listener = () => void;

const UPLOAD_PREFIX = "/uploads/";

/** Turns any thrown value into something worth showing to the client. */
function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^Error:\s*/, "").slice(0, 300);
}

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
    uploads: {},
    busy: null,
    publish: { state: "idle", message: "" },
    settingsOpen: false,
    branch: "",
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
    const { site, pages, email, version, mode, emailEnv, branch } = result.data;
    const base: Draft = { site, pages, email };
    let draft = base;
    let uploads: Record<string, string> = {};

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
        uploads = saved.uploads ?? {};
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    }

    const previews = await this.restorePreviews(base, draft);
    this.set({
      status: "ready",
      base,
      draft,
      version,
      mode,
      emailEnv,
      branch,
      previews,
      uploads,
      past: [],
      future: [],
    });
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
    this.save();
  }

  private save() {
    const { version, draft, uploads } = this.state;
    if (draft) saveDraft(version, draft, uploads);
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

    let blob: Blob;
    let src: string;
    try {
      const prepared = await prepareImage(file);
      blob = prepared.blob;
      const name = slugify(file.name.replace(/\.[^.]+$/, "")) || "photo";
      src = `${UPLOAD_PREFIX}${Date.now().toString(36)}-${name}.${prepared.extension}`;
    } catch (error) {
      console.error("[admin] image processing failed", error);
      window.alert("This image could not be read. Try a JPG or PNG.");
      return;
    }

    await imageDb.put(src, blob).catch(() => undefined);
    this.set({ previews: { ...this.state.previews, [src]: URL.createObjectURL(blob) } });

    // One history entry for the image and its side effects.
    let next = setAt(this.state.draft!, this.resolvePath(path), src);
    for (const [extraPath, value] of Object.entries(alsoSet ?? {})) {
      next = setAt(next, this.resolvePath(extraPath), value);
    }
    this.commit(next);

    // Send it to the repository straight away: the photo then no longer depends on
    // this browser (previews can be lost across devices, reloads or private mode).
    this.set({ busy: "Uploading photo…" });
    const result = await this.uploadOne(src, blob);
    this.set({ busy: null });
    if (!result.ok) {
      this.set({
        publish: { state: "error", message: `The photo could not be uploaded: ${result.error} It will be retried when you publish.` },
      });
    }
  }

  /** Uploads one prepared photo and remembers its git sha. */
  private async uploadOne(src: string, blob: Blob): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const result = await uploadImage(src, await toBase64(blob));
      if (!result.ok) return { ok: false, error: result.error };
      this.set({ uploads: { ...this.state.uploads, [src]: result.data } });
      this.save();
      return { ok: true };
    } catch (error) {
      console.error("[admin] image upload failed", src, error);
      return { ok: false, error: describe(error) };
    }
  }

  /** Best-effort lookup of a photo's bytes: IndexedDB first, then the in-memory preview. */
  private async findBlob(src: string): Promise<Blob | null> {
    const stored = await imageDb.get(src).catch(() => null);
    if (stored) return stored;
    const preview = this.state.previews[src];
    if (!preview) return null;
    try {
      return await fetch(preview).then((response) => response.blob());
    } catch {
      return null;
    }
  }

  resolveSrc = (src: string) => this.state.previews[src] ?? src;

  undo = () => {
    const { past, draft, future } = this.state;
    const previous = past.at(-1);
    if (!previous || !draft) return;
    this.set({ draft: previous, past: past.slice(0, -1), future: [draft, ...future] });
    this.save();
  };

  redo = () => {
    const { past, draft, future } = this.state;
    const [next, ...rest] = future;
    if (!next || !draft) return;
    this.set({ draft: next, past: [...past, draft], future: rest });
    this.save();
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
    const { draft, base, version } = this.state;
    if (!draft || !base || this.state.publish.state === "running") return;

    const fail = (message: string) => this.set({ publish: { state: "error", message } });
    try {
      const published = collectStrings(base);
      // Every photo the draft points at that the live site doesn't have yet.
      const needed = [...collectStrings(draft)].filter(
        (value) => value.startsWith(UPLOAD_PREFIX) && !published.has(value),
      );

      const images: Record<string, string> = {};
      for (const [index, src] of needed.entries()) {
        const known = this.state.uploads[src];
        if (known) {
          images[src] = known;
          continue;
        }
        // Not uploaded yet (or the upload failed earlier): retry from the local copy.
        this.set({ publish: { state: "running", message: `Uploading photos (${index + 1}/${needed.length})…` } });
        const blob = await this.findBlob(src);
        if (!blob) {
          return fail(
            `The photo "${src.slice(UPLOAD_PREFIX.length)}" is missing from this device — it was added from another browser or session. Select that photo again, then publish.`,
          );
        }
        const result = await this.uploadOne(src, blob);
        if (!result.ok) return fail(`The photo could not be uploaded: ${result.error}`);
        images[src] = this.state.uploads[src]!;
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
        uploads: {},
        version: result.data.version,
        publish: {
          state: "done",
          message:
            this.state.mode === "github"
              ? `Published to “${this.state.branch}” ✓ — the live site updates in 1–2 minutes.`
              : "Saved ✓ (local mode: files written to disk).",
          url: result.data.commitUrl,
        },
      });
    } catch (error) {
      console.error("[admin] publish failed", error);
      fail(`Publishing failed: ${describe(error)} — nothing was changed on the live site. Try again.`);
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

interface SavedDraft {
  version: string;
  draft: Draft;
  /** Photos already sent to the repository, so a reload never loses them. */
  uploads?: Record<string, string>;
}

function readSavedDraft(): SavedDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as SavedDraft) : null;
  } catch {
    return null;
  }
}

function saveDraft(version: string, draft: Draft, uploads: Record<string, string>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ version, draft, uploads }));
  } catch (error) {
    console.warn("[admin] draft not saved locally", error);
  }
}

declare global {
  interface Window {
    __apexEditor?: EditorStore;
  }
}
