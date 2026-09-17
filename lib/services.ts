import { formatDriveUrl } from "@/lib/formatDriveUrl";
import type { ServiceAccent, ServiceItem } from "@/types";
import type { ServiceContent } from "@/types/content";

const ACCENTS: readonly ServiceAccent[] = ["emerald", "ice"];

function toAccent(value: string | undefined): ServiceAccent {
  const normalized = (value ?? "").trim().toLowerCase();
  return ACCENTS.find((accent) => accent === normalized) ?? "emerald";
}

/** Normalizes a service from `content/site.json` into the strict shape the UI works with. */
export function toServiceItem(service: ServiceContent): ServiceItem {
  const imageUrl = service.imageUrl?.trim();
  return {
    id: service.id,
    name: service.name,
    tagline: service.tagline,
    durationMinutes: Number(service.durationMinutes) || 90,
    priceFrom: Number(service.priceFrom) || 0,
    features: service.features,
    popular: Boolean(service.popular),
    accent: toAccent(service.accent),
    // Remote Drive links still work; local uploads and /public paths pass through untouched.
    imageUrl: imageUrl ? formatDriveUrl(imageUrl) : undefined,
  };
}
