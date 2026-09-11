"use client";

import Image from "next/image";
import { Armchair, Check, ChevronRight, Clock, Droplets, ShieldCheck, Sparkles, Star, type LucideIcon } from "lucide-react";
import { useBooking } from "@/components/BookingProvider";
import { cn } from "@/lib/cn";
import { formatDuration, formatPrice } from "@/lib/estimate";
import { focusRing, pressable, surface } from "@/lib/styles";
import type { ServiceItem } from "@/types";

const SERVICE_ICONS: Record<string, LucideIcon> = {
  "interior-reset": Armchair,
  "wash-wax": Droplets,
  "correction-ceramic": ShieldCheck,
};

interface ServiceCardProps {
  service: ServiceItem;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const { openBooking } = useBooking();
  const Icon = SERVICE_ICONS[service.id] ?? Sparkles;
  const checkTone = service.accent === "ice" ? "bg-sky-400/15 text-sky-300" : "bg-emerald-500/15 text-emerald-400";

  return (
    <article
      className={cn(
        surface,
        "group relative flex flex-col p-5 transition-all duration-300",
        service.popular && "border-emerald-500/40 shadow-[0_24px_60px_-28px_rgba(16,185,129,0.55)]",
      )}
    >
      {service.imageUrl ? (
        <div className="relative -mx-1 -mt-1 mb-4 h-44 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-inner">
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-zinc-900/80 backdrop-blur-md text-zinc-100 border border-white/10 shadow-lg">
              <Icon aria-hidden className="size-5" />
            </span>
            {service.popular ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-zinc-950 shadow-lg">
                <Star aria-hidden className="size-3 fill-current" />
                Most booked
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-zinc-800/80 text-zinc-100">
            <Icon aria-hidden className="size-5" />
          </span>
          {service.popular ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              <Star aria-hidden className="size-3 fill-current" />
              Most booked
            </span>
          ) : null}
        </div>
      )}

      <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-100">{service.name}</h3>
      <p className="mt-1 text-sm text-zinc-400">{service.tagline}</p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-zinc-100">
          <span className="text-xs text-zinc-500">from </span>
          <span className="text-3xl font-semibold tracking-tight">{formatPrice(service.priceFrom)}</span>
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
          <Clock aria-hidden className="size-3.5" />
          {formatDuration(service.durationMinutes)}
        </span>
      </div>

      <ul className="mt-4 mb-5 space-y-2.5">
        {service.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm leading-snug text-zinc-300">
            <span className={cn("mt-px grid size-5 shrink-0 place-items-center rounded-full", checkTone)}>
              <Check aria-hidden className="size-3" strokeWidth={3} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => openBooking(service.id)}
        aria-label={`Select ${service.name}`}
        className={cn(
          "mt-auto flex min-h-[48px] w-full items-center justify-center gap-1 rounded-2xl text-sm font-semibold",
          pressable,
          focusRing,
          service.popular
            ? "bg-zinc-50 text-zinc-950 hover:bg-white"
            : "border border-zinc-700/70 bg-zinc-800/70 text-zinc-100 hover:bg-zinc-800",
        )}
      >
        Select
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </article>
  );
}
