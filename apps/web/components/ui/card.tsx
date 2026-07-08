import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

/** Solid surface card — the default reading/content container. */
export function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface p-6 max-sm:p-4",
        className,
      )}
      {...rest}
    />
  );
}

/**
 * Glass panel — floating layers only (tutor drawer, compare overlays,
 * stat cards over heroes). Never for text-dense reading surfaces
 * (docs/10-design-system.md §1).
 */
export function GlassCard({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass p-6 max-sm:p-4", className)} {...rest} />;
}
