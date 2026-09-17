"use client";

import { Phone } from "lucide-react";
import { AddItemButton } from "@/components/editable/EditControls";
import { T } from "@/components/editable/T";
import { ServiceCard } from "@/components/ServiceCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NEW_SERVICE } from "@/lib/blocks";
import { cn } from "@/lib/cn";
import { useField } from "@/lib/editor/content-context";
import { focusRing, pressable, surface } from "@/lib/styles";
import type { BusinessInfo, ServiceContent, ServicesBlock } from "@/types/content";

export function ServiceBentoPricing({ base }: { base: string }) {
  const block = useField<ServicesBlock>(base);
  const services = useField<ServiceContent[]>("site.services");
  const business = useField<BusinessInfo>("site.business");

  return (
    <section id={block.id} aria-labelledby={`${block.id}-title`} className="mt-10">
      <SectionHeading
        id={`${block.id}-title`}
        eyebrow={<T p={`${base}.eyebrow`} />}
        title={<T p={`${base}.title`} />}
        trailing={
          <span className="text-xs font-medium text-zinc-500">
            <T p={`${base}.hint`} />
          </span>
        }
      />

      {services.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard key={`${service.id}-${index}`} index={index} count={services.length} />
          ))}
        </div>
      ) : (
        <div className={cn(surface, "p-6 text-center")}>
          <p className="text-sm text-zinc-400">
            <T p={`${base}.emptyText`} />
          </p>
          <a
            href={`tel:${business.phoneE164}`}
            className={cn(
              "mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-zinc-50 px-5 text-sm font-semibold text-zinc-950",
              pressable,
              focusRing,
            )}
          >
            <Phone aria-hidden className="size-4" />
            {business.phoneDisplay}
          </a>
        </div>
      )}
      <AddItemButton list="site.services" template={NEW_SERVICE} label="Add package" className="mt-3" />

      <p className="mt-3 px-1 text-xs text-zinc-500">
        <T p={`${base}.note`} />
      </p>
    </section>
  );
}
