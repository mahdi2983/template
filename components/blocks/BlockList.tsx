"use client";

import { Plus } from "lucide-react";
import { useState, type ComponentType } from "react";
import { BeforeAfterInteractive } from "@/components/BeforeAfterInteractive";
import { CtaSection, ImageSection, TextSection } from "@/components/blocks/SimpleBlocks";
import { ItemControls } from "@/components/editable/EditControls";
import { HeroBento } from "@/components/HeroBento";
import { QuickFaqAccordion } from "@/components/QuickFaqAccordion";
import { ServiceBentoPricing } from "@/components/ServiceBentoPricing";
import { SocialProofTicker } from "@/components/SocialProofTicker";
import { WorkGallery } from "@/components/WorkGallery";
import { BLOCK_CHOICES, createBlock } from "@/lib/blocks";
import { useContentApi, useField } from "@/lib/editor/content-context";
import type { Block, BlockType } from "@/types/content";

/** Every block type maps onto an existing, already-styled site section. */
const BLOCK_COMPONENTS: Record<BlockType, ComponentType<{ base: string }>> = {
  hero: HeroBento,
  beforeAfter: BeforeAfterInteractive,
  services: ServiceBentoPricing,
  gallery: WorkGallery,
  reviews: SocialProofTicker,
  faq: QuickFaqAccordion,
  text: TextSection,
  image: ImageSection,
  cta: CtaSection,
};

export function BlockList() {
  const blocks = useField<Block[]>("page.blocks");
  const { editing } = useContentApi();

  if (!editing) {
    return blocks.map((block, index) => {
      const Section = BLOCK_COMPONENTS[block.type];
      return Section ? <Section key={block.id} base={`page.blocks.${index}`} /> : null;
    });
  }

  return (
    <>
      <AddBlockMenu index={0} />
      {blocks.map((block, index) => {
        const Section = BLOCK_COMPONENTS[block.type];
        if (!Section) return null;
        return (
          <div key={block.id} data-block={block.type} className="relative">
            <ItemControls list="page.blocks" index={index} length={blocks.length} className="top-6 right-0 z-40">
              <span className="px-2 text-[10px] font-semibold tracking-wider text-emerald-300 uppercase">
                {BLOCK_CHOICES.find((choice) => choice.type === block.type)?.label}
              </span>
            </ItemControls>
            <Section base={`page.blocks.${index}`} />
            <AddBlockMenu index={index + 1} />
          </div>
        );
      })}
    </>
  );
}

function AddBlockMenu({ index }: { index: number }) {
  const { insertAt } = useContentApi();
  const [open, setOpen] = useState(false);

  return (
    <div data-editor-ui className="relative mt-4 flex flex-col items-center">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-emerald-500/50 bg-zinc-950/80 px-3 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/10"
      >
        <Plus aria-hidden className="size-3.5" />
        Ajouter une section
      </button>
      {open ? (
        <div className="mt-2 grid w-full grid-cols-2 gap-2 rounded-3xl border border-zinc-700 bg-zinc-900/95 p-3 shadow-2xl backdrop-blur-xl sm:grid-cols-3">
          {BLOCK_CHOICES.map((choice) => (
            <button
              key={choice.type}
              type="button"
              onClick={() => {
                insertAt?.("page.blocks", index, createBlock(choice.type));
                setOpen(false);
              }}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3 text-left hover:border-emerald-500/60 hover:bg-emerald-500/10"
            >
              <span className="block text-xs font-semibold text-zinc-100">{choice.label}</span>
              <span className="mt-0.5 block text-[10px] leading-snug text-zinc-400">{choice.hint}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
