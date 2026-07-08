"use client";

import { cn } from "@/lib/cn";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export interface StatCardProps {
  label: string;
  value: number;
  format?: (v: number) => string;
  /** Optional change chip, e.g. { text: "+₹5.2L", tone: "good" }. */
  delta?: { text: string; tone: "good" | "bad" | "neutral" };
  /** Gold treatment for "money moments" — final amounts, interest earned. */
  gold?: boolean;
  className?: string;
}

const deltaTone = {
  good: "text-status-good",
  bad: "text-danger",
  neutral: "text-ink-3",
} as const;

/**
 * Headline number card (docs/10 §4). Values count up over 400 ms;
 * with reduced motion they snap instantly. Width never jitters (tabular-nums).
 */
export function StatCard({
  label,
  value,
  format = (v) => String(Math.round(v)),
  delta,
  gold = false,
  className,
}: StatCardProps) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: DURATION.data,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduced, mv]);

  // Reduced motion renders the target directly — values snap, never tween.
  const shown = reduced ? value : display;

  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface px-6 py-4 max-sm:px-4",
        className,
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-ink-2">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className={cn(
            "font-display text-3xl font-semibold tabular-nums",
            gold ? "text-gold" : "text-ink-1",
          )}
        >
          {format(shown)}
        </span>
        {delta && (
          <span
            className={cn(
              "text-sm font-medium tabular-nums",
              deltaTone[delta.tone],
            )}
          >
            {delta.text}
          </span>
        )}
      </div>
    </div>
  );
}
