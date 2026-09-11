import { siteConfig } from "@/lib/site-config";
import type { SiteConfig } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** True when `date` falls inside business hours in the business's own time zone. */
export function isOpenAt(date: Date, config: SiteConfig = siteConfig): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: config.timeZone,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);

  const weekday = WEEKDAYS.indexOf(parts.find((part) => part.type === "weekday")?.value ?? "");
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? Number.NaN) % 24;

  return config.openDays.includes(weekday) && hour >= config.openHour && hour < config.closeHour;
}
