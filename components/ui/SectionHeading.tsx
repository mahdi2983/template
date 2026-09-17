import type { ReactNode } from "react";

interface SectionHeadingProps {
  id: string;
  eyebrow: ReactNode;
  title: ReactNode;
  trailing?: ReactNode;
}

export function SectionHeading({ id, eyebrow, title, trailing }: SectionHeadingProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">{eyebrow}</p>
        <h2 id={id} className="mt-1 text-2xl font-semibold tracking-tight text-balance text-zinc-100">
          {title}
        </h2>
      </div>
      {trailing ? <div className="shrink-0 pb-1">{trailing}</div> : null}
    </div>
  );
}
