import { Phone, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="mt-12 flex flex-col items-center gap-1 text-center text-xs text-zinc-500">
      <p className="inline-flex items-center gap-1.5 text-zinc-400">
        <ShieldCheck aria-hidden className="size-3.5 text-emerald-400" />
        Fully insured · Serving {siteConfig.city} &amp; {siteConfig.serviceRadiusMiles} mi around
      </p>
      <a
        href={`tel:${siteConfig.phoneE164}`}
        className="inline-flex min-h-[48px] items-center gap-1.5 px-3 text-sm font-medium text-zinc-300 transition-all duration-300 hover:text-zinc-100 active:scale-95"
      >
        <Phone aria-hidden className="size-3.5" />
        {siteConfig.phoneDisplay}
      </a>
      <p>
        © {new Date().getFullYear()} {siteConfig.name}. {siteConfig.hoursLabel}.
      </p>
    </footer>
  );
}
