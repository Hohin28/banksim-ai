"use client";

import {
  compareInstruments,
  INSTRUMENTS,
  paiseToRupees,
  rupeesToPaise,
} from "@banksim/finance-core";
import { LineAreaChart, type ChartSeries } from "@/components/charts/line-area-chart";
import { ExplainerPanel } from "@/components/simulator/explainer";
import { SimulatorShell } from "@/components/simulator/shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { formatMoney, formatPercent } from "@/lib/format";
import { parseParams, useUrlSync, type ParamSpec } from "@/lib/url-state";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const SPECS = {
  monthly: { kind: "int", def: 5000, min: 0, max: 100000 },
  lump: { kind: "int", def: 0, min: 0, max: 10000000 },
  years: { kind: "int", def: 15, min: 1, max: 40 },
  infl: { kind: "float", def: 6, min: 0, max: 12 },
} satisfies Record<string, ParamSpec>;

// Colors follow the entity: one distinct fixed slot per instrument id, so
// toggling the selection never repaints the survivors (docs/10 §6).
const SLOT: Record<string, string> = {
  savings: "--series-1", // blue
  fd: "--series-3", // yellow
  rd: "--series-4", // green
  bonds: "--series-5", // violet
  gold: "--series-8", // orange
  mutual: "--series-2", // aqua
  stocks: "--series-6", // red
};

const DEFAULT_SELECTED = ["fd", "gold", "mutual"];

const RISK_BADGE = {
  "very low": "good",
  low: "good",
  moderate: "warning",
  high: "serious",
  "very high": "critical",
} as const;

function InvestmentComparison() {
  const searchParams = useSearchParams();
  const [v, setV] = useState(() => parseParams(SPECS, searchParams));
  useUrlSync(SPECS, v);
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);

  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const monthlyPaise = rupeesToPaise(v.monthly);
  const lumpPaise = rupeesToPaise(v.lump);
  const valid = v.monthly > 0 || v.lump > 0;

  const projections = useMemo(() => {
    if (!valid || selected.length === 0) return [];
    return compareInstruments(selected, {
      monthlyPaise,
      lumpSumPaise: lumpPaise,
      years: v.years,
      inflationPct: v.infl,
    });
  }, [selected, monthlyPaise, lumpPaise, v.years, v.infl, valid]);

  const invested = lumpPaise + monthlyPaise * v.years * 12;

  const series: ChartSeries[] = projections.map((p) => ({
    id: p.instrument.id,
    label: p.instrument.name,
    shortLabel: p.instrument.name.split(" ")[0],
    colorVar: SLOT[p.instrument.id] ?? "--series-1",
    kind: "line",
    values: p.points.map((pt) => pt.expectedPaise),
  }));

  const xValues = projections[0]?.points.map((pt) => pt.year) ?? [0];

  return (
    <SimulatorShell
      title="Investment Comparison"
      intro="There's no single 'best' place for money — only best for a purpose. Compare how different instruments grow, and what you trade for that growth."
      announcement={
        projections.length
          ? `Comparing ${projections.length} instruments over ${v.years} years`
          : "Select at least one instrument"
      }
      controls={
        <>
          <Slider label="Monthly investment (SIP)" value={v.monthly} min={SPECS.monthly.min} max={SPECS.monthly.max} step={500} onChange={(x) => set("monthly", x)} formatValue={(x) => formatMoney(x)} valueText={(x) => `${formatMoney(x)} per month`} />
          <Slider label="One-time lump sum" value={v.lump} min={SPECS.lump.min} max={SPECS.lump.max} step={10000} onChange={(x) => set("lump", x)} formatValue={(x) => formatMoney(x)} valueText={(x) => `${formatMoney(x)} lump sum`} />
          <Slider label="Years" value={v.years} min={SPECS.years.min} max={SPECS.years.max} step={1} onChange={(x) => set("years", x)} formatValue={(x) => `${x} yrs`} valueText={(x) => `${x} years`} />
          <Slider label="Inflation" value={v.infl} min={SPECS.infl.min} max={SPECS.infl.max} step={0.5} onChange={(x) => set("infl", x)} formatValue={(x) => formatPercent(x)} valueText={(x) => `${formatPercent(x)} inflation`} unit="p.a." />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-ink-2">Instruments to compare</legend>
            {INSTRUMENTS.map((inst) => (
              <label key={inst.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(inst.id)}
                  onChange={() => toggle(inst.id)}
                  className="size-4 accent-[var(--brand)]"
                />
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-sm"
                  style={{ background: `var(${SLOT[inst.id]})` }}
                />
                {inst.name}
              </label>
            ))}
          </fieldset>
        </>
      }
    >
      {!valid ? (
        <Card>
          <p className="text-ink-2">Enter a monthly amount or a lump sum to compare instruments.</p>
        </Card>
      ) : (
        <>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Expected growth</h2>
              <span className="text-sm text-ink-3">You invest {formatMoney(paiseToRupees(invested))}</span>
            </div>
            <LineAreaChart
              xValues={xValues}
              series={series}
              ariaLabel={`Expected growth of ${projections.map((p) => p.instrument.name).join(", ")} over ${v.years} years. Full figures in the matrix below.`}
            />
            <p className="mt-3 text-xs text-ink-3">
              Lines use published long-run average returns — <strong>historical averages, not predictions</strong>. Market-linked instruments swing widely year to year.
            </p>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">The trade-offs</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-2">
                    <th className="px-3 py-2 font-medium">Instrument</th>
                    <th className="px-3 py-2 text-right font-medium">Avg return</th>
                    <th className="px-3 py-2 text-right font-medium">Final value</th>
                    <th className="px-3 py-2 text-right font-medium">Real value</th>
                    <th className="px-3 py-2 font-medium">Risk</th>
                    <th className="px-3 py-2 font-medium">Liquidity</th>
                    <th className="px-3 py-2 font-medium">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((p) => (
                    <tr key={p.instrument.id} className="border-b border-line/60 last:border-0">
                      <td className="px-3 py-2 font-medium">{p.instrument.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatPercent(p.instrument.avgReturnPct)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(paiseToRupees(p.expectedFinalPaise))}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(paiseToRupees(p.realFinalPaise))}
                        {!p.beatsInflation && <span className="ml-1 text-danger" title="Does not beat inflation">↓</span>}
                      </td>
                      <td className="px-3 py-2"><Badge variant={RISK_BADGE[p.instrument.risk]}>{p.instrument.risk}</Badge></td>
                      <td className="px-3 py-2 capitalize text-ink-2">{p.instrument.liquidity}</td>
                      <td className="px-3 py-2 text-ink-2">{p.instrument.taxNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <ExplainerPanel formula={`Final = lump·(1+r)^n  +  SIP·[((1+r)^n − 1)/r]·(1+r),   r = avg return ÷ 12`}>
            <p>
              Higher average returns come bundled with higher <strong>risk</strong> — the year-to-year swings you have to stomach. A fixed deposit never surprises you; stocks might double or halve.
            </p>
            <p>
              The <strong>real value</strong> column is the honest one: growth after {formatPercent(v.infl)} inflation. Anything with a ↓ is losing purchasing power despite looking positive.
            </p>
            <p>
              These are <strong>illustrative long-run averages</strong> for learning, not advice or live market data. Match the instrument to the goal: short horizons favour safety, long horizons can ride out volatility.
            </p>
          </ExplainerPanel>
        </>
      )}
    </SimulatorShell>
  );
}

export default function InvestmentsPage() {
  return (
    <Suspense fallback={<main className="p-10 text-ink-3">Loading…</main>}>
      <InvestmentComparison />
    </Suspense>
  );
}
