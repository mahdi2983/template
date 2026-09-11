import { ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { surface } from "@/lib/styles";
import type { FaqItem } from "@/types";

interface QuickFaqAccordionProps {
  items: FaqItem[];
}

export function QuickFaqAccordion({ items }: QuickFaqAccordionProps) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mt-10">
      <SectionHeading id="faq-title" eyebrow="Quick answers" title="Before you book" />

      <div className={cn(surface, "divide-y divide-zinc-800/70 overflow-hidden")}>
        {items.map((item) => (
          <details key={item.id} className="group">
            <summary className="flex min-h-[56px] cursor-pointer items-center justify-between gap-3 px-5 py-3 text-[15px] font-medium text-zinc-100 transition-colors duration-300 select-none hover:bg-zinc-800/30 focus-visible:bg-zinc-800/40 focus-visible:outline-none active:bg-zinc-800/50">
              {item.question}
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-800/70 text-zinc-400 transition-all duration-300 group-open:rotate-90 group-open:bg-emerald-500/15 group-open:text-emerald-400">
                <ChevronRight aria-hidden className="size-4" />
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
