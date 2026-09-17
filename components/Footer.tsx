"use client";

import { Phone, ShieldCheck } from "lucide-react";
import { T } from "@/components/editable/T";
import { useField } from "@/lib/editor/content-context";

export function Footer() {
  const phoneE164 = useField<string>("site.business.phoneE164");

  return (
    <footer className="mt-12 flex flex-col items-center gap-1 text-center text-xs text-zinc-500">
      <p className="inline-flex items-center gap-1.5 text-zinc-400">
        <ShieldCheck aria-hidden className="size-3.5 text-emerald-400" />
        <T p="site.footer.insuredLine" />
      </p>
      <a
        href={`tel:${phoneE164}`}
        className="inline-flex min-h-[48px] items-center gap-1.5 px-3 text-sm font-medium text-zinc-300 transition-all duration-300 hover:text-zinc-100 active:scale-95"
      >
        <Phone aria-hidden className="size-3.5" />
        <T p="site.business.phoneDisplay" />
      </a>
      <p>
        © {new Date().getFullYear()} <T p="site.business.name" />. <T p="site.business.hoursLabel" />.
      </p>
    </footer>
  );
}
