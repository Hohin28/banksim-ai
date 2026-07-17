"use client";

import { cn } from "@/lib/cn";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The dramatic "reveal" wrapper shared by the scenarios. Hidden until the
 * user commits a decision, then it drops in — the moment the true cost or
 * the shock's consequence lands. Honors reduced motion (snaps, no slide).
 */
export function Reveal({
  show,
  children,
  className,
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.data, ease: EASE_OUT }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type VerdictTone = "good" | "bad" | "neutral" | "warning";

const toneStyles: Record<VerdictTone, string> = {
  good: "border-status-good/40 bg-status-good/5",
  bad: "border-danger/40 bg-danger/5",
  warning: "border-status-warning/40 bg-status-warning/5",
  neutral: "border-line bg-surface",
};

/** A headline verdict banner for a revealed result. */
export function VerdictBanner({
  emoji,
  title,
  subtitle,
  tone = "neutral",
}: {
  emoji: string;
  title: string;
  subtitle?: ReactNode;
  tone?: VerdictTone;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-panel border px-5 py-4",
        toneStyles[tone],
      )}
    >
      <span className="text-4xl" aria-hidden="true">{emoji}</span>
      <div>
        <div className="font-display text-xl font-semibold">{title}</div>
        {subtitle && <div className="mt-0.5 text-sm text-ink-2">{subtitle}</div>}
      </div>
    </div>
  );
}
