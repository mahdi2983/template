"use client";

import {
  ExternalLink,
  FilePlus2,
  Loader2,
  LogOut,
  Monitor,
  Redo2,
  Rocket,
  Settings2,
  Smartphone,
  Tablet,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { logout } from "@/app/admin/actions";
import { SettingsDrawer } from "@/components/admin/SettingsDrawer";
import { cn } from "@/lib/cn";
import { EditorStore } from "@/lib/editor/store";
import { focusRing, pressable, surface } from "@/lib/styles";

const DEVICES = [
  { id: "mobile", label: "Mobile", width: "390px", icon: Smartphone },
  { id: "tablet", label: "Tablet", width: "768px", icon: Tablet },
  { id: "desktop", label: "Desktop", width: "100%", icon: Monitor },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

export function AdminApp() {
  const [store] = useState(() => new EditorStore());
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const [device, setDevice] = useState<DeviceId>("mobile");
  const [newPageOpen, setNewPageOpen] = useState(false);

  useEffect(() => {
    window.__apexEditor = store;
    void store.load();
    return () => {
      delete window.__apexEditor;
    };
  }, [store]);

  const changes = store.changeCount();

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (store.changeCount() > 0 || store.getState().publish.state === "running") event.preventDefault();
    };
    const shortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!(event.ctrlKey || event.metaKey) || target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
      }
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("keydown", shortcuts);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("keydown", shortcuts);
    };
  }, [store]);

  if (state.status !== "ready" || !state.draft) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 text-center">
        {state.status === "error" ? (
          <div className={cn(surface, "max-w-md p-6")}>
            <p className="text-sm text-rose-300">{state.error}</p>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" onClick={() => void store.load()} className={toolbarButton}>
                Retry
              </button>
              <Link href="/admin/login" className={toolbarButton}>
                Sign in again
              </Link>
            </div>
          </div>
        ) : (
          <Loader2 aria-label="Loading" className="size-6 animate-spin text-emerald-400" />
        )}
      </main>
    );
  }

  const pages = Object.values(state.draft.pages).sort((a, b) =>
    a.slug === "home" ? -1 : b.slug === "home" ? 1 : a.title.localeCompare(b.title),
  );
  const logo = state.draft.site.business.logo ? store.resolveSrc(state.draft.site.business.logo) : "";
  const width = DEVICES.find((item) => item.id === device)!.width;
  const publishing = state.publish.state === "running";

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="z-20 flex flex-wrap items-center gap-2 border-b border-zinc-800/70 bg-zinc-950/90 px-3 py-2 backdrop-blur-xl">
        <span className="relative mr-1 grid size-9 place-items-center overflow-hidden rounded-xl bg-linear-to-br from-emerald-400 to-sky-400 text-sm font-bold text-zinc-950">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- may be a local blob: preview
            <img src={logo} alt="" className="size-full bg-zinc-950 object-contain p-0.5" />
          ) : (
            state.draft.site.business.monogram
          )}
        </span>

        <label className="sr-only" htmlFor="page-select">
          Page
        </label>
        <select
          id="page-select"
          value={state.slug}
          onChange={(event) => {
            if (event.target.value === "__new") setNewPageOpen(true);
            else store.setSlug(event.target.value);
          }}
          className="min-h-[36px] max-w-[11rem] rounded-xl border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
        >
          {pages.map((page) => (
            <option key={page.slug} value={page.slug}>
              {page.slug === "home" ? "Home" : page.title}
            </option>
          ))}
          <option value="__new">+ New page…</option>
        </select>

        <a
          href={state.slug === "home" ? "/" : `/${state.slug}`}
          target="_blank"
          rel="noreferrer"
          title="Open the live page"
          className={iconButton}
        >
          <ExternalLink aria-hidden className="size-4" />
        </a>

        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-0.5" role="group" aria-label="Device">
          {DEVICES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              aria-pressed={device === id}
              onClick={() => setDevice(id)}
              className={cn(
                "grid size-8 place-items-center rounded-lg text-zinc-400 hover:text-zinc-100",
                device === id && "bg-zinc-700 text-zinc-50",
              )}
            >
              <Icon aria-hidden className="size-4" />
            </button>
          ))}
        </div>

        <button type="button" title="Undo (Ctrl+Z)" onClick={store.undo} disabled={!state.past.length} className={iconButton}>
          <Undo2 aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Shift+Z)"
          onClick={store.redo}
          disabled={!state.future.length}
          className={iconButton}
        >
          <Redo2 aria-hidden className="size-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          {state.mode === "local" ? (
            <span className="hidden rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 sm:inline">
              Local mode
            </span>
          ) : null}
          <button type="button" onClick={() => store.setSettingsOpen(true)} className={toolbarButton}>
            <Settings2 aria-hidden className="size-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button
            type="button"
            onClick={() => void store.publish()}
            disabled={publishing || changes === 0}
            className={cn(
              "inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500",
              pressable,
              focusRing,
            )}
          >
            {publishing ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Rocket aria-hidden className="size-4" />}
            Publish
            {changes > 0 ? (
              <span className="rounded-full bg-zinc-950/20 px-1.5 text-xs">{changes}</span>
            ) : null}
          </button>
          <form action={logout}>
            <button type="submit" title="Sign out" className={iconButton}>
              <LogOut aria-hidden className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden bg-zinc-950/60 p-3">
        <iframe
          title="Editable site preview"
          src="/admin/canvas"
          className="mx-auto block h-full rounded-2xl border border-zinc-800 bg-[#09090b] shadow-2xl transition-[width] duration-300"
          style={{ width, maxWidth: "100%" }}
        />
        <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900/90 px-3 py-1 text-[11px] text-zinc-400 shadow-lg">
          Click any text to edit it · 📷 to change a photo
        </p>
      </div>

      {state.publish.state !== "idle" ? (
        <Toast tone={state.publish.state} onClose={publishing ? undefined : store.dismissPublish}>
          {state.publish.message}
          {state.publish.url ? (
            <a href={state.publish.url} target="_blank" rel="noreferrer" className="ml-2 underline">
              View commit
            </a>
          ) : null}
        </Toast>
      ) : null}

      {state.settingsOpen ? <SettingsDrawer store={store} state={state} /> : null}
      {newPageOpen ? <NewPageDialog store={store} onClose={() => setNewPageOpen(false)} /> : null}
    </div>
  );
}

const iconButton =
  "grid size-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-50 disabled:opacity-30";
const toolbarButton =
  "inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-100 hover:bg-zinc-800";

function Toast({ tone, onClose, children }: { tone: string; onClose?: () => void; children: ReactNode }) {
  return (
    <div
      role="status"
      className={cn(
        "fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-2 rounded-2xl border p-3 text-sm shadow-2xl backdrop-blur-xl",
        tone === "error" && "border-rose-500/40 bg-rose-950/90 text-rose-100",
        tone === "done" && "border-emerald-500/40 bg-emerald-950/90 text-emerald-100",
        tone === "running" && "border-zinc-700 bg-zinc-900/95 text-zinc-100",
      )}
    >
      <p className="flex-1">{children}</p>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Close" className="text-current opacity-70 hover:opacity-100">
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

function NewPageDialog({ store, onClose }: { store: EditorStore; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = store.addPage(title, slug);
    if (message) setError(message);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className={cn(surface, "w-full max-w-sm bg-zinc-900/95 p-5")}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <FilePlus2 aria-hidden className="size-5 text-emerald-400" />
            New page
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-zinc-100">
            <X className="size-5" />
          </button>
        </div>
        <label className="mt-4 block text-xs font-medium text-zinc-400">
          Title
          <input
            autoFocus
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Ceramic coating"
            className={inputClass}
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-zinc-400">
          Address (optional)
          <div className="mt-1 flex items-center rounded-xl border border-zinc-800 bg-zinc-950/60 pl-3 text-sm text-zinc-500 focus-within:border-emerald-500/60">
            /
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="ceramic-coating"
              className="min-h-[40px] w-full bg-transparent px-1 text-zinc-100 focus:outline-none"
            />
          </div>
        </label>
        <p className="mt-2 text-[11px] text-zinc-500">
          The page starts with a hero, a text section and a booking button — then add any sections you like.
        </p>
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        <button
          type="submit"
          className={cn(
            "mt-4 flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-emerald-500 text-sm font-bold text-zinc-950 hover:bg-emerald-400",
            pressable,
            focusRing,
          )}
        >
          Create page
        </button>
      </form>
    </div>
  );
}

export const inputClass =
  "mt-1 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none";
