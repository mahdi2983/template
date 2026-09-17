"use client";

import { ChevronRight } from "lucide-react";
import { AddItemButton, ItemControls } from "@/components/editable/EditControls";
import { T } from "@/components/editable/T";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NEW_FAQ_ITEM } from "@/lib/blocks";
import { cn } from "@/lib/cn";
import { useField } from "@/lib/editor/content-context";
import { surface } from "@/lib/styles";
import type { FaqBlock } from "@/types/content";

export function QuickFaqAccordion({ base }: { base: string }) {
  const block = useField<FaqBlock>(base);

  return (
    <section id={block.id} aria-labelledby={`${block.id}-title`} className="mt-10">
      <SectionHeading
        id={`${block.id}-title`}
        eyebrow={<T p={`${base}.eyebrow`} />}
        title={<T p={`${base}.title`} />}
      />

      <div className={cn(surface, "divide-y divide-zinc-800/70 overflow-hidden")}>
        {block.items.map((item, index) => (
          <details key={`${item.id}-${index}`} className="group relative">
            <summary className="flex min-h-[56px] cursor-pointer items-center justify-between gap-3 px-5 py-3 text-[15px] font-medium text-zinc-100 transition-colors duration-300 select-none hover:bg-zinc-800/30 focus-visible:bg-zinc-800/40 focus-visible:outline-none active:bg-zinc-800/50">
              <T p={`${base}.items.${index}.question`} />
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-800/70 text-zinc-400 transition-all duration-300 group-open:rotate-90 group-open:bg-emerald-500/15 group-open:text-emerald-400">
                <ChevronRight aria-hidden className="size-4" />
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">
              <T p={`${base}.items.${index}.answer`} />
            </p>
            <ItemControls list={`${base}.items`} index={index} length={block.items.length} className="top-1 right-14" />
          </details>
        ))}
      </div>
      <AddItemButton
        list={`${base}.items`}
        template={{ ...NEW_FAQ_ITEM, id: `question-${block.items.length + 1}` }}
        label="Add question"
        className="mt-3"
      />
    </section>
  );
}
