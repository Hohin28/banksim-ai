"use client";

import {
  paiseToRupees,
  projectSavings,
  rupeesToPaise,
  type CompoundingFrequency,
} from "@banksim/finance-core";
import { ChartTable } from "@/components/charts/chart-table";
import {
  LineAreaChart,
  type ChartSeries,
} from "@/components/charts/line-area-chart";
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
  // max = realistic typed-amount cap; sliders drag over a comfortable
  // sub-range (see SLIDER_MAX) and the paired input accepts up to max.
  init: { kind: "int", def: 10000, min: 0, max: 10_00_00_000 },
  monthly: { kind: "int", def: 5000, min: 0, max: 10_00_000 },
  rate: { kind: "float", def: 7, min: 0, max: 15 },
  years: { kind: "int", def: 10, min: 1, max: 40 },
  comp: {
    kind: "enum",
    def: "quarterly",
    options: ["yearly", "half-yearly", "quarterly", "monthly"],
  },
  infl: { kind: "float", def: 6, min: 0, max: 12 },
} satisfies Record<string, ParamSpec>;

const COMPOUNDING_OPTIONS = [
  { value: "yearly", label: "Yearly" },
  { value: "half-yearly", label: "Half-yearly" },
  { value: "quarterly", label: "Quarterly (most Indian banks)" },
  { value: "monthly", label: "Monthly" },
];

function SavingsSimulator() {
  const searchParams = useSearchParams();
  const [v, setV] = useState(() => parseParams(SPECS, searchParams));
  useUrlSync(SPECS, v);

  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const result = useMemo(
    () =>
      projectSavings({
        initialPaise: rupeesToPaise(v.init),
        monthlyPaise: rupeesToPaise(v.monthly),
        annualRatePct: v.rate,
        years: v.years,
        compounding: v.comp as CompoundingFrequency,
        inflationPct: v.infl,
      }),
    [v],
  );

  const initPaise = rupeesToPaise(v.init);
  const xValues = [0, ...result.yearly.map((r) => r.year)];
  const deposited = [initPaise, ...result.yearly.map((r) => r.depositedPaise)];
  const balance = [initPaise, ...result.yearly.map((r) => r.balancePaise)];
  const real = [initPaise, ...result.yearly.map((r) => r.realBalancePaise)];

  const series: ChartSeries[] = [
    {
      id: "deposits",
      label: "Your deposits",
      colorVar: "--series-1",
      kind: "area",
      values: deposited,
    },
    {
      id: "interest",
      label: "With interest",
      colorVar: "--series-2",
      kind: "band",
      lower: deposited,
      values: balance,
    },
  ];
  if (v.infl > 0) {
    series.push({
      id: "real",
      label: "Real value",
      colorVar: "--series-6",
      kind: "line",
      dashed: true,
      values: real,
    });
  }

  const months = v.years * 12;
  const iPct = (result.monthlyRate * 100).toFixed(4);
  const year1Interest = result.yearly[0]?.interestPaise ?? 0;
  const last = result.yearly[result.yearly.length - 1];
  const prev = result.yearly[result.yearly.length - 2];
  const lastYearInterest = last && prev ? last.interestPaise - prev.interestPaise : year1Interest;

  const finalStr = formatMoney(paiseToRupees(result.finalPaise));

  return (
    <SimulatorShell
      title="Savings Simulator"
      intro="What actually happens when money sits and grows? Change anything — the answer updates instantly."
      announcement={`Final amount ${finalStr} after ${v.years} years`}
      controls={
        <>
          <Slider
            label="Initial deposit"
            value={v.init}
            min={SPECS.init.min}
            max={10_00_000}
            inputMax={SPECS.init.max}
            step={1000}
            onChange={(x) => set("init", x)}
            formatValue={(x) => formatMoney(x)}
            valueText={(x) => `${formatMoney(x)} initial deposit`}
          />
          <Slider
            label="Monthly deposit"
            value={v.monthly}
            min={SPECS.monthly.min}
            max={1_00_000}
            inputMax={SPECS.monthly.max}
            step={500}
            onChange={(x) => set("monthly", x)}
            formatValue={(x) => formatMoney(x)}
            valueText={(x) => `${formatMoney(x)} per month`}
          />
          <Slider
            label="Interest rate"
            value={v.rate}
            min={SPECS.rate.min}
            max={SPECS.rate.max}
            step={0.25}
            onChange={(x) => set("rate", x)}
            formatValue={(x) => formatPercent(x)}
            valueText={(x) => `${formatPercent(x)} interest per year`}
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
          <Field
            label="Compounding frequency"
            help="How often the bank credits interest."
          >
            {(props) => (
              <SelectInput
                {...props}
                options={COMPOUNDING_OPTIONS}
                value={v.comp}
                onChange={(e) => set("comp", e.target.value)}
              />
            )}
          </Field>
          <Slider
            label="Inflation"
            value={v.infl}
            min={SPECS.infl.min}
            max={SPECS.infl.max}
            step={0.5}
            onChange={(x) => set("infl", x)}
            formatValue={(x) => formatPercent(x)}
            valueText={(x) => `${formatPercent(x)} inflation per year`}
            unit="p.a."
          />
        </>
      }
    >
      <TermStrip ids={["compound-interest", "inflation", "real-value", "principal"]} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Final amount"
          value={paiseToRupees(result.finalPaise)}
          format={(x) => formatMoney(x)}
          gold
        />
        <StatCard
          label="You deposited"
          value={paiseToRupees(result.depositedPaise)}
          format={(x) => formatMoney(x)}
        />
        <StatCard
          label="Interest earned"
          value={paiseToRupees(result.interestPaise)}
          format={(x) => formatMoney(x)}
          delta={{ text: `+${result.growthPct.toFixed(1)}%`, tone: "good" }}
        />
        <StatCard
          label={`Real value (${formatPercent(v.infl)} inflation)`}
          value={paiseToRupees(result.realFinalPaise)}
          format={(x) => formatMoney(x)}
          delta={
            v.infl > 0
              ? { text: "in today's ₹", tone: "neutral" }
              : { text: "= final amount", tone: "neutral" }
          }
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
                  series={series}
                  ariaLabel={`Savings growth: ${formatMoney(paiseToRupees(result.depositedPaise))} deposited grows to ${finalStr} over ${v.years} years. Full data in the Table tab.`}
                />
              ),
            },
            {
              id: "table",
              label: "Table",
              content: (
                <ChartTable
                  caption={`Year-by-year savings growth over ${v.years} years`}
                  columns={[
                    { key: "year", label: "Year", format: (r) => String(r.year) },
                    {
                      key: "deposited",
                      label: "Deposited",
                      align: "right",
                      format: (r) => formatMoney(paiseToRupees(r.depositedPaise)),
                    },
                    {
                      key: "interest",
                      label: "Interest",
                      align: "right",
                      format: (r) => formatMoney(paiseToRupees(r.interestPaise)),
                    },
                    {
                      key: "balance",
                      label: "Balance",
                      align: "right",
                      format: (r) => formatMoney(paiseToRupees(r.balancePaise)),
                    },
                    {
                      key: "real",
                      label: "Real value",
                      align: "right",
                      format: (r) => formatMoney(paiseToRupees(r.realBalancePaise)),
                    },
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
          `i (monthly rate) = (1 + ${formatPercent(v.rate)}/${
            { yearly: 1, "half-yearly": 2, quarterly: 4, monthly: 12 }[
              v.comp as CompoundingFrequency
            ]
          })^(n/12) − 1 = ${iPct}% per month`,
          `FV = ${formatMoney(v.init)}·(1+i)^${months} + ${formatMoney(v.monthly)}·[((1+i)^${months} − 1) / i]`,
          `   = ${finalStr}`,
        ].join("\n")}
      >
        <p>
          Every month your balance earns <strong>{iPct}%</strong>, and then
          your <strong>{formatMoney(v.monthly)}</strong> deposit lands. That
          order matters: new deposits start earning from the next month.
        </p>
        <p>
          In year 1 you earned{" "}
          <strong>{formatMoney(paiseToRupees(year1Interest))}</strong> in
          interest. In year {v.years} alone you earned{" "}
          <strong>{formatMoney(paiseToRupees(lastYearInterest))}</strong> —
          the difference is interest earning interest. That is compounding,
          and it is why the green band widens as time passes.
        </p>
        {v.infl > 0 && (
          <p>
            The dashed line is the honesty check: at{" "}
            <strong>{formatPercent(v.infl)}</strong> inflation, your final{" "}
            <strong>{finalStr}</strong> buys what{" "}
            <strong>{formatMoney(paiseToRupees(result.realFinalPaise))}</strong>{" "}
            buys today. Growth below inflation is losing quietly.
          </p>
        )}
        <p>
          Banks vary in how they credit interest — this simulator uses the
          standard nominal-rate formula with your chosen compounding
          frequency.
        </p>
      </ExplainerPanel>
    </SimulatorShell>
  );
}

export default function SavingsPage() {
  return (
    <Suspense fallback={<main className="flex-1 p-10 text-ink-3">Loading simulator…</main>}>
      <SavingsSimulator />
    </Suspense>
  );
}
