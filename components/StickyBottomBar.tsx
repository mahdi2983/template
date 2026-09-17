"use client";

import { Phone, Zap } from "lucide-react";
import { useBooking } from "@/components/BookingProvider";
import { T } from "@/components/editable/T";
import { PulseDot } from "@/components/ui/PulseDot";
import { cn } from "@/lib/cn";
import { useField } from "@/lib/editor/content-context";
import { focusRing, pressable } from "@/lib/styles";
import type { BusinessInfo } from "@/types/content";

export function StickyBottomBar() {
  const { openBooking } = useBooking();
  const business = useField<BusinessInfo>("site.business");

  return (
    <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md sm:max-w-lg">
      <nav
        aria-label="Quick actions"
        className="flex items-center gap-2 rounded-3xl border border-zinc-700/60 bg-zinc-900/75 p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl"
      >
        <a
          href={`tel:${business.phoneE164}`}
          aria-label={`Call ${business.name} at ${business.phoneDisplay} — available today`}
          className={cn(
            "flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-2xl px-2.5 hover:bg-zinc-800/60",
            pressable,
            focusRing,
          )}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Phone aria-hidden className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap text-emerald-400">
              <PulseDot className="size-2" />
              <T p="site.stickyBar.availability" />
            </span>
            <span className="truncate text-sm font-semibold text-zinc-100">
              <T p="site.stickyBar.callLabel" />
            </span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => openBooking()}
          className={cn(
            "flex min-h-[52px] shrink-0 items-center gap-1.5 rounded-2xl bg-zinc-50 px-5 text-sm font-semibold text-zinc-950 shadow-[0_8px_24px_-8px_rgba(255,255,255,0.35)] hover:bg-white",
            pressable,
            focusRing,
          )}
        >
          <Zap aria-hidden className="size-4 fill-zinc-950" />
          <T p="site.stickyBar.estimateLabel" inButton />
        </button>
      </nav>
    </div>
  );
}
