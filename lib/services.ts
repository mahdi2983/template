import Papa from "papaparse";
import { formatDriveUrl } from "@/lib/formatDriveUrl";
import type { ServiceAccent, ServiceItem, ServiceSheetRow } from "@/types";

/**
 * High-definition fallback services bundle.
 * Used when no Google Sheet URL is set or if the network fetch fails.
 */
export const SERVICE_SHEET_ROWS: (ServiceSheetRow & { imageUrl?: string })[] = [
  {
    id: "interior-reset",
    name: "Full Interior Reset",
    tagline: "Steam, extract & sanitize every surface.",
    duration_min: "150",
    price_from: "189",
    features:
      "Hot-water seat & carpet extraction|Steam-sanitized vents, cupholders & console|Leather cleanse + UV conditioner|Streak-free glass inside & out",
    popular: "FALSE",
    accent: "ice",
    imageUrl: "/gallery/06-interior-detail.jpg",
  },
  {
    id: "wash-wax",
    name: "Signature Wash & Wax",
    tagline: "The hand-wash your paint deserves, every month.",
    duration_min: "90",
    price_from: "119",
    features:
      "pH-neutral foam cannon + two-bucket wash|Iron & tar decontamination|Hand-applied sealant, 3-month protection|Wheels, tires & wells deep-cleaned|Quick interior vacuum & wipe-down",
    popular: "TRUE",
    accent: "emerald",
    imageUrl: "/gallery/02-hand-wash.jpg",
  },
  {
    id: "correction-ceramic",
    name: "Stage 1 Correction & Ceramic",
    tagline: "Erase swirls. Lock in three years of gloss.",
    duration_min: "360",
    price_from: "649",
    features:
      "Clay bar + full chemical decon|Machine polish, 60–70% swirl removal|3-year SiO₂ ceramic coating|Wheel faces & glass coated|Paint-depth readings before & after",
    popular: "FALSE",
    accent: "ice",
    imageUrl: "/gallery/04-ceramic-application.jpg",
  },
];

const ACCENTS: readonly ServiceAccent[] = ["emerald", "ice"];

function toNumber(value: string | number | undefined, defaultValue = 0): number {
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat((value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function toAccent(value: string | undefined): ServiceAccent {
  const normalized = (value ?? "").trim().toLowerCase();
  return ACCENTS.find((accent) => accent === normalized) ?? "emerald";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalizes raw sheet rows (from CSV or JSON) into strict, type-safe ServiceItems.
 * Handles flexible header names (e.g. "price" or "price_from", "image" or "imageUrl").
 */
export function parseServiceRows(rows: Record<string, string | undefined>[]): ServiceItem[] {
  return rows.flatMap((row, index) => {
    const name = (row.name ?? row.service ?? row.title ?? "").trim();
    if (!name) return [];

    const rawId = (row.id ?? row.ID ?? "").trim();
    const id = rawId || slugify(name) || `service-${index + 1}`;

    const rawPrice = row.price_from ?? row.priceFrom ?? row.price ?? row.Price ?? "";
    const priceFrom = toNumber(rawPrice, 99);

    const rawDuration = row.duration_min ?? row.durationMinutes ?? row.duration ?? row.Duration ?? "";
    // If duration is like "2.5 hrs" or "2.5", convert to minutes if needed
    let durationMinutes = toNumber(rawDuration, 90);
    if (durationMinutes > 0 && durationMinutes <= 12) {
      // Entered as hours (e.g. 2.5), convert to minutes
      durationMinutes = Math.round(durationMinutes * 60);
    }

    const tagline = (row.tagline ?? row.description ?? row.subtitle ?? "").trim();

    // Features can be pipe-delimited ("A|B|C") or newline-delimited
    const rawFeatures = row.features ?? row.Features ?? "";
    const features = rawFeatures
      .split(/[|\n]/)
      .map((f) => f.trim())
      .filter(Boolean);

    const popular = /^(true|yes|1|oui)$/i.test((row.popular ?? row.Popular ?? "").trim());
    const accent = toAccent(row.accent);

    const rawImage = (
      row.imageUrl ??
      row.image_url ??
      row.image ??
      row.photo ??
      row.Photo ??
      row.Image ??
      ""
    ).trim();

    const imageUrl = rawImage ? formatDriveUrl(rawImage) : undefined;

    return [
      {
        id,
        name,
        tagline,
        durationMinutes,
        priceFrom,
        features: features.length > 0 ? features : ["Professional automotive care", "Mobile service included"],
        popular,
        accent,
        imageUrl,
      },
    ];
  });
}

/**
 * Loads pricing dynamically with Incremental Static Regeneration (ISR 60s).
 * When `SERVICES_SHEET_URL` or `NEXT_PUBLIC_SERVICES_SHEET_URL` points to a
 * published Google Sheet CSV (or JSON), live rows are parsed and rendered.
 * Otherwise, falls back to the bundled services.
 */
export async function getServices(): Promise<ServiceItem[]> {
  const sheetUrl = process.env.SERVICES_SHEET_URL || process.env.NEXT_PUBLIC_SERVICES_SHEET_URL;

  if (sheetUrl) {
    try {
      // Fetch fresh data without stale cache so Google Sheets changes appear immediately
      const response = await fetch(sheetUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Sheet responded with HTTP ${response.status}`);
      }

      const text = await response.text();

      // Check if it's CSV or JSON
      if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
        const json = JSON.parse(text);
        const rows = Array.isArray(json) ? json : json.data ?? [];
        const parsed = parseServiceRows(rows);
        if (parsed.length > 0) return parsed;
      } else {
        // Parse CSV with PapaParse
        const { data } = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        const parsed = parseServiceRows(data);
        if (parsed.length > 0) return parsed;
      }
    } catch (error) {
      console.error("[services] Error fetching Google Sheet CMS, falling back to local bundle:", error);
    }
  }

  return parseServiceRows(SERVICE_SHEET_ROWS as unknown as Record<string, string>[]);
}
