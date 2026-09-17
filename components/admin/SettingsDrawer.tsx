"use client";

import { Loader2, Mail, RotateCcw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Field, type FieldContext } from "@/components/admin/FieldEditor";
import { cn } from "@/lib/cn";
import type { EditorState, EditorStore } from "@/lib/editor/store";

const TABS = [
  { id: "page", label: "This page" },
  { id: "business", label: "Business" },
  { id: "services", label: "Packages" },
  { id: "emails", label: "Emails" },
  { id: "texts", label: "Shared texts" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Site-wide copy that appears in several places (header, sticky bar, booking sheet…). */
const SHARED_TEXT_KEYS = ["header", "footer", "stickyBar", "serviceCard", "booking", "reviewModal"] as const;

const EMAIL_FIELDS = [
  "notifyEmail",
  "senderName",
  "replyTo",
  "ownerSubject",
  "sendCustomerConfirmation",
  "customerSubject",
  "customerHeading",
  "customerIntro",
  "customerOutro",
  "customerFooter",
] as const;

export function SettingsDrawer({ store, state }: { store: EditorStore; state: EditorState }) {
  const [tab, setTab] = useState<TabId>("page");
  const draft = state.draft!;
  const page = draft.pages[state.slug]!;
  const pagePath = `pages.${state.slug}`;

  const ctx: FieldContext = {
    onChange: store.setAt,
    onPickImage: (path, file) => void store.setImage(path, file),
    resolveSrc: store.resolveSrc,
    serviceOptions: draft.site.services.map(({ id, name }) => ({ id, name })),
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={() => store.setSettingsOpen(false)}>
      <aside
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-900/95 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-base font-semibold text-zinc-100">Settings</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => store.setSettingsOpen(false)}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-zinc-800 px-3 py-2" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-100",
                tab === item.id && "bg-emerald-500/15 text-emerald-300",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {tab === "page" ? (
            <>
              <p className="mb-2 text-xs text-zinc-500">
                Address: <span className="font-mono text-zinc-300">/{state.slug === "home" ? "" : state.slug}</span>
              </p>
              <Field name="title" path={`${pagePath}.title`} value={page.title} ctx={ctx} />
              <Field name="seoTitle" path={`${pagePath}.seoTitle`} value={page.seoTitle} ctx={ctx} />
              <Field name="seoDescription" path={`${pagePath}.seoDescription`} value={page.seoDescription} ctx={ctx} />
              <p className="mt-3 mb-1 text-[11px] text-zinc-500">Section details (alt texts, links, options):</p>
              <Field name="blocks" path={`${pagePath}.blocks`} value={page.blocks} ctx={ctx} />
              {state.slug !== "home" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete the page “${page.title}”? It will disappear at the next publish.`)) {
                      store.deletePage(state.slug);
                      store.setSettingsOpen(false);
                    }
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 aria-hidden className="size-4" />
                  Delete this page
                </button>
              ) : null}
            </>
          ) : null}

          {tab === "business" ? (
            <>
              <Field name="business" path="site.business" value={draft.site.business} ctx={ctx} />
              <Field name="meta" path="site.meta" value={draft.site.meta} ctx={ctx} />
            </>
          ) : null}

          {tab === "services" ? (
            <>
              <p className="mb-2 text-xs text-zinc-500">
                Names, taglines and included services can also be edited directly on the page.
              </p>
              {draft.site.services.map((service, index) => (
                <Field
                  key={`${service.id}-${index}`}
                  name={service.name}
                  path={`site.services.${index}`}
                  value={service}
                  ctx={ctx}
                  depth={1}
                />
              ))}
            </>
          ) : null}

          {tab === "emails" ? <EmailSettingsTab store={store} state={state} ctx={ctx} /> : null}

          {tab === "texts"
            ? SHARED_TEXT_KEYS.map((key) => (
                <Field key={key} name={key} path={`site.${key}`} value={draft.site[key]} ctx={ctx} depth={1} />
              ))
            : null}
        </div>

        <div className="border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Discard all unpublished changes?")) store.discardAll();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-rose-300"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            Discard all unpublished changes
          </button>
        </div>
      </aside>
    </div>
  );
}

function EmailSettingsTab({ store, state, ctx }: { store: EditorStore; state: EditorState; ctx: FieldContext }) {
  const email = state.draft!.email;
  const env = state.emailEnv;
  const [test, setTest] = useState<{ running: boolean; ok?: boolean; message?: string }>({ running: false });

  return (
    <>
      <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 text-[11px] leading-relaxed text-zinc-400">
        <p>Booking emails are sent with internal system. Changes apply to the live site after you publish.</p>
        <p className="mt-1.5">
          Sender address: <span className="font-mono text-zinc-200">{env?.senderAddress || "—"}</span>
          {env && !env.apiKeyConfigured ? <span className="text-rose-300"> · email service not configured</span> : null}
        </p>
        <p className="mt-1">If you need to change this address contact Mahdi Studios.</p>
      </div>

      {EMAIL_FIELDS.map((key) => (
        <Field key={key} name={key} path={`email.${key}`} value={email[key]} ctx={ctx} />
      ))}
      {!email.notifyEmail && env?.fallbackRecipient ? (
        <p className="text-[11px] text-zinc-500">
          Empty owner email: bookings go to <span className="font-mono">{env.fallbackRecipient}</span>.
        </p>
      ) : null}

      <div className="mt-4 rounded-2xl border border-zinc-800 p-3">
        <button
          type="button"
          disabled={test.running}
          onClick={async () => {
            setTest({ running: true });
            const result = await store.sendTestEmail();
            setTest({ running: false, ...result });
          }}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs font-semibold text-zinc-100 hover:border-emerald-500/60 disabled:opacity-50"
        >
          {test.running ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Mail aria-hidden className="size-4" />}
          Send me a test confirmation
        </button>
        <p className="mt-1.5 text-[11px] text-zinc-500">
          Uses the settings above (even unpublished) with sample booking data, sent to the owner email.
        </p>
        {test.message ? (
          <p className={cn("mt-2 text-xs", test.ok ? "text-emerald-300" : "text-rose-300")}>{test.message}</p>
        ) : null}
      </div>
    </>
  );
}
