"use client";

import { useSyncExternalStore } from "react";
import { PulseDot } from "@/components/ui/PulseDot";
import { useField } from "@/lib/editor/content-context";
import { isOpenAt } from "@/lib/hours";
import type { SiteContent } from "@/types/content";

const subscribe = (onChange: () => void) => {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
};
const getServerSnapshot = () => null;

/** Hours pill with a live open/closed dot, evaluated in the business's time zone. */
export function OpenStatusPill() {
  const business = useField<SiteContent["business"]>("site.business");
  const labels = useField<SiteContent["header"]>("site.header");
  const open = useSyncExternalStore<boolean | null>(subscribe, () => isOpenAt(new Date(), business), getServerSnapshot);

  const label =
    open === null ? business.hoursShort : `${open ? labels.openLabel : labels.closedLabel} · ${business.hoursShort}`;

  return (
    <span
      title={`Hours: ${business.hoursLabel}`}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-zinc-800/70 bg-zinc-900/70 px-2.5 text-[11px] font-medium whitespace-nowrap text-zinc-300"
    >
      <PulseDot tone={open === false ? "zinc" : "emerald"} pulse={open === true} className="size-2" />
      <span>{label}</span>
      <span className="sr-only">. Hours {business.hoursLabel}</span>
    </span>
  );
}
