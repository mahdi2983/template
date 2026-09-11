import { Phone } from "lucide-react";
import { ServiceCard } from "@/components/ServiceCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/lib/site-config";
import { focusRing, pressable, surface } from "@/lib/styles";
import type { ServiceItem } from "@/types";

interface ServiceBentoPricingProps {
  services: ServiceItem[];
}

export function ServiceBentoPricing({ services }: ServiceBentoPricingProps) {
  return (
    <section id="services" aria-labelledby="services-title" className="mt-10">
      <SectionHeading
        id="services-title"
        eyebrow="Packages"
        title="Pick your reset"
        trailing={<span className="text-xs font-medium text-zinc-500">Sedan pricing</span>}
      />

      {services.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className={cn(surface, "p-6 text-center")}>
          <p className="text-sm text-zinc-400">Pricing is being refreshed — call for a same-day quote.</p>
          <a
            href={`tel:${siteConfig.phoneE164}`}
            className={cn(
              "mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-zinc-50 px-5 text-sm font-semibold text-zinc-950",
              pressable,
              focusRing,
            )}
          >
            <Phone aria-hidden className="size-4" />
            {siteConfig.phoneDisplay}
          </a>
        </div>
      )}

      <p className="mt-3 px-1 text-xs text-zinc-500">
        SUVs, trucks &amp; 3-row vehicles adjust automatically in the instant estimate. No hidden fees.
      </p>
    </section>
  );
}
