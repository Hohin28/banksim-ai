"use client";

import { niceTicks, scaleLinear, yearTicks } from "@/lib/chart-scale";
import { cn } from "@/lib/cn";
import { formatMoneyCompact } from "@/lib/format";
import { useMeasuredWidth } from "@/lib/use-measure";
import { useId, useState, type KeyboardEvent } from "react";

/**
 * The chart kit's single workhorse (docs/10 §6): stacked areas, bands and
 * lines over a shared year axis. 2px lines, hairline grid, surface-colored
 * spacers between stacked fills, crosshair + tooltip (mouse and keyboard),
 * legend + direct end labels. The screen-reader path is the ChartTable twin;
 * the SVG is role="img" with a one-sentence summary.
 */

export interface ChartSeries {
  id: string;
  label: string;
  /** Shorter form for the direct end label; defaults to `label`. */
  shortLabel?: string;
  /** CSS custom property, e.g. "--series-1". Color follows the entity. */
  colorVar: string;
  /** y value per x index. */
  values: number[];
  /**
   * area: filled from 0 → values.
   * band: filled from `lower` → values (stacked segment).
   * line: 2px stroke only.
   */
  kind: "area" | "band" | "line";
  lower?: number[];
  dashed?: boolean;
}

export interface LineAreaChartProps {
  /** Shared x axis (years). */
  xValues: number[];
  series: ChartSeries[];
  /** One-sentence summary for assistive tech. */
  ariaLabel: string;
  formatValue?: (v: number) => string;
  height?: number;
  className?: string;
  /** Hide legend for single-series or ultra-compact embeds. */
  compact?: boolean;
}

const M = { top: 16, right: 96, bottom: 28, left: 64 };

export function LineAreaChart({
  xValues,
  series,
  ariaLabel,
  formatValue = (v) => formatMoneyCompact(v / 100),
  height = 320,
  className,
  compact = false,
}: LineAreaChartProps) {
  const [containerRef, width] = useMeasuredWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();

  const n = xValues.length;
  const innerW = Math.max(40, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;

  const maxY = Math.max(1, ...series.flatMap((s) => s.values));
  const ticksY = niceTicks(maxY);
  const topY = ticksY[ticksY.length - 1]!;
  const maxX = xValues[n - 1] ?? 0;
  const ticksX = yearTicks(maxX);

  const sx = scaleLinear(0, maxX, M.left, M.left + innerW);
  const sy = scaleLinear(0, topY, M.top + innerH, M.top);

  const linePath = (values: number[]) =>
    values
      .map((v, i) => `${i === 0 ? "M" : "L"}${sx(xValues[i]!)},${sy(v)}`)
      .join("");

  const areaPath = (upper: number[], lower?: number[]) => {
    const lo = lower ?? upper.map(() => 0);
    const up = upper
      .map((v, i) => `${i === 0 ? "M" : "L"}${sx(xValues[i]!)},${sy(v)}`)
      .join("");
    const down = [...lo.keys()]
      .reverse()
      .map((i) => `L${sx(xValues[i]!)},${sy(lo[i]!)}`)
      .join("");
    return `${up}${down}Z`;
  };

  const indexFromClientX = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    const frac = (px - M.left) / innerW;
    return Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setHover((h) => Math.min(n - 1, (h ?? 0) + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setHover((h) => Math.max(0, (h ?? n - 1) - 1));
    } else if (e.key === "Escape") {
      setHover(null);
    }
  };

  // Direct end labels with a minimal collision nudge (≥16px apart).
  const endLabels = series
    .map((s) => ({ s, y: sy(s.values[n - 1] ?? 0) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < endLabels.length; i++) {
    if (endLabels[i]!.y - endLabels[i - 1]!.y < 16) {
      endLabels[i]!.y = endLabels[i - 1]!.y + 16;
    }
  }

  const hoverX = hover !== null ? sx(xValues[hover]!) : null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!compact && series.length >= 2 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
          {series.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ background: `var(${s.colorVar})` }}
              />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div ref={containerRef} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={ariaLabel}
            tabIndex={0}
            className="block select-none outline-offset-4"
            onMouseMove={(e) =>
              setHover(
                indexFromClientX(
                  e.clientX,
                  e.currentTarget.getBoundingClientRect(),
                ),
              )
            }
            onMouseLeave={() => setHover(null)}
            onKeyDown={onKeyDown}
          >
            <defs>
              <clipPath id={clipId}>
                <rect x={M.left} y={M.top} width={innerW} height={innerH} />
              </clipPath>
            </defs>

            {/* grid + y labels */}
            {ticksY.map((t) => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={M.left + innerW}
                  y1={sy(t)}
                  y2={sy(t)}
                  stroke="var(--chart-grid)"
                  strokeWidth={1}
                />
                <text
                  x={M.left - 8}
                  y={sy(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-ink-3 text-[11px] tabular-nums"
                >
                  {formatValue(t)}
                </text>
              </g>
            ))}

            {/* x ticks */}
            {ticksX.map((t) => (
              <text
                key={t}
                x={sx(t)}
                y={M.top + innerH + 18}
                textAnchor="middle"
                className="fill-ink-3 text-[11px] tabular-nums"
              >
                {t}
              </text>
            ))}
            <text
              x={M.left + innerW + 8}
              y={M.top + innerH + 18}
              className="fill-ink-3 text-[11px]"
            >
              yrs
            </text>

            {/* baseline */}
            <line
              x1={M.left}
              x2={M.left + innerW}
              y1={sy(0)}
              y2={sy(0)}
              stroke="var(--chart-baseline)"
              strokeWidth={1}
            />

            <g clipPath={`url(#${clipId})`}>
              {/* fills first */}
              {series.map(
                (s) =>
                  s.kind !== "line" && (
                    <path
                      key={`${s.id}-fill`}
                      d={areaPath(s.values, s.kind === "band" ? s.lower : undefined)}
                      fill={`var(${s.colorVar})`}
                      fillOpacity={0.26}
                    />
                  ),
              )}
              {/* 2px surface spacer between stacked fills */}
              {series.map(
                (s) =>
                  s.kind === "band" &&
                  s.lower && (
                    <path
                      key={`${s.id}-spacer`}
                      d={linePath(s.lower)}
                      fill="none"
                      stroke="var(--bg-surface)"
                      strokeWidth={2}
                    />
                  ),
              )}
              {/* edges + lines: thin marks, 2px */}
              {series.map((s) => (
                <path
                  key={`${s.id}-line`}
                  d={linePath(s.values)}
                  fill="none"
                  stroke={`var(${s.colorVar})`}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? "5 4" : undefined}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}
            </g>

            {/* crosshair + markers */}
            {hover !== null && hoverX !== null && (
              <g>
                <line
                  x1={hoverX}
                  x2={hoverX}
                  y1={M.top}
                  y2={M.top + innerH}
                  stroke="var(--chart-baseline)"
                  strokeWidth={1}
                />
                {series.map((s) => (
                  <circle
                    key={`${s.id}-dot`}
                    cx={hoverX}
                    cy={sy(s.values[hover] ?? 0)}
                    r={4}
                    fill={`var(${s.colorVar})`}
                    stroke="var(--bg-surface)"
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}

            {/* direct end labels (text wears ink, dot wears the hue) */}
            {!compact &&
              endLabels.map(({ s, y }) => (
                <g key={`${s.id}-endlabel`}>
                  <circle
                    cx={M.left + innerW + 8}
                    cy={y}
                    r={3}
                    fill={`var(${s.colorVar})`}
                  />
                  <text
                    x={M.left + innerW + 15}
                    y={y}
                    dominantBaseline="middle"
                    className="fill-ink-2 text-[11px]"
                  >
                    {s.shortLabel ?? s.label}
                  </text>
                </g>
              ))}
          </svg>
        )}

        {/* tooltip */}
        {hover !== null && hoverX !== null && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 rounded-card border border-line bg-raised px-3 py-2 text-xs shadow-lg"
            style={{
              left: Math.min(Math.max(hoverX + 10, 0), width - 190),
              top: M.top,
              width: 180,
            }}
          >
            <div className="mb-1 font-medium text-ink-1">
              Year {xValues[hover]}
            </div>
            {series.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-ink-2">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full"
                    style={{ background: `var(${s.colorVar})` }}
                  />
                  {s.label}
                </span>
                <span className="tabular-nums text-ink-1">
                  {formatValue(s.values[hover] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
