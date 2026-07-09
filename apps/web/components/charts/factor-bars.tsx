import { cn } from "@/lib/cn";

export interface FactorBar {
  label: string;
  /** 0–100 sub-score. */
  value: number;
  /** Weight as a percent, shown as context. */
  weightPct: number;
}

/**
 * Horizontal factor breakdown for the credit-score model (docs/04 W4).
 * Shows each sub-score and its weight so the model is transparent.
 */
export function FactorBars({ factors, className }: { factors: FactorBar[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {factors.map((f) => (
        <li key={f.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink-2">
              {f.label}{" "}
              <span className="text-ink-3">· {f.weightPct}% weight</span>
            </span>
            <span className="tabular-nums text-ink-1">{Math.round(f.value)}/100</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-1/8">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${f.value}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
