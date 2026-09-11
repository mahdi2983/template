import { Gauge } from "lucide-react";
import { cn } from "@/lib/cn";
import { surface } from "@/lib/styles";

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const metrics = [
  { label: "Load", value: "0.3s" },
  { label: "Blocking", value: "0ms" },
  { label: "CLS", value: "0" },
];

interface LighthouseCardProps {
  score?: number;
  className?: string;
}

export function LighthouseCard({ score = 100, className }: LighthouseCardProps) {
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <div className={cn(surface, "p-5", className)}>
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0">
          <svg viewBox="0 0 72 72" aria-hidden className="size-full -rotate-90">
            <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="rgb(16 185 129 / 0.15)" strokeWidth="7" />
            <circle
              cx="36"
              cy="36"
              r={RADIUS}
              fill="none"
              stroke="#10b981"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-lg font-semibold tracking-tight text-emerald-400">
            {score}
          </span>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <Gauge aria-hidden className="size-3.5" />
            Google Lighthouse
          </p>
          <p className="mt-0.5 text-base font-semibold tracking-tight text-zinc-100">{score}/100 performance</p>
          <p className="text-xs text-zinc-500">This page loads before you finish the tap.</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-zinc-950/60 px-3 py-2.5">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{metric.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-zinc-100">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
