import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "gold"
  | "danger"
  /** Status variants are reserved for real state — never decoration
      (docs/10 §6). They always render with a leading dot + text label. */
  | "good"
  | "warning"
  | "serious"
  | "critical";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-ink-1/5 text-ink-2",
  brand: "bg-brand/10 text-brand-strong dark:text-brand",
  gold: "bg-gold/15 text-gold",
  danger: "bg-danger/10 text-danger",
  good: "bg-status-good/10 text-status-good",
  warning: "bg-status-warning/15 text-ink-1",
  serious: "bg-status-serious/15 text-ink-1",
  critical: "bg-status-critical/10 text-status-critical",
};

const STATUS_VARIANTS: ReadonlySet<BadgeVariant> = new Set([
  "good",
  "warning",
  "serious",
  "critical",
]);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({
  variant = "neutral",
  className,
  children,
  ...rest
}: BadgeProps) {
  const isStatus = STATUS_VARIANTS.has(variant);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {isStatus && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", {
            "bg-status-good": variant === "good",
            "bg-status-warning": variant === "warning",
            "bg-status-serious": variant === "serious",
            "bg-status-critical": variant === "critical",
          })}
        />
      )}
      {children}
    </span>
  );
}
