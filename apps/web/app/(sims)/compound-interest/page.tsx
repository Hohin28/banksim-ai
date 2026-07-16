"use client";

import {
  compareGrowth,
  paiseToRupees,
  rupeesToPaise,
  type CompoundingFrequency,
} from "@banksim/finance-core";
import { ChartTable } from "@/components/charts/chart-table";
import { LineAreaChart } from "@/components/charts/line-area-chart";
import { ExplainerPanel } from "@/components/simulator/explainer";
import { SimulatorShell } from "@/components/simulator/shell";
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
  // max = realistic typed cap; the slider drags a comfortable sub-range.
  principal: { kind: "int", def: 10000, min: 100, max: 10_00_00_000 },
  rate: { kind: "float", def: 8, min: 0, max: 15 },
  years: { kind: "int", def: 10, min: 1, max: 40 },
  comp: {
    kind: "enum",
    def: "yearly",
    options: ["yearly", "half-yearly", "quarterly", "monthly"],
  },
} satisfies Record<string, ParamSpec>;

const COMPOUNDING_OPTIONS = [
  { value: "yearly", label: "Yearly" },
  { value: "half-yearly", label: "Half-yearly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "monthly", label: "Monthly" },
];

const PERIODS: Record<string, number> = {
  yearly: 1,
  "half-yearly": 2,
  quarterly: 4,
  monthly: 12,
};

function CompoundVisualizer() {
  const searchParams = useSearchParams();
  const [v, setV] = useState(() => parseParams(SPECS, searchParams));
  useUrlSync(SPECS, v);

  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(
    () =>
      compareGrowth({
        principalPaise: rupeesToPaise(v.principal),
        annualRatePct: v.rate,
        years: v.years,
        compounding: v.comp as CompoundingFrequency,
      }),
    [v],
  );

  const xValues = result.yearly.map((r) => r.year);
  const gapStr = formatMoney(paiseToRupees(result.gapPaise));

  return (
    <SimulatorShell
      title="Compound Interest Visualizer"
      intro="Simple interest pays you on your deposit. Compound interest also pays you on the interest itself — watch the gap open."
      announcement={`Compound gives ${formatMoney(paiseToRupees(result.finalCompoundPaise))}, simple gives ${formatMoney(paiseToRupees(result.finalSimplePaise))}`}
      controls={
        <>
          <Slider
            label="Deposit (one time)"
            value={v.principal}
            min={SPECS.principal.min}
            max={10_00_000}
            inputMax={SPECS.principal.max}
            step={1000}
            onChange={(x) => set("principal", x)}
            formatValue={(x) => formatMoney(x)}
            valueText={(x) => `${formatMoney(x)} deposit`}
          />
          <Slider
            label="Interest rate"
            value={v.rate}
            min={SPECS.rate.min}
            max={SPECS.rate.max}
            step={0.25}
            onChange={(x) => set("rate", x)}
            formatValue={(x) => formatPercent(x)}
            valueText={(x) => `${formatPercent(x)} per year`}
            unit="p.a."
          />
          <Slider
            label="Years"
            value={v.years}
            min={SPECS.years.min}
            max={SPECS.years.max}
            step={1}
            onChange={(x) => set("years", x)}
            formatValue={(x) => `${x} yrs`}
            valueText={(x) => `${x} years`}
          />
          <Field label="Compounding frequency">
            {(props) => (
              <SelectInput
                {...props}
                options={COMPOUNDING_OPTIONS}
                value={v.comp}
                onChange={(e) => set("comp", e.target.value)}
              />
            )}
          </Field>
        </>
      }
    >
      <TermStrip ids={["compound-interest", "rule-of-72", "principal"]} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="With compound interest"
          value={paiseToRupees(result.finalCompoundPaise)}
          format={(x) => formatMoney(x)}
          gold
        />
        <StatCard
          label="With simple interest"
          value={paiseToRupees(result.finalSimplePaise)}
          format={(x) => formatMoney(x)}
        />
        <StatCard
          label="Interest earned by interest"
          value={paiseToRupees(result.gapPaise)}
          format={(x) => formatMoney(x)}
          delta={{ text: "the compounding bonus", tone: "good" }}
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
                  xValues={xValues}
                  series={[
                    {
                      id: "simple",
                      label: "Simple interest",
                      shortLabel: "Simple",
                      colorVar: "--series-1",
                      kind: "line",
                      values: result.yearly.map((r) => r.simplePaise),
                    },
                    {
                      id: "compound",
                      label: "Compound interest",
                      shortLabel: "Compound",
                      colorVar: "--series-2",
                      kind: "band",
                      lower: result.yearly.map((r) => r.simplePaise),
                      values: result.yearly.map((r) => r.compoundPaise),
                    },
                  ]}
                  ariaLabel={`Compound vs simple interest on ${formatMoney(v.principal)} at ${formatPercent(v.rate)}: after ${v.years} years compound gives ${formatMoney(paiseToRupees(result.finalCompoundPaise))}, simple gives ${formatMoney(paiseToRupees(result.finalSimplePaise))}. Full data in the Table tab.`}
                />
              ),
            },
            {
              id: "table",
              label: "Table",
              content: (
                <ChartTable
                  caption="Simple vs compound interest year by year"
                  columns={[
                    { key: "year", label: "Year", format: (r) => String(r.year) },
                    {
                      key: "simple",
                      label: "Simple",
                      align: "right",
                      format: (r) => formatMoney(paiseToRupees(r.simplePaise)),
                    },
                    {
                      key: "compound",
                      label: "Compound",
                      align: "right",
                      format: (r) => formatMoney(paiseToRupees(r.compoundPaise)),
                    },
                    {
                      key: "gap",
                      label: "Gap",
                      align: "right",
                      format: (r) => formatMoney(paiseToRupees(r.gapPaise)),
                    },
                  ]}
                  rows={result.yearly}
                />
              ),
            },
          ]}
        />
      </Card>

      {v.rate > 0 && (
        <Card className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-lg font-semibold">
            Rule of 72:
          </span>
          <span className="text-ink-2">
            at {formatPercent(v.rate)}, money doubles in about{" "}
            <strong className="text-ink-1 tabular-nums">
              72 ÷ {v.rate} = {(result.doublingYearsRule72).toFixed(1)} years
            </strong>{" "}
            (exact: {result.doublingYearsExact.toFixed(2)} years). Check the
            chart — the green curve really does double on schedule.
          </span>
        </Card>
      )}

      <ExplainerPanel
        formula={[
          `Simple:    A = P·(1 + r·t) = ${formatMoney(v.principal)}·(1 + ${v.rate / 100}·${v.years}) = ${formatMoney(paiseToRupees(result.finalSimplePaise))}`,
          `Compound:  A = P·(1 + r/n)^(n·t) = ${formatMoney(v.principal)}·(1 + ${v.rate / 100}/${PERIODS[v.comp]})^${PERIODS[v.comp] * v.years} = ${formatMoney(paiseToRupees(result.finalCompoundPaise))}`,
        ].join("\n")}
      >
        <p>
          Simple interest is a straight line: the bank pays{" "}
          <strong>{formatPercent(v.rate)}</strong> of your original{" "}
          <strong>{formatMoney(v.principal)}</strong> every year, forever the
          same amount.
        </p>
        <p>
          Compound interest curves upward because each year&rsquo;s interest
          joins the principal and starts earning too. Over {v.years} years
          that snowball is worth <strong>{gapStr}</strong> extra — money you
          did nothing for.
        </p>
        <p>
          <strong>The common mistake:</strong> chasing compounding
          <em> frequency</em>. Monthly vs yearly compounding is worth a rounding
          error next to time and rate — people hunt for a monthly-compounding
          account while ignoring that a 2% better rate, or five more years,
          would dwarf the difference.
        </p>
      </ExplainerPanel>
    </SimulatorShell>
  );
}

export default function CompoundInterestPage() {
  return (
    <Suspense fallback={<main className="flex-1 p-10 text-ink-3">Loading simulator…</main>}>
      <CompoundVisualizer />
    </Suspense>
  );
}
