"use client";

import {
  compareGrowth,
  monthlyEmiPaise,
  paiseToRupees,
  projectSavings,
  purchasingPowerPaise,
  rupeesToPaise,
} from "@banksim/finance-core";
import { LineAreaChart } from "@/components/charts/line-area-chart";
import { Slider } from "@/components/ui/slider";
import { formatMoney, formatPercent } from "@/lib/format";
import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * Small, self-contained interactive demos embedded inside lessons
 * (docs/02 F11: each lesson embeds a live mini-simulator). Each is a tiny
 * slice of a full simulator, sharing finance-core so numbers always agree.
 */

function DemoFrame({
  children,
  fullHref,
  fullLabel,
}: {
  children: React.ReactNode;
  fullHref: string;
  fullLabel: string;
}) {
  return (
    <div className="my-6 rounded-panel border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-strong dark:text-brand">
          try it
        </span>
        <Link
          href={fullHref}
          className="text-xs font-medium text-ink-2 underline-offset-2 hover:text-brand hover:underline"
        >
          {fullLabel} →
        </Link>
      </div>
      {children}
    </div>
  );
}

export function SavingsDemo() {
  const [monthly, setMonthly] = useState(2000);
  const [years, setYears] = useState(10);
  const r = useMemo(
    () =>
      projectSavings({
        initialPaise: 0,
        monthlyPaise: rupeesToPaise(monthly),
        annualRatePct: 7,
        years,
        compounding: "quarterly",
        inflationPct: 0,
      }),
    [monthly, years],
  );
  const deposited = [0, ...r.yearly.map((y) => y.depositedPaise)];
  const balance = [0, ...r.yearly.map((y) => y.balancePaise)];
  return (
    <DemoFrame fullHref="/savings" fullLabel="Open the full Savings Simulator">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider label="Save per month" value={monthly} min={500} max={10000} step={500} onChange={setMonthly} formatValue={(v) => formatMoney(v)} />
          <Slider label="Years" value={years} min={1} max={30} step={1} onChange={setYears} formatValue={(v) => `${v} yrs`} />
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-2">After {years} years at 7%</div>
            <div className="font-display text-2xl font-semibold text-gold tabular-nums">{formatMoney(paiseToRupees(r.finalPaise))}</div>
            <div className="text-xs text-ink-3">{formatMoney(paiseToRupees(r.interestPaise))} of it is interest</div>
          </div>
        </div>
        <LineAreaChart compact height={160} xValues={[0, ...r.yearly.map((y) => y.year)]}
          series={[
            { id: "d", label: "Deposits", colorVar: "--series-1", kind: "area", values: deposited },
            { id: "b", label: "With interest", colorVar: "--series-2", kind: "band", lower: deposited, values: balance },
          ]}
          ariaLabel={`Saving ${formatMoney(monthly)} monthly at 7% grows to ${formatMoney(paiseToRupees(r.finalPaise))} in ${years} years`} />
      </div>
    </DemoFrame>
  );
}

export function CompoundDemo() {
  const [rate, setRate] = useState(8);
  const r = useMemo(
    () => compareGrowth({ principalPaise: rupeesToPaise(10000), annualRatePct: rate, years: 20, compounding: "yearly" }),
    [rate],
  );
  return (
    <DemoFrame fullHref="/compound-interest" fullLabel="Open the Compound Visualizer">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider label="Interest rate" value={rate} min={2} max={15} step={0.5} onChange={setRate} formatValue={(v) => formatPercent(v)} unit="p.a." />
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-2">₹10,000 after 20 years</div>
            <div className="font-display text-2xl font-semibold text-gold tabular-nums">{formatMoney(paiseToRupees(r.finalCompoundPaise))}</div>
            <div className="text-xs text-ink-3">simple interest would give only {formatMoney(paiseToRupees(r.finalSimplePaise))}</div>
          </div>
        </div>
        <LineAreaChart compact height={160} xValues={r.yearly.map((y) => y.year)}
          series={[
            { id: "s", label: "Simple", shortLabel: "Simple", colorVar: "--series-1", kind: "line", values: r.yearly.map((y) => y.simplePaise) },
            { id: "c", label: "Compound", shortLabel: "Compound", colorVar: "--series-2", kind: "band", lower: r.yearly.map((y) => y.simplePaise), values: r.yearly.map((y) => y.compoundPaise) },
          ]}
          ariaLabel={`At ${formatPercent(rate)}, compound interest turns ₹10,000 into ${formatMoney(paiseToRupees(r.finalCompoundPaise))} over 20 years vs ${formatMoney(paiseToRupees(r.finalSimplePaise))} simple`} />
      </div>
    </DemoFrame>
  );
}

export function EmiDemo() {
  const [amount, setAmount] = useState(500000);
  const [months, setMonths] = useState(60);
  const emi = useMemo(() => monthlyEmiPaise(rupeesToPaise(amount), 10, months), [amount, months]);
  const total = emi * months;
  const interest = total - rupeesToPaise(amount);
  return (
    <DemoFrame fullHref="/loans" fullLabel="Open the full Loan Simulator">
      <div className="flex flex-col gap-4">
        <Slider label="Loan amount" value={amount} min={100000} max={2000000} step={50000} onChange={setAmount} formatValue={(v) => formatMoney(v)} />
        <Slider label="Tenure" value={months} min={12} max={240} step={12} onChange={setMonths} formatValue={(v) => `${v / 12} yrs`} />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-2">EMI</div>
            <div className="font-display text-xl font-semibold text-gold tabular-nums">{formatMoney(paiseToRupees(emi))}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-2">Total interest</div>
            <div className="font-display text-xl font-semibold tabular-nums">{formatMoney(paiseToRupees(interest))}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-2">You repay</div>
            <div className="font-display text-xl font-semibold tabular-nums">{formatMoney(paiseToRupees(total))}</div>
          </div>
        </div>
        <p className="text-sm text-ink-2">At 10% p.a., you repay {formatMoney(paiseToRupees(interest))} extra — that&rsquo;s the price of borrowing {formatMoney(amount)}.</p>
      </div>
    </DemoFrame>
  );
}

export function InflationDemo() {
  const [rate, setRate] = useState(6);
  const power = useMemo(() => purchasingPowerPaise(rupeesToPaise(1000), rate, 20), [rate]);
  return (
    <DemoFrame fullHref="/inflation" fullLabel="Open the Inflation Simulator">
      <div className="flex flex-col gap-4">
        <Slider label="Inflation rate" value={rate} min={2} max={12} step={0.5} onChange={setRate} formatValue={(v) => formatPercent(v)} unit="p.a." />
        <p className="text-lg">
          At {formatPercent(rate)} inflation, <strong>₹1,000</strong> today will buy only{" "}
          <strong className="text-danger">{formatMoney(paiseToRupees(power))}</strong> worth of things in 20 years.
        </p>
      </div>
    </DemoFrame>
  );
}

export const DEMOS = {
  savings: SavingsDemo,
  compound: CompoundDemo,
  emi: EmiDemo,
  inflation: InflationDemo,
} as const;

export type DemoKey = keyof typeof DEMOS;
