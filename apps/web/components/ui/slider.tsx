"use client";

import { cn } from "@/lib/cn";
import { useId, useState } from "react";
import type { KeyboardEvent } from "react";

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Display formatting for the value bubble and paired input, e.g. ₹5,000. */
  formatValue?: (v: number) => string;
  /** Spoken value for screen readers, e.g. "₹5,000 per month". Defaults to formatValue. */
  valueText?: (v: number) => string;
  /** Unit hint rendered beside the paired input, e.g. "%", "yrs". */
  unit?: string;
  disabled?: boolean;
  className?: string;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/**
 * The product's hero control (docs/10 §4): styled native range input
 * (native = keyboard/AT support for free) + always-visible paired numeric
 * input. Shift+Arrow jumps 10 steps; Home/End go to min/max (native).
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (v) => String(v),
  valueText,
  unit,
  disabled,
  className,
}: SliderProps) {
  const id = useId();
  // Draft state so the paired input can hold partial text while typing.
  const [draft, setDraft] = useState<string | null>(null);

  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number(draft.replace(/[^\d.-]/g, ""));
    if (!Number.isNaN(parsed)) onChange(clamp(parsed, min, max));
    setDraft(null);
  };

  // Own the keyboard entirely rather than relying on each browser's native
  // range behavior: deterministic steps, Shift = ×10, PageUp/Down = ×10.
  const onRangeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const big = step * 10;
    let next: number | null = null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = value + (e.shiftKey ? big : step);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = value - (e.shiftKey ? big : step);
        break;
      case "PageUp":
        next = value + big;
        break;
      case "PageDown":
        next = value - big;
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
    }
    if (next !== null) {
      e.preventDefault();
      onChange(clamp(next, min, max));
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink-2">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`${label} (exact value)`}
            className={cn(
              "h-9 w-28 rounded-field border border-line bg-surface px-2 text-right",
              "text-sm font-medium tabular-nums text-ink-1",
              "focus-visible:border-brand",
            )}
            value={draft ?? formatValue(value)}
            onFocus={() => setDraft(String(value))}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitDraft();
                e.currentTarget.blur();
              }
            }}
            disabled={disabled}
          />
          {unit && <span className="text-sm text-ink-3">{unit}</span>}
        </div>
      </div>

      <div className="relative">
        <input
          id={id}
          type="range"
          className="bs-range"
          style={{ "--fill": `${pct}%` } as React.CSSProperties}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-valuetext={(valueText ?? formatValue)(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          onKeyDown={onRangeKeyDown}
        />
      </div>

      <div className="flex justify-between text-xs text-ink-3 tabular-nums">
        <span aria-hidden="true">{formatValue(min)}</span>
        <span aria-hidden="true">{formatValue(max)}</span>
      </div>
    </div>
  );
}
