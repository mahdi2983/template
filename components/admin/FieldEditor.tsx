"use client";

import { ArrowDown, ArrowUp, ChevronDown, ImageUp, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Generic form for any JSON value. Used in the settings drawer for everything that
 * can't be clicked on the page itself (SEO, hours, prices, alt texts…).
 */

const LABELS: Record<string, string> = {
  meta: "Référencement (SEO)",
  title: "Titre",
  description: "Description",
  shareTitle: "Titre de partage (réseaux sociaux)",
  shareImage: "Image de partage",
  appTitle: "Nom sur l'écran d'accueil (iPhone)",
  business: "Entreprise",
  name: "Nom",
  monogram: "Initiale du logo",
  city: "Ville",
  region: "Région / État",
  phoneDisplay: "Téléphone (affiché)",
  phoneE164: "Téléphone (format international, ex. +17045550142)",
  hoursLabel: "Horaires (texte long)",
  hoursShort: "Horaires (texte court)",
  openHour: "Heure d'ouverture (0–23)",
  closeHour: "Heure de fermeture (0–23)",
  openDays: "Jours d'ouverture (0 = dimanche … 6 = samedi)",
  timeZone: "Fuseau horaire",
  serviceRadiusMiles: "Rayon d'intervention (miles)",
  googleRating: "Note Google",
  googleReviewCount: "Nombre d'avis Google",
  geo: "Coordonnées GPS",
  latitude: "Latitude",
  longitude: "Longitude",
  services: "Forfaits",
  id: "Identifiant technique",
  tagline: "Accroche",
  durationMinutes: "Durée (minutes)",
  priceFrom: "Prix de départ ($)",
  features: "Prestations incluses",
  popular: "Mis en avant (« Most booked »)",
  accent: "Couleur d'accent",
  imageUrl: "Photo",
  seoTitle: "Titre SEO (vide = automatique)",
  seoDescription: "Description SEO (vide = description du site)",
  blocks: "Sections",
  items: "Éléments",
  src: "Photo",
  alt: "Texte alternatif (accessibilité)",
  beforeSrc: "Photo avant",
  afterSrc: "Photo après",
  beforeAlt: "Texte alternatif — avant",
  afterAlt: "Texte alternatif — après",
  beforeLabel: "Étiquette avant",
  afterLabel: "Étiquette après",
  poster: "Image de fond",
  showVideo: "Afficher la vidéo de fond",
  ctaHref: "Lien du bouton",
  ctaLabel: "Texte du bouton",
  tone: "Teinte (si pas de photo)",
  rating: "Note (1–5)",
  serviceId: "Forfait concerné",
  quote: "Témoignage",
  author: "Client",
  vehicle: "Véhicule",
  placeholders: "Textes d'aide des champs",
  vehicleSizes: "Gabarits de véhicule",
  dayOptions: "Choix du jour",
  priceMultiplier: "Coefficient de prix",
  timeMultiplier: "Coefficient de durée",
};

const OPTIONS: Record<string, string[]> = {
  tone: ["obsidian", "crimson", "cobalt", "pearl", "graphite"],
  accent: ["emerald", "ice"],
};

const HIDDEN_KEYS = new Set(["type"]);
const IMAGE_KEY = /(src|imageUrl|poster|shareImage)$/i;

export const fieldInput =
  "min-h-[38px] w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none";

function labelFor(key: string, value: unknown): string {
  if (/^\d+$/.test(key)) {
    const item = (value ?? {}) as Record<string, unknown>;
    const hint = [item.title, item.titleLine1, item.name, item.question, item.author, item.label, item.type].find(
      (candidate) => typeof candidate === "string" && candidate,
    );
    return `#${Number(key) + 1}${hint ? ` · ${hint}` : ""}`;
  }
  return LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export interface FieldContext {
  onChange: (path: string, value: unknown) => void;
  onPickImage: (path: string, file: File) => void;
  resolveSrc: (src: string) => string;
  serviceOptions: { id: string; name: string }[];
}

interface FieldProps {
  name: string;
  path: string;
  value: unknown;
  ctx: FieldContext;
  /** Nesting level; top-level groups start expanded. */
  depth?: number;
}

export function Field({ name, path, value, ctx, depth = 0 }: FieldProps) {
  if (HIDDEN_KEYS.has(name)) return null;
  const label = labelFor(name, value);

  if (Array.isArray(value)) return <ArrayField label={label} path={path} value={value} ctx={ctx} depth={depth} />;
  if (value && typeof value === "object") {
    return (
      <Group label={label} defaultOpen={depth === 0}>
        {Object.entries(value).map(([key, child]) => (
          <Field key={key} name={key} path={`${path}.${key}`} value={child} ctx={ctx} depth={depth + 1} />
        ))}
      </Group>
    );
  }
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center justify-between gap-3 py-1 text-sm text-zinc-300">
        {label}
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => ctx.onChange(path, event.target.checked)}
          className="size-5 accent-emerald-500"
        />
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <Labeled label={label}>
        <input
          key={value}
          type="number"
          step="any"
          defaultValue={value}
          onBlur={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next) && next !== value) ctx.onChange(path, next);
          }}
          className={fieldInput}
        />
      </Labeled>
    );
  }

  const text = String(value ?? "");
  if (IMAGE_KEY.test(name)) return <ImageField label={label} path={path} value={text} ctx={ctx} />;

  const options = name === "serviceId" ? ctx.serviceOptions.map((service) => service.id) : OPTIONS[name];
  if (options) {
    return (
      <Labeled label={label}>
        <select value={text} onChange={(event) => ctx.onChange(path, event.target.value)} className={fieldInput}>
          {options.map((option) => (
            <option key={option} value={option}>
              {ctx.serviceOptions.find((service) => service.id === option)?.name ?? option}
            </option>
          ))}
        </select>
      </Labeled>
    );
  }

  return (
    <Labeled label={label}>
      <TextInput key={text} value={text} long={text.length > 60} onCommit={(next) => ctx.onChange(path, next)} />
    </Labeled>
  );
}

function TextInput({ value, long, onCommit }: { value: string; long: boolean; onCommit: (value: string) => void }) {
  const commit = (next: string) => {
    if (next !== value) onCommit(next);
  };
  return long ? (
    <textarea
      defaultValue={value}
      rows={3}
      onBlur={(event) => commit(event.target.value)}
      className={cn(fieldInput, "py-2")}
    />
  ) : (
    <input
      defaultValue={value}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={fieldInput}
    />
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block py-1">
      <span className="mb-1 block text-[11px] font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function Group({ label, defaultOpen, children }: { label: string; defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="my-1 rounded-2xl border border-zinc-800/80 bg-zinc-950/30">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-zinc-200"
      >
        {label}
        <ChevronDown aria-hidden className={cn("size-4 text-zinc-500 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="border-t border-zinc-800/80 px-3 py-2">{children}</div> : null}
    </div>
  );
}

interface ArrayFieldProps {
  label: string;
  path: string;
  value: unknown[];
  ctx: FieldContext;
  depth: number;
}

function ArrayField({ label, path, value, ctx, depth }: ArrayFieldProps) {
  const move = (from: number, to: number) => {
    const next = [...value];
    [next[from], next[to]] = [next[to], next[from]];
    ctx.onChange(path, next);
  };
  const template = value.at(-1);

  return (
    <Group label={`${label} (${value.length})`} defaultOpen={depth === 0}>
      {value.map((item, index) => (
        <div key={index} className="relative">
          <div className="absolute top-1 right-0 z-10 flex gap-0.5">
            <IconButton title="Monter" disabled={index === 0} onClick={() => move(index, index - 1)}>
              <ArrowUp className="size-3.5" />
            </IconButton>
            <IconButton title="Descendre" disabled={index === value.length - 1} onClick={() => move(index, index + 1)}>
              <ArrowDown className="size-3.5" />
            </IconButton>
            <IconButton
              title="Supprimer"
              onClick={() => {
                if (window.confirm("Supprimer cet élément ?")) ctx.onChange(path, value.filter((_, i) => i !== index));
              }}
            >
              <Trash2 className="size-3.5" />
            </IconButton>
          </div>
          <Field name={String(index)} path={`${path}.${index}`} value={item} ctx={ctx} depth={depth + 1} />
        </div>
      ))}
      {template !== undefined ? (
        <button
          type="button"
          onClick={() => ctx.onChange(path, [...value, structuredClone(template)])}
          className="mt-1 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-700 py-1.5 text-xs text-zinc-400 hover:border-emerald-500/60 hover:text-emerald-300"
        >
          <Plus className="size-3.5" />
          Ajouter
        </button>
      ) : null}
    </Group>
  );
}

function IconButton({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="grid size-6 place-items-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function ImageField({ label, path, value, ctx }: { label: string; path: string; value: string; ctx: FieldContext }) {
  const input = useRef<HTMLInputElement>(null);
  const preview = value ? ctx.resolveSrc(value) : "";

  return (
    <Labeled label={label}>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny admin preview, may be a blob: URL */}
        {preview ? <img src={preview} alt="" className="size-12 shrink-0 rounded-lg object-cover" /> : null}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-100 hover:border-emerald-500/60"
        >
          <ImageUp aria-hidden className="size-4" />
          Choisir une photo
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) ctx.onPickImage(path, file);
          }}
        />
      </div>
    </Labeled>
  );
}
