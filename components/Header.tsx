"use client";

import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { OpenStatusPill } from "@/components/OpenStatusPill";
import { ImageEditButton } from "@/components/editable/EditControls";
import { T } from "@/components/editable/T";
import { useField, useImageSrc } from "@/lib/editor/content-context";
import type { BusinessInfo } from "@/types/content";

export function Header() {
  const business = useField<BusinessInfo>("site.business");
  const logo = useImageSrc("site.business.logo");
  // The initial is the placeholder: shown when no logo is set or when the image can't be loaded.
  const [brokenLogo, setBrokenLogo] = useState<string | null>(null);
  const showLogo = Boolean(logo) && brokenLogo !== logo;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-[#09090b]/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 sm:max-w-2xl lg:max-w-3xl">
        <div className="relative shrink-0">
          <Link
            href="/#main"
            aria-label={`${business.name} — back to top`}
            className="grid size-11 place-items-center rounded-2xl bg-linear-to-br from-emerald-400 to-sky-400 p-px shadow-[0_0_24px_-6px_rgba(16,185,129,0.6)] transition-all duration-300 active:scale-95"
          >
            <span className="relative grid size-full place-items-center overflow-hidden rounded-[15px] bg-zinc-950 text-lg font-semibold tracking-tight text-zinc-100">
              {showLogo ? (
                <Image
                  src={logo}
                  alt=""
                  fill
                  sizes="44px"
                  priority
                  onError={() => setBrokenLogo(logo)}
                  className="object-contain p-1"
                />
              ) : (
                <T p="site.business.monogram" />
              )}
            </span>
          </Link>
          <ImageEditButton p="site.business.logo" label="Upload logo" compact className="-right-2 -bottom-2" />
        </div>

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
