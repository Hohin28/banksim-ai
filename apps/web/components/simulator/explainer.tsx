import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

/**
 * "How this was calculated" panel (docs/04 W2): the real formula with the
 * user's numbers substituted, then a plain-language walkthrough. Every
 * simplification is labeled; the not-advice chip is always present.
 */
export function ExplainerPanel({
  formula,
  children,
}: {
  /** The formula with substituted values, rendered in mono. */
  formula: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">How this was calculated</h2>
        <Badge variant="neutral">simulation — not advice</Badge>
      </div>
      <pre className="overflow-x-auto rounded-field border border-line bg-page px-4 py-3 font-mono text-sm text-ink-1">
        {formula}
      </pre>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink-2 [&_strong]:text-ink-1">
        {children}
      </div>
    </Card>
  );
}
