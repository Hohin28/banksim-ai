"use client";

import {
  paiseToRupees,
  rupeesToPaise,
  simulateLoan,
  type EmploymentType,
} from "@banksim/finance-core";
import { DonutSplit } from "@/components/charts/donut-split";
import { Gauge } from "@/components/charts/gauge";
import { StackedBars } from "@/components/charts/stacked-bars";
import { ChartTable } from "@/components/charts/chart-table";
import { ExplainerPanel } from "@/components/simulator/explainer";
import { SimulatorShell } from "@/components/simulator/shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SelectInput } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs } from "@/components/ui/tabs";
import { TermStrip } from "@/components/ui/term";
import { formatMoney, formatPercent } from "@/lib/format";
import { parseParams, useUrlSync, type ParamSpec } from "@/lib/url-state";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const SPECS = {
  // max = realistic typed cap; sliders drag a comfortable sub-range.
  amount: { kind: "int", def: 500000, min: 10000, max: 100000000 },
  rate: { kind: "float", def: 9.5, min: 5, max: 24 },
  months: { kind: "int", def: 60, min: 6, max: 360 },
  income: { kind: "int", def: 60000, min: 5000, max: 10000000 },
  expenses: { kind: "int", def: 20000, min: 0, max: 10000000 },
  existing: { kind: "int", def: 0, min: 0, max: 5000000 },
  score: { kind: "int", def: 750, min: 300, max: 900 },
  emp: { kind: "enum", def: "salaried", options: ["salaried", "self-employed", "student"] },
} satisfies Record<string, ParamSpec>;

const EMPLOYMENT_OPTIONS = [
  { value: "salaried", label: "Salaried" },
  { value: "self-employed", label: "Self-employed" },
  { value: "student", label: "Student" },
];

const RISK_VARIANT = { low: "good", medium: "warning", high: "critical" } as const;

function LoanSimulator() {
  const searchParams = useSearchParams();
  const [v, setV] = useState(() => parseParams(SPECS, searchParams));
  useUrlSync(SPECS, v);

  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(
    () =>
      simulateLoan({
        principalPaise: rupeesToPaise(v.amount),
        annualRatePct: v.rate,
        months: v.months,
        monthlyIncomePaise: rupeesToPaise(v.income),
        monthlyExpensesPaise: rupeesToPaise(v.expenses),
        existingEmiPaise: rupeesToPaise(v.existing),
        creditScore: v.score,
        employment: v.emp as EmploymentType,
      }),
    [v],
  );

  const emiR = paiseToRupees(result.emiPaise);
  const years = Math.round(v.months / 12);

  // What-if: one extra year of tenure.
  const whatIf = useMemo(() => {
    if (v.months + 12 > 360) return null;
    const alt = simulateLoan({
      principalPaise: rupeesToPaise(v.amount),
      annualRatePct: v.rate,
      months: v.months + 12,
      monthlyIncomePaise: rupeesToPaise(v.income),
      monthlyExpensesPaise: rupeesToPaise(v.expenses),
      existingEmiPaise: rupeesToPaise(v.existing),
      creditScore: v.score,
      employment: v.emp as EmploymentType,
    });
    return {
      emiDrop: result.emiPaise - alt.emiPaise,
      interestRise: alt.totalInterestPaise - result.totalInterestPaise,
    };
  }, [v, result]);

  return (
    <SimulatorShell
      title="Loan Simulator"
      intro="Why does a ₹5 lakh loan cost ₹7 lakh to repay? Enter the numbers and see the EMI, the interest, and how a bank would weigh you up."
      announcement={`Monthly EMI ${formatMoney(emiR)}, ${result.risk} risk`}
      controls={
        <>
          <Slider label="Loan amount" value={v.amount} min={SPECS.amount.min} max={10000000} inputMax={SPECS.amount.max} step={10000} onChange={(x) => set("amount", x)} formatValue={(x) => formatMoney(x)} valueText={(x) => `${formatMoney(x)} loan`} />
          <Slider label="Interest rate" value={v.rate} min={SPECS.rate.min} max={SPECS.rate.max} step={0.25} onChange={(x) => set("rate", x)} formatValue={(x) => formatPercent(x)} valueText={(x) => `${formatPercent(x)} per year`} unit="p.a." />
          <Slider label="Tenure" value={v.months} min={SPECS.months.min} max={SPECS.months.max} step={6} onChange={(x) => set("months", x)} formatValue={(x) => `${x} mo`} valueText={(x) => `${x} months`} />
          <Slider label="Monthly income" value={v.income} min={SPECS.income.min} max={1000000} inputMax={SPECS.income.max} step={5000} onChange={(x) => set("income", x)} formatValue={(x) => formatMoney(x)} valueText={(x) => `${formatMoney(x)} income`} />
          <Slider label="Monthly expenses" value={v.expenses} min={SPECS.expenses.min} max={1000000} inputMax={SPECS.expenses.max} step={2000} onChange={(x) => set("expenses", x)} formatValue={(x) => formatMoney(x)} valueText={(x) => `${formatMoney(x)} expenses`} />
          <Slider label="Existing EMIs" value={v.existing} min={SPECS.existing.min} max={500000} inputMax={SPECS.existing.max} step={1000} onChange={(x) => set("existing", x)} formatValue={(x) => formatMoney(x)} valueText={(x) => `${formatMoney(x)} existing EMIs`} />
          <Slider label="Credit score" value={v.score} min={SPECS.score.min} max={SPECS.score.max} step={10} onChange={(x) => set("score", x)} formatValue={(x) => String(x)} valueText={(x) => `credit score ${x}`} />
          <Field label="Employment type">
            {(props) => (
              <SelectInput {...props} options={EMPLOYMENT_OPTIONS} value={v.emp} onChange={(e) => set("emp", e.target.value)} />
            )}
          </Field>
        </>
      }
    >
      <TermStrip ids={["emi", "foir", "tenure", "principal", "amortization"]} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Monthly EMI" value={emiR} format={(x) => formatMoney(x)} gold />
        <StatCard label="Total interest" value={paiseToRupees(result.totalInterestPaise)} format={(x) => formatMoney(x)} delta={{ text: `${result.interestRatioPct.toFixed(0)}% of loan`, tone: "neutral" }} />
        <StatCard label="Total you repay" value={paiseToRupees(result.totalPaymentPaise)} format={(x) => formatMoney(x)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Where your money goes</h2>
          <DonutSplit
            centerLabel="You repay"
            centerValue={formatMoney(paiseToRupees(result.totalPaymentPaise))}
            format={(x) => formatMoney(x)}
            slices={[
              { id: "principal", label: "Principal (what you borrowed)", value: paiseToRupees(rupeesToPaise(v.amount)), colorVar: "--series-1" },
              { id: "interest", label: "Interest (the cost)", value: paiseToRupees(result.totalInterestPaise), colorVar: "--series-6" },
            ]}
          />
        </Card>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Can you afford it?</h2>
            <Badge variant={foirBadge(result.foirPct)}>
              FOIR {result.foirPct.toFixed(0)}%
            </Badge>
          </div>
          <Gauge
            value={result.foirPct}
            min={0}
            max={80}
            valueText={`${result.foirPct.toFixed(0)}%`}
            markerLabel="of income goes to EMIs"
            caption="Debt-to-income (FOIR)"
            bands={[
              { upTo: 30, colorVar: "--status-good", label: "comfortable" },
              { upTo: 45, colorVar: "--status-warning", label: "stretched" },
              { upTo: 80, colorVar: "--status-critical", label: "risky" },
            ]}
          />
          <p className="mt-2 text-center text-sm text-ink-2">
            Banks usually want this under 40–50%.
          </p>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Would a bank approve this?</h2>
          <Badge variant={RISK_VARIANT[result.risk]}>
            {result.risk} risk · {result.approvalScore}/100
          </Badge>
        </div>
        <p className="mb-4 text-sm text-ink-2">
          An educational estimate — <strong>not any real bank&rsquo;s policy</strong>. Each factor is shown so you can see what helps and what hurts.
        </p>
        <ul className="flex flex-col divide-y divide-line">
          {result.approvalReasons.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-ink-2">{r.label}</span>
              <span className={`tabular-nums font-medium ${r.points >= 0 ? "text-status-good" : "text-danger"}`}>
                {r.points >= 0 ? "+" : ""}{r.points}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {whatIf && (
        <Card className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">What if you add 1 year of tenure?</span>
          <span className="text-ink-2">
            EMI drops <strong className="text-status-good">{formatMoney(paiseToRupees(whatIf.emiDrop))}/mo</strong>, but total interest rises{" "}
            <strong className="text-danger">{formatMoney(paiseToRupees(whatIf.interestRise))}</strong>. Lower monthly, more paid overall — the fundamental trade-off.
          </span>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-semibold">How each year is split</h2>
        <Tabs
          items={[
            {
              id: "chart",
              label: "Chart",
              content: (
                <StackedBars
                  height={260}
                  ariaLabel={`Amortization: early years are mostly interest, later years mostly principal, over ${years} years. Full data in the Table tab.`}
                  seriesLabels={[
                    { label: "Principal", colorVar: "--series-1" },
                    { label: "Interest", colorVar: "--series-6" },
                  ]}
                  bars={result.yearly.map((y) => ({
                    label: `Y${y.year}`,
                    segments: [
                      { value: y.principalPaise, colorVar: "--series-1" },
                      { value: y.interestPaise, colorVar: "--series-6" },
                    ],
                  }))}
                />
              ),
            },
            {
              id: "table",
              label: "Table",
              content: (
                <ChartTable
                  caption="Yearly principal and interest breakdown"
                  columns={[
                    { key: "year", label: "Year", format: (r) => String(r.year) },
                    { key: "principal", label: "Principal paid", align: "right", format: (r) => formatMoney(paiseToRupees(r.principalPaise)) },
                    { key: "interest", label: "Interest paid", align: "right", format: (r) => formatMoney(paiseToRupees(r.interestPaise)) },
                    { key: "balance", label: "Balance left", align: "right", format: (r) => formatMoney(paiseToRupees(r.balancePaise)) },
                  ]}
                  rows={result.yearly}
                />
              ),
            },
          ]}
        />
      </Card>

      <ExplainerPanel
        formula={[
          `r (monthly) = ${formatPercent(v.rate)} ÷ 12 = ${(v.rate / 12).toFixed(4)}% = ${(v.rate / 12 / 100).toFixed(6)}`,
          `EMI = P·r·(1+r)^n / ((1+r)^n − 1)`,
          `    = ${formatMoney(v.amount)} · r · (1+r)^${v.months} / ((1+r)^${v.months} − 1)`,
          `    = ${formatMoney(emiR)} per month`,
        ].join("\n")}
      >
        <p>
          Your EMI is fixed at <strong>{formatMoney(emiR)}</strong>, but its makeup shifts every month. Early on, most of it is <strong>interest</strong> on a big outstanding balance; only a sliver reduces what you owe.
        </p>
        <p>
          That is why over {years} years you repay <strong>{formatMoney(paiseToRupees(result.totalPaymentPaise))}</strong> on a <strong>{formatMoney(v.amount)}</strong> loan — the extra{" "}
          <strong>{formatMoney(paiseToRupees(result.totalInterestPaise))}</strong> is the price of borrowing.
        </p>
        <p>
          <strong>The common mistake:</strong> judging a loan by its EMI. A
          smaller EMI almost always means a longer tenure — the same ₹10 lakh
          at 10% costs about ₹3.9 lakh in interest over 7 years, but over ₹13
          lakh across 20 years. The monthly number is what lenders advertise;
          total interest is the one that bites. Drag the tenure slider above
          and watch both move in opposite directions.
        </p>
        <p>
          The approval estimate is a simplified, transparent heuristic for learning — real lenders use private models and far more data.
        </p>
      </ExplainerPanel>
    </SimulatorShell>
  );
}

function foirBadge(foir: number): "good" | "warning" | "critical" {
  if (foir <= 30) return "good";
  if (foir <= 45) return "warning";
  return "critical";
}

export default function LoansPage() {
  return (
    <Suspense fallback={<main className="p-10 text-ink-3">Loading…</main>}>
      <LoanSimulator />
    </Suspense>
  );
}
