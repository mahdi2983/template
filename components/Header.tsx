"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { OpenStatusPill } from "@/components/OpenStatusPill";
import { T } from "@/components/editable/T";
import { useField } from "@/lib/editor/content-context";
import type { BusinessInfo } from "@/types/content";

export function Header() {
  const business = useField<BusinessInfo>("site.business");

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-[#09090b]/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 sm:max-w-2xl lg:max-w-3xl">
        <Link
          href="/#main"
          aria-label={`${business.name} — back to top`}
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-emerald-400 to-sky-400 p-px shadow-[0_0_24px_-6px_rgba(16,185,129,0.6)] transition-all duration-300 active:scale-95"
        >
          <span className="grid size-full place-items-center rounded-[15px] bg-zinc-950 text-lg font-semibold tracking-tight text-zinc-100">
            <T p="site.business.monogram" />
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-100">
            <T p="site.business.name" />
          </p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-zinc-800/70 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
            <MapPin aria-hidden className="size-3 text-sky-400" />
            <span>
              <T p="site.business.city" />, <T p="site.business.region" />
            </span>
          </span>
        </div>

        <OpenStatusPill />
      </div>
    </header>
  );
}
