import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

interface StarsProps {
  rating: number;
  className?: string;
}

export function Stars({ rating, className = "size-4" }: StarsProps) {
  const filled = Math.round(rating);

  return (
    <span role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`} className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden
          className={cn(
            className,
            index < filled
              ? "fill-emerald-400 text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.45)]"
              : "fill-zinc-700 text-zinc-700",
          )}
        />
      ))}
    </span>
  );
}
