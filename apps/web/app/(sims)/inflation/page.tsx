"use client";

import {
  futurePricePaise,
  inflationSeries,
  paiseToRupees,
  purchasingPowerPaise,
  rupeesToPaise,
} from "@banksim/finance-core";
import { ChartTable } from "@/components/charts/chart-table";
import { LineAreaChart } from "@/components/charts/line-area-chart";
import { ExplainerPanel } from "@/components/simulator/explainer";
import { SimulatorShell } from "@/components/simulator/shell";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs } from "@/components/ui/tabs";
import { TermStrip } from "@/components/ui/term";
import { formatMoney, formatPercent } from "@/lib/format";
import { parseParams, useUrlSync, type ParamSpec } from "@/lib/url-state";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const SPECS = {
  // max = realistic typed cap; the slider drags a comfortable sub-range.
  amount: { kind: "int", def: 1000, min: 100, max: 10_00_00_000 },
  infl: { kind: "float", def: 6, min: 0, max: 15 },
  years: { kind: "int", def: 20, min: 5, max: 40 },
} satisfies Record<string, ParamSpec>;

/** Everyday anchors that make abstract percentages feel real. */
const ANCHORS = [
  { label: "Samosa", rupees: 15 },
  { label: "Movie ticket", rupees: 300 },
  { label: "Monthly groceries", rupees: 6000 },
];

function InflationSimulator() {
  const searchParams = useSearchParams();
  const [v, setV] = useState(() => parseParams(SPECS, searchParams));
  useUrlSync(SPECS, v);

  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const amountPaise = rupeesToPaise(v.amount);
  const rows = useMemo(
    () => inflationSeries(amountPaise, v.infl, v.years),
    [amountPaise, v.infl, v.years],
  );

  const powerEnd = purchasingPowerPaise(amountPaise, v.infl, v.years);
  const priceEnd = futurePricePaise(amountPaise, v.infl, v.years);
  const powerStr = formatMoney(paiseToRupees(powerEnd));

  return (
    <SimulatorShell
      title="Inflation Simulator"
      intro="Money standing still is quietly shrinking. See what your rupees will really buy — and what today's prices will become."
      announcement={`After ${v.years} years at ${formatPercent(v.infl)} inflation, ${formatMoney(v.amount)} buys only ${powerStr} worth`}
      controls={
        <>
          <Slider
            label="Amount today"
            value={v.amount}
            min={SPECS.amount.min}
            max={10_00_000}
            inputMax={SPECS.amount.max}
            step={100}
            onChange={(x) => set("amount", x)}
            formatValue={(x) => formatMoney(x)}
            valueText={(x) => `${formatMoney(x)} today`}
          />
          <Slider
            label="Inflation rate"
            value={v.infl}
            min={SPECS.infl.min}
            max={SPECS.infl.max}
            step={0.5}
            onChange={(x) => set("infl", x)}
            formatValue={(x) => formatPercent(x)}
            valueText={(x) => `${formatPercent(x)} inflation per year`}
            unit="p.a."
          />
          <Slider
            label="Horizon"
            value={v.years}
            min={SPECS.years.min}
            max={SPECS.years.max}
            step={1}
            onChange={(x) => set("years", x)}
            formatValue={(x) => `${x} yrs`}
            valueText={(x) => `${x} years from now`}
          />
        </>
      }
    >
      <TermStrip ids={["inflation", "real-value"]} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={`What ${formatMoney(v.amount)} will buy in ${v.years}y`}
          value={paiseToRupees(powerEnd)}
          format={(x) => formatMoney(x)}
          delta={{
            text: `−${(100 - (powerEnd / amountPaise) * 100).toFixed(0)}% power`,
            tone: "bad",
          }}
        />
        <StatCard
          label={`Today's ${formatMoney(v.amount)} basket will cost`}
          value={paiseToRupees(priceEnd)}
          format={(x) => formatMoney(x)}
        />
        <StatCard
          label="Needed to match today's power"
          value={paiseToRupees(priceEnd)}
          format={(x) => formatMoney(x)}
          gold
        />
      </div>

      <Card>
        <Tabs
          items={[
            {
              id: "chart",
              label: "Chart",
              content: (
                <LineAreaChart
                  xValues={rows.map((r) => r.year)}
                  series={[
                    {
                      id: "price",
                      label: "Cost of the same basket",
                      shortLabel: "Basket cost",
                      colorVar: "--series-6",
                      kind: "line",
                      values: rows.map((r) => r.pricePaise),
                    },
                    {
                      id: "power",
                      label: "What your money buys",
                      shortLabel: "Buying power",
                      colorVar: "--series-1",
                      kind: "area",
                      values: rows.map((r) => r.powerPaise),
                    },
                  ]}
                  ariaLabel={`Inflation at ${formatPercent(v.infl)}: over ${v.years} years, ${formatMoney(v.amount)} falls to ${powerStr} of buying power while the same basket rises to ${formatMoney(paiseToRupees(priceEnd))}. Full data in the Table tab.`}
                />
              ),
            },
            {
              id: "table",
              label: "Table",
              content: (
                <ChartTable
                  caption={`Purchasing power and prices year by year at ${formatPercent(v.infl)} inflation`}
                  columns={[
                    { key: "year", label: "Year", format: (r) => String(r.year) },
                    {
                      key: "power",
                      label: "Buying power",
                      align: "right",
                      format: (r) => formatMoney(paiseToRupees(r.powerPaise)),
                    },
                    {
                      key: "price",
                      label: "Basket cost",
                      align: "right",
                      format: (r) => formatMoney(paiseToRupees(r.pricePaise)),
                    },
                  ]}
                  rows={rows}
                />
              ),
            },
          ]}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">The everyday index</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ANCHORS.map((a) => (
            <div
              key={a.label}
              className="rounded-field border border-line bg-page px-4 py-3"
            >
              <div className="text-sm text-ink-2">{a.label}</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {formatMoney(a.rupees)}{" "}
                <span aria-hidden="true" className="text-ink-3">→</span>{" "}
                <span className="text-danger">
                  {formatMoney(
                    paiseToRupees(
                      futurePricePaise(rupeesToPaise(a.rupees), v.infl, v.years),
                    ),
                  )}
                </span>
              </div>
              <div className="text-xs text-ink-3">in {v.years} years</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-ink-2">
          Beat it or lose to it:{" "}
          <Link
            href={`/savings?infl=${v.infl}`}
            className="font-medium text-brand-strong underline-offset-2 hover:underline dark:text-brand"
          >
            see whether your savings outgrow {formatPercent(v.infl)} inflation →
          </Link>
        </p>
      </Card>

      <ExplainerPanel
        formula={[
          `Buying power = ${formatMoney(v.amount)} ÷ (1 + ${v.infl / 100})^${v.years} = ${powerStr}`,
          `Future price = ${formatMoney(v.amount)} × (1 + ${v.infl / 100})^${v.years} = ${formatMoney(paiseToRupees(priceEnd))}`,
        ].join("\n")}
      >
        <p>
          Inflation means the <strong>same goods cost more each year</strong>.
          If prices rise {formatPercent(v.infl)} annually, a{" "}
          {formatMoney(v.amount)} note doesn&rsquo;t change — but the pile of
          things it can buy shrinks to{" "}
          <strong>{powerStr}</strong> worth in {v.years} years.
        </p>
        <p>
          This is why &ldquo;keeping money safe&rdquo; in a drawer is actually
          a guaranteed loss, and why any return below inflation is losing
          quietly.
        </p>
        <p>
          <strong>The common mistake:</strong> &ldquo;my salary raise matched
          inflation, so I&rsquo;m fine.&rdquo; Education and healthcare
          routinely inflate faster than the headline average — often 8–10%
          while the general rate is 6%. A raise matching the average still
          means falling behind on the things that matter most.
        </p>
        <p>
          Real inflation varies year to year (India&rsquo;s CPI has ranged
          roughly 2–12% over recent decades) — this simulator holds it
          constant to make the mechanism visible.
        </p>
      </ExplainerPanel>
    </SimulatorShell>
  );
}

export default function InflationPage() {
  return (
    <Suspense fallback={<main className="flex-1 p-10 text-ink-3">Loading simulator…</main>}>
      <InflationSimulator />
    </Suspense>
  );
}
