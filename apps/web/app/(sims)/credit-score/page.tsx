"use client";

import {
  applyAction,
  computeFactors,
  currentScore,
  FACTOR_WEIGHTS,
  initCreditState,
  type CreditAction,
  type CreditEvent,
  type CreditState,
  type StartingProfile,
} from "@banksim/finance-core";
import { FactorBars } from "@/components/charts/factor-bars";
import { Gauge } from "@/components/charts/gauge";
import { ExplainerPanel } from "@/components/simulator/explainer";
import { SimulatorShell } from "@/components/simulator/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TermStrip } from "@/components/ui/term";
import { useLocalState } from "@/lib/use-local-state";
import Link from "next/link";
import { useMemo } from "react";

interface Journey {
  profile: StartingProfile;
  state: CreditState;
  events: CreditEvent[];
}

const ACTIONS: { action: CreditAction; label: string; tone: "up" | "down" }[] = [
  { action: { type: "PAY_ON_TIME" }, label: "Pay EMI on time", tone: "up" },
  { action: { type: "MISS_EMI" }, label: "Miss an EMI", tone: "down" },
  { action: { type: "MAX_OUT_CARD" }, label: "Max out credit card", tone: "down" },
  { action: { type: "PAY_DOWN_CARD" }, label: "Pay card down", tone: "up" },
  { action: { type: "OPEN_ACCOUNT" }, label: "Open a new account", tone: "down" },
  { action: { type: "CLOSE_OLDEST" }, label: "Close oldest account", tone: "down" },
  { action: { type: "ADVANCE_MONTHS", months: 3 }, label: "Advance 3 months", tone: "up" },
];

const PROFILES: { id: StartingProfile; label: string }[] = [
  { id: "new", label: "New to credit" },
  { id: "building", label: "Building" },
  { id: "established", label: "Established" },
];

function freshJourney(profile: StartingProfile): Journey {
  return { profile, state: initCreditState(profile), events: [] };
}

function scoreBand(score: number): { label: string; variant: "critical" | "serious" | "warning" | "good" } {
  if (score < 550) return { label: "Poor", variant: "critical" };
  if (score < 650) return { label: "Fair", variant: "serious" };
  if (score < 750) return { label: "Good", variant: "warning" };
  return { label: "Excellent", variant: "good" };
}

export default function CreditScorePage() {
  const [journey, setJourney, reset] = useLocalState<Journey>(
    "banksim.credit-journey",
    freshJourney("new"),
  );

  const score = useMemo(() => currentScore(journey.state), [journey.state]);
  const factors = useMemo(() => computeFactors(journey.state), [journey.state]);
  const band = scoreBand(score);

  const doAction = (action: CreditAction) =>
    setJourney((j) => {
      const { state, event } = applyAction(j.state, action);
      return { ...j, state, events: [...j.events, event] };
    });

  const switchProfile = (profile: StartingProfile) => setJourney(freshJourney(profile));

  const factorBars = [
    { label: "Payment history", value: factors.payment, weightPct: FACTOR_WEIGHTS.payment * 100 },
    { label: "Card utilisation", value: factors.utilisation, weightPct: FACTOR_WEIGHTS.utilisation * 100 },
    { label: "Credit age", value: factors.age, weightPct: FACTOR_WEIGHTS.age * 100 },
    { label: "Credit mix", value: factors.mix, weightPct: FACTOR_WEIGHTS.mix * 100 },
    { label: "Recent inquiries", value: factors.inquiries, weightPct: FACTOR_WEIGHTS.inquiries * 100 },
  ];

  // Concrete improvement tips from the weakest factors.
  const tips = factorBars
    .filter((f) => f.value < 70)
    .sort((a, b) => a.value - b.value)
    .slice(0, 3)
    .map((f) => TIPS[f.label]);

  const eligibility = loanEligibility(score);

  return (
    <SimulatorShell
      title="Credit Score Simulator"
      intro="What actually moves a credit score? Try the actions — miss a payment, max a card, let time pass — and watch the number respond. Nothing here touches your real score."
      announcement={`Credit score is now ${score}, ${band.label}`}
      controls={
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink-2">Start from a profile</span>
            <div className="flex flex-wrap gap-2">
              {PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => switchProfile(p.id)}
                  aria-pressed={journey.profile === p.id}
                  className={
                    "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                    (journey.profile === p.id
                      ? "border-brand bg-brand/10 text-brand-strong dark:text-brand"
                      : "border-line text-ink-2 hover:border-brand")
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink-2">Take an action</span>
            {ACTIONS.map((a) => (
              <Button
                key={a.label}
                variant="secondary"
                size="sm"
                className="justify-between"
                onClick={() => doAction(a.action)}
              >
                {a.label}
                <span aria-hidden="true" className={a.tone === "up" ? "text-status-good" : "text-danger"}>
                  {a.tone === "up" ? "▲" : "▼"}
                </span>
              </Button>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={reset}>
            Reset journey
          </Button>
        </>
      }
    >
      <TermStrip ids={["credit-score", "utilisation", "emi"]} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Your simulated score</h2>
            <Badge variant={band.variant}>{band.label}</Badge>
          </div>
          <Gauge
            value={score}
            min={300}
            max={900}
            valueText={String(score)}
            caption="Credit score"
            bands={[
              { upTo: 550, colorVar: "--status-critical", label: "poor" },
              { upTo: 650, colorVar: "--status-serious", label: "fair" },
              { upTo: 750, colorVar: "--status-warning", label: "good" },
              { upTo: 900, colorVar: "--status-good", label: "excellent" },
            ]}
          />
          <p className="text-center text-sm text-ink-2">
            {journey.state.simMonths > 0
              ? `${journey.state.simMonths} simulated months in`
              : "Take an action to begin your journey"}
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">What makes up the score</h2>
          <FactorBars factors={factorBars} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Your journey</h2>
          {journey.events.length === 0 ? (
            <p className="text-sm text-ink-3">No actions yet. Use the buttons on the left to see what changes the score.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {journey.events.slice(-12).reverse().map((e, i) => (
                <li key={journey.events.length - i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-2">
                    <span className="text-ink-3 tabular-nums">m{e.atMonth}</span> · {e.label}
                  </span>
                  <span className="flex items-center gap-2 tabular-nums">
                    <span className="text-ink-1">{e.scoreAfter}</span>
                    {e.delta !== 0 && (
                      <span className={e.delta > 0 ? "text-status-good" : "text-danger"}>
                        {e.delta > 0 ? "+" : ""}{e.delta}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="mb-2 text-lg font-semibold">What you qualify for</h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              {eligibility.map((e) => (
                <li key={e.label} className="flex items-center justify-between">
                  <span className="text-ink-2">{e.label}</span>
                  <Badge variant={e.ok ? "good" : "neutral"}>{e.ok ? "Likely" : "Unlikely"}</Badge>
                </li>
              ))}
            </ul>
            <Link
              href={`/loans?score=${score}`}
              className="mt-2 inline-block text-sm font-medium text-brand-strong underline-offset-2 hover:underline dark:text-brand"
            >
              Try this score in the loan simulator →
            </Link>
          </div>
          {tips.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">To improve</h3>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink-2">
                {tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <ExplainerPanel
        formula={`score = 300 + 600 × (0.35·payment + 0.30·utilisation + 0.15·age + 0.10·mix + 0.10·inquiries) / 100`}
      >
        <p>
          A credit score is a single number (300–900 here) that lenders read as &ldquo;how reliably does this person repay?&rdquo;. It is built from five factors, each weighted — <strong>payment history</strong> and <strong>card utilisation</strong> matter most.
        </p>
        <p>
          Notice how one missed EMI drops the score fast but heals slowly as months pass, while maxing a card hurts immediately and recovers the moment you pay it down. That asymmetry is the real lesson: <strong>payment history is hard to rebuild; utilisation is easy to fix.</strong>
        </p>
        <p>
          <strong>The common mistake:</strong> &ldquo;I&rsquo;ve never taken a loan, so my score must be excellent.&rdquo; No history is not good history — a thin file gives lenders nothing to judge, which is why the &ldquo;new to credit&rdquo; profile above starts in the mid-600s, not at 900. You build a score by using credit responsibly, not by avoiding it.
        </p>
        <p>
          These weights mirror how bureaus broadly work, but the exact model here is a teaching simplification — not any bureau&rsquo;s real algorithm.
        </p>
      </ExplainerPanel>
    </SimulatorShell>
  );
}

const TIPS: Record<string, string> = {
  "Payment history": "Pay every EMI on time — this factor carries the most weight and heals slowest.",
  "Card utilisation": "Keep credit-card balances under 30% of the limit; paying it down helps immediately.",
  "Credit age": "Keep your oldest account open — length of history helps.",
  "Credit mix": "A healthy mix of a loan and a card looks better than a single account type.",
  "Recent inquiries": "Avoid applying for several loans/cards in a short window.",
};

function loanEligibility(score: number) {
  return [
    { label: "Credit card", ok: score >= 650 },
    { label: "Personal loan", ok: score >= 700 },
    { label: "Home loan (best rates)", ok: score >= 760 },
  ];
}
