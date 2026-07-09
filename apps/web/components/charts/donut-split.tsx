"use client";

import { cn } from "@/lib/cn";

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  colorVar: string;
}

/**
 * Two-to-few slice donut for principal-vs-interest splits (docs/04 W3).
 * Center holds the headline; a legend with values sits beside it. Identity
 * is never color-alone — every slice is labeled with its value.
 */
export function DonutSplit({
  slices,
  centerLabel,
  centerValue,
  format,
  className,
}: {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  format: (v: number) => string;
  className?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const R = 60;
  const C = 2 * Math.PI * R;
  // Precompute each slice's dash length and cumulative offset with a reduce so
  // nothing is reassigned during render (React Compiler friendly).
  const arcs = slices.reduce<
    { slice: DonutSlice; dash: number; offset: number }[]
  >((acc, slice) => {
    const dash = (slice.value / total) * C;
    const offset = acc.length ? acc[acc.length - 1]!.offset + acc[acc.length - 1]!.dash : 0;
    acc.push({ slice, dash, offset });
    return acc;
  }, []);

  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <svg
        width={160}
        height={160}
        viewBox="0 0 160 160"
        role="img"
        aria-label={`${centerLabel}: ${slices.map((s) => `${s.label} ${format(s.value)}`).join(", ")}`}
      >
        <g transform="rotate(-90 80 80)">
          {arcs.map(({ slice, dash, offset }) => (
            <circle
              key={slice.id}
              cx={80}
              cy={80}
              r={R}
              fill="none"
              stroke={`var(${slice.colorVar})`}
              strokeWidth={20}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
            />
          ))}
        </g>
        {/* 2px surface ring reads as a gap between adjacent slices */}
        <circle cx={80} cy={80} r={R} fill="none" stroke="var(--bg-surface)" strokeWidth={0} />
      </svg>

      <div className="flex flex-col gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-ink-2">
            {centerLabel}
          </div>
          <div className="font-display text-2xl font-semibold tabular-nums">
            {centerValue}
          </div>
        </div>
        <ul className="flex flex-col gap-1">
          {slices.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-sm"
                style={{ background: `var(${s.colorVar})` }}
              />
              <span className="text-ink-2">{s.label}</span>
              <span className="ml-auto tabular-nums text-ink-1">
                {format(s.value)}
              </span>
              <span className="w-12 text-right tabular-nums text-ink-3">
                {Math.round((s.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
