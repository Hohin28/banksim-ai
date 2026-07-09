"use client";

import { cn } from "@/lib/cn";

export interface GaugeBand {
  /** Upper edge of this band on the value scale. */
  upTo: number;
  colorVar: string;
  label: string;
}

/**
 * Semicircular arc gauge for DTI/FOIR and (later) credit scores
 * (docs/04 W3/W4). Bands carry meaning by position + label, and the numeric
 * value is always shown as text — never color alone.
 */
export function Gauge({
  value,
  min,
  max,
  bands,
  valueText,
  caption,
  markerLabel,
  className,
}: {
  value: number;
  min: number;
  max: number;
  bands: GaugeBand[];
  valueText: string;
  caption?: string;
  /** Optional label for the current band, shown under the value. */
  markerLabel?: string;
  className?: string;
}) {
  const W = 220;
  const H = 128;
  const cx = W / 2;
  const cy = H - 12;
  const R = 92;
  const clamped = Math.min(max, Math.max(min, value));
  const frac = (clamped - min) / (max - min);

  // Map fraction [0,1] → angle across the top semicircle (180°→0°).
  const angle = Math.PI * (1 - frac);
  const px = cx + R * Math.cos(angle);
  const py = cy - R * Math.sin(angle);

  const arc = (fromFrac: number, toFrac: number) => {
    const a0 = Math.PI * (1 - fromFrac);
    const a1 = Math.PI * (1 - toFrac);
    const x0 = cx + R * Math.cos(a0);
    const y0 = cy - R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1);
    const y1 = cy - R * Math.sin(a1);
    return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`;
  };

  // Precompute each band's start edge so nothing is reassigned during render.
  const bandArcs = bands.reduce<{ band: GaugeBand; from: number }[]>(
    (acc, band) => {
      const from = acc.length ? acc[acc.length - 1]!.band.upTo : min;
      acc.push({ band, from });
      return acc;
    },
    [],
  );
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${caption ?? "Gauge"}: ${valueText}${markerLabel ? `, ${markerLabel}` : ""}`}
      >
        {bandArcs.map(({ band, from }) => (
          <path
            key={band.label}
            d={arc((from - min) / (max - min), (band.upTo - min) / (max - min))}
            fill="none"
            stroke={`var(${band.colorVar})`}
            strokeWidth={12}
            strokeLinecap="butt"
          />
        ))}
        {/* needle */}
        <line
          x1={cx}
          y1={cy}
          x2={px}
          y2={py}
          stroke="var(--ink-1)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill="var(--ink-1)" />
      </svg>
      <div className="-mt-4 text-center">
        <div className="font-display text-2xl font-semibold tabular-nums">
          {valueText}
        </div>
        {markerLabel && <div className="text-sm text-ink-2">{markerLabel}</div>}
      </div>
    </div>
  );
}
