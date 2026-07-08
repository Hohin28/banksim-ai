"use client";

import {
  paiseToRupees,
  projectSavings,
  rupeesToPaise,
} from "@banksim/finance-core";
import { LineAreaChart } from "@/components/charts/line-area-chart";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { formatMoney } from "@/lib/format";
import Link from "next/link";
import { useMemo, useState } from "react";

const RATE = 7;

/**
 * The landing hero's live taste of the product (docs/04 W1): two sliders,
 * instant chart, and a deep link that carries the state into the full
 * simulator.
 */
export function MiniSavingsSim() {
  const [monthly, setMonthly] = useState(1000);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () =>
      projectSavings({
        initialPaise: 0,
        monthlyPaise: rupeesToPaise(monthly),
        annualRatePct: RATE,
        years,
        compounding: "quarterly",
        inflationPct: 0,
      }),
    [monthly, years],
  );

  const xValues = [0, ...result.yearly.map((r) => r.year)];
  const deposited = [0, ...result.yearly.map((r) => r.depositedPaise)];
  const balance = [0, ...result.yearly.map((r) => r.balancePaise)];

  return (
    <Card className="flex w-full flex-col gap-5 shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink-2">
          Try it — save monthly at {RATE}%
        </span>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-strong dark:text-brand">
          live
        </span>
      </div>

      <Slider
        label="Monthly saving"
        value={monthly}
        min={500}
        max={20000}
        step={500}
        onChange={setMonthly}
        formatValue={(v) => formatMoney(v)}
        valueText={(v) => `${formatMoney(v)} per month`}
      />
      <Slider
        label="Years"
        value={years}
        min={1}
        max={30}
        step={1}
        onChange={setYears}
        formatValue={(v) => `${v} yrs`}
        valueText={(v) => `${v} years`}
      />

      <LineAreaChart
        compact
        height={180}
        xValues={xValues}
        series={[
          {
            id: "deposits",
            label: "Deposits",
            colorVar: "--series-1",
            kind: "area",
            values: deposited,
          },
          {
            id: "balance",
            label: "With interest",
            colorVar: "--series-2",
            kind: "band",
            lower: deposited,
            values: balance,
          },
        ]}
        ariaLabel={`Saving ${formatMoney(monthly)} monthly at ${RATE}% grows to ${formatMoney(paiseToRupees(result.finalPaise))} in ${years} years.`}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-ink-2">
            You&rsquo;d have
          </div>
          <div className="font-display text-3xl font-semibold tabular-nums text-gold">
            {formatMoney(paiseToRupees(result.finalPaise))}
          </div>
          <div className="text-xs text-ink-3">
            {formatMoney(paiseToRupees(result.depositedPaise))} deposited +{" "}
            {formatMoney(paiseToRupees(result.interestPaise))} interest
          </div>
        </div>
        <Link
          href={`/savings?monthly=${monthly}&years=${years}&rate=${RATE}&init=0`}
          className="rounded-field bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
        >
          Open the full simulator →
        </Link>
      </div>
    </Card>
  );
}
