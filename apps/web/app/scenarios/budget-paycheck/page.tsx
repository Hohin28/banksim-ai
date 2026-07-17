"use client";

import {
  CARD_APR_PCT,
  evaluateBudget,
  paiseToRupees,
  rupeesToPaise,
  type BudgetResult,
  type ShockSource,
} from "@banksim/finance-core";
import { Reveal, VerdictBanner } from "@/components/scenarios/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Term } from "@/components/ui/term";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import Link from "next/link";
import { useMemo, useState } from "react";

const INCOME = 40000;
const SHOCK = 9000;
const SHOCK_LABEL = "Your phone screen shatters — a ₹9,000 repair you didn't see coming.";

const SEG_COLOR: Record<string, string> = {
  needs: "var(--series-1)",
  wants: "var(--series-8)",
  savings: "var(--series-2)",
  buffer: "var(--series-5)",
};

const SOURCE_LABEL: Record<ShockSource, string> = {
  buffer: "Unspent buffer",
  emergency_fund: "Emergency fund",
  savings: "This month's savings",
  card: "Credit card (debt!)",
};

const OUTCOME: Record<BudgetResult["outcome"], { emoji: string; title: string; tone: "good" | "bad" | "warning" | "neutral" }> = {
  thrived: { emoji: "😎", title: "You barely noticed the shock", tone: "good" },
  survived: { emoji: "🛟", title: "Your emergency fund did its job", tone: "good" },
  squeezed: { emoji: "😅", title: "You survived — but it ate your savings", tone: "warning" },
  debt_spiral: { emoji: "🕳️", title: "The shock became credit-card debt", tone: "bad" },
};

export default function BudgetScenario() {
  const [needs, setNeeds] = useState(20000);
  const [wants, setWants] = useState(12000);
  const [savings, setSavings] = useState(6000);
  const [emergencyFund, setEmergencyFund] = useState(0);
  const [shocked, setShocked] = useState(false);

  const buffer = INCOME - needs - wants - savings;
  const over = buffer < 0;

  const result = useMemo(
    () =>
      evaluateBudget({
        incomePaise: rupeesToPaise(INCOME),
        needsPaise: rupeesToPaise(needs),
        wantsPaise: rupeesToPaise(wants),
        savingsPaise: rupeesToPaise(savings),
        emergencyFundPaise: rupeesToPaise(emergencyFund),
        shockPaise: rupeesToPaise(SHOCK),
        cardRepayMonths: 6,
      }),
    [needs, wants, savings, emergencyFund],
  );

  // Allocation bar segments (only the positive, real allocations).
  const segments = [
    { key: "needs", label: "Needs", value: needs },
    { key: "wants", label: "Wants", value: wants },
    { key: "savings", label: "Savings", value: savings },
    ...(buffer > 0 ? [{ key: "buffer", label: "Buffer", value: buffer }] : []),
  ];

  const outcome = OUTCOME[result.outcome];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 max-sm:px-4">
      <Link href="/scenarios" className="text-sm text-ink-2 hover:text-brand">
        ← All scenarios
      </Link>

      <header className="mb-6 mt-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-semibold max-sm:text-3xl">Budget one paycheck</h1>
          <Badge variant="brand">scenario</Badge>
        </div>
        <p className="max-w-2xl text-ink-2">
          Your salary of <strong>{formatMoney(INCOME)}</strong> just landed.
          Split it across needs, wants and savings. Then — because life does
          this — something unexpected will hit mid-month. Budget so it
          doesn&rsquo;t wreck you.
        </p>
      </header>

      <Card className="mb-6 flex flex-col gap-5">
        <Slider label="Needs — rent, food, bills, transport" value={needs} min={0} max={INCOME} step={500} onChange={setNeeds} formatValue={(v) => formatMoney(v)} />
        <Slider label="Wants — dining, subscriptions, shopping" value={wants} min={0} max={INCOME} step={500} onChange={setWants} formatValue={(v) => formatMoney(v)} />
        <Slider label="Savings — set aside this month" value={savings} min={0} max={INCOME} step={500} onChange={setSavings} formatValue={(v) => formatMoney(v)} />
        <Slider label="Emergency fund — saved from before" value={emergencyFund} min={0} max={100000} step={1000} onChange={setEmergencyFund} formatValue={(v) => formatMoney(v)} />

        {/* Live allocation bar */}
        <div className="flex flex-col gap-2">
          <div className="flex h-6 w-full overflow-hidden rounded-full bg-ink-1/8" role="img" aria-label={`Allocation: needs ${result.needsPct}%, wants ${result.wantsPct}%, savings ${result.savingsPct}%`}>
            {!over &&
              segments.map((s) => (
                <div
                  key={s.key}
                  className="h-full"
                  style={{ width: `${(s.value / INCOME) * 100}%`, background: SEG_COLOR[s.key] }}
                  title={`${s.label}: ${formatMoney(s.value)}`}
                />
              ))}
            {over && <div className="h-full w-full bg-danger" />}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
            {segments.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ background: SEG_COLOR[s.key] }} />
                {s.label} {formatMoney(s.value)}
              </span>
            ))}
          </div>
          <p className={cn("text-sm", over ? "font-medium text-danger" : buffer === 0 ? "text-status-warning" : "text-ink-2")}>
            {over
              ? `You've allocated ${formatMoney(-buffer)} more than you earn.`
              : buffer === 0
                ? "Every rupee allocated — zero buffer for surprises."
                : `Unspent buffer: ${formatMoney(buffer)} (this is your first line of defence).`}
          </p>
        </div>

        <div className="rounded-card border border-line bg-page px-4 py-2.5 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-3">Reference · the 50 / 30 / 20 guide: </span>
          needs ~50% · wants ~30% · savings ~20%. You&rsquo;re at{" "}
          <strong>{result.needsPct}% / {result.wantsPct}% / {result.savingsPct}%</strong>.
        </div>
      </Card>

      {!shocked ? (
        <Button onClick={() => setShocked(true)} disabled={over}>
          {over ? "Fix your over-budget first" : "Advance to mid-month →"}
        </Button>
      ) : (
        <Reveal show className="flex flex-col gap-5">
          <Card className="border-status-warning/40 bg-status-warning/5">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">⚡</span>
              <p className="font-medium">{SHOCK_LABEL}</p>
            </div>
          </Card>

          <VerdictBanner
            emoji={outcome.emoji}
            title={outcome.title}
            tone={outcome.tone}
            subtitle={`How your ${formatMoney(SHOCK)} shock got paid, step by step:`}
          />

          {/* The waterfall */}
          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">The shock waterfall</h2>
            <ul className="flex flex-col gap-2">
              {result.absorption.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-field border border-line bg-page px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-ink-1/8 text-xs tabular-nums">{i + 1}</span>
                    <span className={a.source === "card" ? "font-medium text-danger" : "text-ink-2"}>{SOURCE_LABEL[a.source]}</span>
                  </span>
                  <span className={cn("tabular-nums", a.source === "card" ? "font-semibold text-danger" : "text-ink-1")}>
                    −{formatMoney(paiseToRupees(a.amountPaise))}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {result.cardDebtPaise > 0 && (
            <Card className="border-danger/40 bg-danger/5">
              <h2 className="mb-2 text-lg font-semibold">🕳️ Where a ₹9,000 problem becomes bigger</h2>
              <p className="mb-3 text-sm leading-relaxed text-ink-2">
                {formatMoney(paiseToRupees(result.cardDebtPaise))} of the shock had
                nowhere to land but a <Term id="utilisation">credit card</Term>. Carried for 6
                months at {CARD_APR_PCT}% APR, it quietly grows:
              </p>
              <div className="flex items-center justify-center gap-3 text-center">
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink-3">Landed on card</div>
                  <div className="font-display text-xl font-semibold tabular-nums">{formatMoney(paiseToRupees(result.cardDebtPaise))}</div>
                </div>
                <span aria-hidden="true" className="text-2xl text-danger">→</span>
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink-3">After 6 months</div>
                  <div className="font-display text-xl font-semibold tabular-nums text-danger">{formatMoney(paiseToRupees(result.cardDebtAfterInterestPaise))}</div>
                </div>
              </div>
              <p className="mt-3 text-center text-sm text-ink-2">
                An extra <strong className="text-danger">{formatMoney(paiseToRupees(result.cardInterestPaise))}</strong> in
                interest — the shock&rsquo;s true price was never ₹9,000.
              </p>
            </Card>
          )}

          <Card className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">What this month taught you</h2>
            {result.notes.map((note, i) => (
              <p key={i} className="text-sm leading-relaxed text-ink-2">• {note}</p>
            ))}
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setShocked(false)}>
              Rebudget and try again
            </Button>
            {result.outcome === "debt_spiral" && (
              <span className="text-sm text-ink-2">
                Tip: nudge savings down and rebuild an <strong>emergency fund</strong> — watch the shock land safely next time.
              </span>
            )}
          </div>
        </Reveal>
      )}
    </main>
  );
}
