"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  GLOSSARY,
  type GlossaryEntry,
  type TermId,
} from "@/lib/glossary";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useMemo } from "react";

/**
 * Full explainer page for one glossary term (docs/02 F11 companion): the
 * HOW / worked example / WHY / misconception structure, with the example's
 * numbers computed live by finance-core so a page can never drift from the
 * simulators.
 */
export function GlossaryTermView({ id }: { id: TermId }) {
  const entry: GlossaryEntry = GLOSSARY[id];
  // Cheap, but only worth running once per term.
  const example = useMemo(() => entry.example(), [entry]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 max-sm:px-4">
      <Link href="/learn/glossary" className="text-sm text-ink-2 hover:text-brand">
        ← All terms
      </Link>

      <header className="mb-8 mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-semibold max-sm:text-3xl">{entry.term}</h1>
          <Badge variant="neutral">{CATEGORY_LABELS[entry.category]}</Badge>
        </div>
        <p className="text-lg text-ink-2">{entry.what}</p>
      </header>

      <div className="flex flex-col gap-6">
        {/* HOW */}
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">How it works</h2>
          <p className="leading-relaxed text-ink-2">{entry.how}</p>
          {entry.formula && (
            <pre className="overflow-x-auto rounded-field border border-line bg-page px-4 py-3 font-mono text-sm text-ink-1">
              {entry.formula}
            </pre>
          )}
        </Card>

        {/* WORKED EXAMPLE */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">A worked example</h2>
            <Badge variant="brand">real numbers</Badge>
          </div>
          <p className="text-sm text-ink-2">{example.setup}</p>
          <ul className="flex flex-col divide-y divide-line">
            {example.rows.map((row) => (
              <li
                key={row.label}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
              >
                <span className={cn("text-sm", row.highlight ? "text-ink-1" : "text-ink-2")}>
                  {row.label}
                </span>
                <span
                  className={cn(
                    "tabular-nums",
                    row.highlight
                      ? "font-display text-lg font-semibold text-gold"
                      : "text-ink-1",
                  )}
                >
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
          <p className="rounded-field border-l-4 border-brand bg-brand/5 px-4 py-3 text-sm leading-relaxed">
            {example.takeaway}
          </p>
          <p className="text-xs text-ink-3">
            These figures are calculated by the same engine that powers the
            simulators — not typed in by hand.
          </p>
        </Card>

        {/* WHY */}
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Why it matters</h2>
          <p className="leading-relaxed text-ink-2">{entry.why}</p>
        </Card>

        {/* MISCONCEPTION */}
        <Card className="flex flex-col gap-3 border-status-warning/40 bg-status-warning/5">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">⚠</span>
            <h2 className="text-xl font-semibold">The common mistake</h2>
          </div>
          <p className="text-lg font-medium text-ink-1">{entry.misconception.claim}</p>
          <p className="leading-relaxed text-ink-2">{entry.misconception.truth}</p>
        </Card>

        {/* SEE IT LIVE */}
        {entry.tryIt && (
          <Link
            href={entry.tryIt.href}
            className="flex items-center justify-between gap-4 rounded-panel border border-brand bg-brand/5 px-5 py-4 transition-colors hover:bg-brand/10"
          >
            <span>
              <span className="block font-semibold text-brand-strong dark:text-brand">
                ▶ See it live
              </span>
              <span className="text-sm text-ink-2">{entry.tryIt.label}</span>
            </span>
            <span aria-hidden="true" className="text-brand">→</span>
          </Link>
        )}

        {/* RELATED */}
        {entry.related.length > 0 && (
          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">Related terms</h2>
            <div className="flex flex-wrap gap-2">
              {entry.related.map((rid) => (
                <Link
                  key={rid}
                  href={`/learn/glossary/${rid}`}
                  className="rounded-full border border-line bg-page px-3 py-1 text-sm text-ink-2 transition-colors hover:border-brand hover:text-brand"
                >
                  {GLOSSARY[rid].term}
                </Link>
              ))}
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
          <Link href="/learn/glossary" className="text-sm text-ink-2 hover:text-brand">
            ← All terms
          </Link>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(entry.searchQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-3 underline-offset-2 hover:text-ink-1 hover:underline"
          >
            Search the wider web ↗
          </a>
        </div>
      </div>
    </main>
  );
}
