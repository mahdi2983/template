import type { Estimate, ServiceItem, VehicleSizeOption } from "@/types";

export function formatPrice(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes / 5) * 5} min`;
  }
  const hours = Math.round((minutes / 60) * 2) / 2;
  return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
}

/** Range estimate: base price scaled by vehicle size, with ~20% headroom for condition. */
export function calcEstimate(service: ServiceItem, size: VehicleSizeOption): Estimate {
  const low = Math.round(service.priceFrom * size.priceMultiplier);
  const high = Math.round((low * 1.2) / 5) * 5;
  return {
    low,
    high,
    durationLabel: formatDuration(service.durationMinutes * size.timeMultiplier),
  };
}
