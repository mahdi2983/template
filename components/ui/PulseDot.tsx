import { cn } from "@/lib/cn";

interface PulseDotProps {
  tone?: "emerald" | "zinc";
  pulse?: boolean;
  className?: string;
}

export function PulseDot({ tone = "emerald", pulse = true, className }: PulseDotProps) {
  const isEmerald = tone === "emerald";

  return (
    <span aria-hidden className={cn("relative flex size-2.5 shrink-0", className)}>
      {pulse && isEmerald ? (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      ) : null}
      <span
        className={cn(
          "relative inline-flex size-2.5 rounded-full",
          isEmerald ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-zinc-500",
        )}
      />
    </span>
  );
}
