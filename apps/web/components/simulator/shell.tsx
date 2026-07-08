"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Shared simulator layout (docs/04 W2): controls rail + results column,
 * stacking on small screens. Includes a polite live region that announces
 * the headline result, throttled so slider drags don't spam screen readers
 * (docs/10 §7).
 */
export interface SimulatorShellProps {
  title: string;
  intro: string;
  controls: ReactNode;
  children: ReactNode;
  /** Headline sentence for assistive announcement, e.g. "Final amount ₹17.3 lakh". */
  announcement?: string;
}

export function SimulatorShell({
  title,
  intro,
  controls,
  children,
  announcement,
}: SimulatorShellProps) {
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    if (!announcement) return;
    const t = setTimeout(() => setAnnounced(announcement), 800);
    return () => clearTimeout(t);
  }, [announcement]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 max-sm:px-4">
      <header className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-semibold max-sm:text-3xl">{title}</h1>
          <Badge variant="brand">simulation</Badge>
        </div>
        <p className="max-w-2xl text-ink-2">{intro}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="flex h-fit flex-col gap-6 lg:sticky lg:top-6">
          {controls}
        </Card>
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announced}
      </div>
    </main>
  );
}
