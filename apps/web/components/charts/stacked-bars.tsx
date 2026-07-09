"use client";

import { niceTicks, scaleLinear } from "@/lib/chart-scale";
import { formatMoneyCompact } from "@/lib/format";
import { useMeasuredWidth } from "@/lib/use-measure";

export interface StackedBar {
  label: string;
  /** Segments bottom-to-top; each references a series color. */
  segments: { value: number; colorVar: string }[];
}

/**
 * Vertical stacked bars for the amortization split per year (docs/04 W3):
 * principal vs interest. 2px surface gap between stacked segments; 4px
 * rounded top on the last segment only.
 */
export function StackedBars({
  bars,
  seriesLabels,
  ariaLabel,
  height = 240,
}: {
  bars: StackedBar[];
  /** Legend labels aligned to segment order. */
  seriesLabels: { label: string; colorVar: string }[];
  ariaLabel: string;
  height?: number;
}) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const M = { top: 12, right: 8, bottom: 28, left: 52 };
  const innerW = Math.max(40, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;

  const totals = bars.map((b) => b.segments.reduce((s, x) => s + x.value, 0));
  const maxY = Math.max(1, ...totals);
  const ticks = niceTicks(maxY, 4);
  const topY = ticks[ticks.length - 1]!;
  const sy = scaleLinear(0, topY, innerH, 0);

  const slot = innerW / Math.max(1, bars.length);
  const barW = Math.min(36, slot * 0.62);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {seriesLabels.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ background: `var(${s.colorVar})` }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <div ref={ref} className="w-full" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={ariaLabel}>
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={M.left + innerW}
                  y1={M.top + sy(t)}
                  y2={M.top + sy(t)}
                  stroke="var(--chart-grid)"
                  strokeWidth={1}
                />
                <text
                  x={M.left - 8}
                  y={M.top + sy(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-ink-3 text-[11px] tabular-nums"
                >
                  {formatMoneyCompact(t / 100)}
                </text>
              </g>
            ))}
            {bars.map((bar, i) => {
              const x = M.left + i * slot + (slot - barW) / 2;
              let yCursor = 0;
              const lastIdx = bar.segments.length - 1;
              return (
                <g key={bar.label}>
                  {bar.segments.map((seg, si) => {
                    const h = innerH - sy(seg.value);
                    const y = M.top + sy(yCursor + seg.value);
                    yCursor += seg.value;
                    return (
                      <rect
                        key={si}
                        x={x}
                        y={y}
                        width={barW}
                        height={Math.max(0, h - (si < lastIdx ? 2 : 0))}
                        rx={si === lastIdx ? 4 : 0}
                        fill={`var(${seg.colorVar})`}
                      />
                    );
                  })}
                  {(i === 0 || i === bars.length - 1 || bars.length <= 12) && (
                    <text
                      x={x + barW / 2}
                      y={height - 10}
                      textAnchor="middle"
                      className="fill-ink-3 text-[11px] tabular-nums"
                    >
                      {bar.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
