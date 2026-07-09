"use client";

import {
  paiseToRupees,
  requiredMonthly,
  rupeesToPaise,
} from "@banksim/finance-core";
import { DonutSplit } from "@/components/charts/donut-split";
import { ExplainerPanel } from "@/components/simulator/explainer";
import { SimulatorShell } from "@/components/simulator/shell";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SelectInput } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { StatCard } from "@/components/ui/stat-card";
import { formatMoney, formatPercent } from "@/lib/format";
import { parseParams, useUrlSync, type ParamSpec } from "@/lib/url-state";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const TEMPLATES = [
  { id: "bike", emoji: "🏍️", label: "Bike", amount: 150000, months: 24 },
  { id: "laptop", emoji: "💻", label: "Laptop", amount: 80000, months: 18 },
  { id: "education", emoji: "🎓", label: "Higher education", amount: 1000000, months: 48 },
  { id: "emergency", emoji: "🛟", label: "Emergency fund", amount: 300000, months: 24 },
  { id: "house", emoji: "🏠", label: "House down payment", amount: 2000000, months: 60 },
  { id: "vacation", emoji: "✈️", label: "Vacation", amount: 200000, months: 12 },
] as const;

const SPECS = {
  target: { kind: "int", def: 80000, min: 5000, max: 10000000 },
  months: { kind: "int", def: 18, min: 3, max: 360 },
  ret: { kind: "float", def: 6, min: 0, max: 20 },
  infladj: { kind: "enum", def: "off", options: ["off", "on"] },
  infl: { kind: "float", def: 6, min: 0, max: 12 },
} satisfies Record<string, ParamSpec>;

/** Educational horizon-based instrument hint (docs/02 F8). */
function suggestInstruments(months: number): string {
  if (months <= 24) return "Short horizon (under 2 years): low-risk options like an RD or FD keep your money safe when you can't ride out market dips.";
  if (months <= 60) return "Medium horizon (2–5 years): a mix of debt funds and some equity balances growth against safety.";
  return "Long horizon (5+ years): equity SIPs (index funds) have historically outgrown inflation and can ride out volatility.";
}

function GoalPlanner() {
  const searchParams = useSearchParams();
  const [v, setV] = useState(() => parseParams(SPECS, searchParams));
  useUrlSync(SPECS, v);

  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const applyTemplate = (t: (typeof TEMPLATES)[number]) =>
    setV((prev) => ({ ...prev, target: t.amount, months: t.months }));

  const result = useMemo(
    () =>
      requiredMonthly({
        targetPaise: rupeesToPaise(v.target),
        months: v.months,
        annualReturnPct: v.ret,
        inflationAdjust: v.infladj === "on",
        inflationPct: v.infl,
      }),
    [v],
  );

  const monthlyR = paiseToRupees(result.monthlyRequiredPaise);
  const years = (v.months / 12).toFixed(v.months % 12 === 0 ? 0 : 1);

  return (
    <SimulatorShell
      title="Goal Planner"
      intro="Turn 'someday' into a number. Pick a goal, set a date, and see exactly how much to save each month — and how much the interest chips in."
      announcement={`Save ${formatMoney(monthlyR)} per month to reach ${formatMoney(v.target)} in ${v.months} months`}
      controls={
        <>
          <Slider label="Target amount" value={v.target} min={SPECS.target.min} max={SPECS.target.max} step={5000} onChange={(x) => set("target", x)} formatValue={(x) => formatMoney(x)} valueText={(x) => `${formatMoney(x)} goal`} />
          <Slider label="Time to goal" value={v.months} min={SPECS.months.min} max={SPECS.months.max} step={1} onChange={(x) => set("months", x)} formatValue={(x) => `${x} mo`} valueText={(x) => `${x} months`} />
          <Slider label="Expected return" value={v.ret} min={SPECS.ret.min} max={SPECS.ret.max} step={0.5} onChange={(x) => set("ret", x)} formatValue={(x) => formatPercent(x)} valueText={(x) => `${formatPercent(x)} return`} unit="p.a." />
          <Field label="Inflation-adjust the target?" help="Keeps the goal's real buying power.">
            {(props) => (
              <SelectInput {...props} options={[{ value: "off", label: "No" }, { value: "on", label: "Yes" }]} value={v.infladj} onChange={(e) => set("infladj", e.target.value)} />
            )}
          </Field>
          {v.infladj === "on" && (
            <Slider label="Inflation" value={v.infl} min={SPECS.infl.min} max={SPECS.infl.max} step={0.5} onChange={(x) => set("infl", x)} formatValue={(x) => formatPercent(x)} valueText={(x) => `${formatPercent(x)} inflation`} unit="p.a." />
          )}
        </>
      }
    >
      <Card>
        <h2 className="mb-3 text-sm font-medium text-ink-2">Start from a common goal</h2>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm transition-colors hover:border-brand hover:text-brand"
            >
              <span aria-hidden="true">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Save each month" value={monthlyR} format={(x) => formatMoney(x)} gold />
        <StatCard label="You contribute" value={paiseToRupees(result.totalContributedPaise)} format={(x) => formatMoney(x)} />
        <StatCard label="Interest chips in" value={paiseToRupees(result.interestPaise)} format={(x) => formatMoney(x)} delta={{ text: "for free", tone: "good" }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">
            {v.infladj === "on" ? "Inflation-adjusted goal" : "Your goal"}: {formatMoney(paiseToRupees(result.effectiveTargetPaise))}
          </h2>
          <DonutSplit
            centerLabel="Reached in"
            centerValue={`${years} yr${years === "1" ? "" : "s"}`}
            format={(x) => formatMoney(x)}
            slices={[
              { id: "contrib", label: "Your contributions", value: paiseToRupees(result.totalContributedPaise), colorVar: "--series-1" },
              { id: "interest", label: "Growth (interest)", value: paiseToRupees(result.interestPaise), colorVar: "--series-2" },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Where to put it</h2>
          <p className="text-sm text-ink-2">{suggestInstruments(v.months)}</p>
          <Link
            href={`/investments?monthly=${Math.round(monthlyR)}&years=${Math.max(1, Math.round(v.months / 12))}`}
            className="text-sm font-medium text-brand-strong underline-offset-2 hover:underline dark:text-brand"
          >
            Compare instruments for this plan →
          </Link>
        </Card>
      </div>

      <ExplainerPanel
        formula={[
          v.infladj === "on"
            ? `Adjusted target = ${formatMoney(v.target)} × (1 + ${v.infl / 100})^${years} = ${formatMoney(paiseToRupees(result.effectiveTargetPaise))}`
            : `Target = ${formatMoney(v.target)}`,
          `Monthly = target · r / ((1+r)^n − 1),   r = ${formatPercent(v.ret)} ÷ 12,  n = ${v.months}`,
          `        = ${formatMoney(monthlyR)} per month`,
        ].join("\n")}
      >
        <p>
          To reach <strong>{formatMoney(paiseToRupees(result.effectiveTargetPaise))}</strong> in {v.months} months, you save{" "}
          <strong>{formatMoney(monthlyR)}</strong> every month. Of the final amount,{" "}
          <strong>{formatMoney(paiseToRupees(result.interestPaise))}</strong> comes from returns — money you didn&rsquo;t have to earn.
        </p>
        {v.infladj === "on" && (
          <p>
            Because you switched on inflation-adjustment, the target grew from {formatMoney(v.target)} to{" "}
            <strong>{formatMoney(paiseToRupees(result.effectiveTargetPaise))}</strong> — that&rsquo;s what {formatMoney(v.target)} of today&rsquo;s stuff will actually cost.
          </p>
        )}
        <p>
          A higher expected return means a smaller monthly saving — but higher-return instruments carry more risk, which matters more the sooner you need the money.
        </p>
      </ExplainerPanel>
    </SimulatorShell>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<main className="p-10 text-ink-3">Loading…</main>}>
      <GoalPlanner />
    </Suspense>
  );
}
