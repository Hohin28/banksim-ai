/**
 * Investment Comparison engine (F6, docs/02).
 *
 * Every figure is a published long-run average, clearly labeled as
 * historical — NOT a prediction (docs/02 F6). Market-linked instruments
 * carry a volatility so the UI can draw an honest ±band instead of a single
 * deceptive line. Returns are illustrative educational defaults.
 */

import { assertPaise, roundPaise, type Paise } from "./money";
import { assertRate, assertYears } from "./rates";

export type RiskLevel = "very low" | "low" | "moderate" | "high" | "very high";
export type Liquidity = "low" | "medium" | "high";

export interface Instrument {
  id: string;
  name: string;
  /** Illustrative long-run average annual return, percent. */
  avgReturnPct: number;
  /** Annualized volatility (std dev), percent. 0 for fixed-return products. */
  volatilityPct: number;
  risk: RiskLevel;
  liquidity: Liquidity;
  /** Short, plain-language tax note (indicative only). */
  taxNote: string;
}

/** Educational defaults for the Indian context (docs/02 F6). */
export const INSTRUMENTS: readonly Instrument[] = [
  { id: "savings", name: "Savings account", avgReturnPct: 3.5, volatilityPct: 0, risk: "very low", liquidity: "high", taxNote: "Interest taxed as income" },
  { id: "fd", name: "Fixed deposit", avgReturnPct: 6.5, volatilityPct: 0, risk: "very low", liquidity: "low", taxNote: "Interest taxed as income" },
  { id: "rd", name: "Recurring deposit", avgReturnPct: 6.0, volatilityPct: 0, risk: "very low", liquidity: "low", taxNote: "Interest taxed as income" },
  { id: "bonds", name: "Government bonds", avgReturnPct: 7.0, volatilityPct: 2, risk: "low", liquidity: "medium", taxNote: "Interest taxed as income" },
  { id: "gold", name: "Gold", avgReturnPct: 8.0, volatilityPct: 15, risk: "moderate", liquidity: "high", taxNote: "LTCG after 2 years" },
  { id: "mutual", name: "Index mutual fund (SIP)", avgReturnPct: 12.0, volatilityPct: 18, risk: "high", liquidity: "medium", taxNote: "LTCG above ₹1L/yr" },
  { id: "stocks", name: "Stocks", avgReturnPct: 14.0, volatilityPct: 28, risk: "very high", liquidity: "high", taxNote: "LTCG above ₹1L/yr" },
] as const;

export interface ProjectionPoint {
  year: number;
  expectedPaise: Paise;
  /** Optimistic band: avg + 1σ compounded. */
  highPaise: Paise;
  /** Pessimistic band: avg − 1σ compounded (never below 0). */
  lowPaise: Paise;
}

export interface InstrumentProjection {
  instrument: Instrument;
  points: ProjectionPoint[];
  expectedFinalPaise: Paise;
  /** Real (inflation-adjusted) final value. */
  realFinalPaise: Paise;
  investedPaise: Paise;
  /** True when the average return beats inflation. */
  beatsInflation: boolean;
}

export interface InvestmentInputs {
  /** Monthly SIP contribution. Use 0 for a pure lump sum. */
  monthlyPaise: Paise;
  /** One-time lump sum at the start. */
  lumpSumPaise: Paise;
  years: number;
  inflationPct: number;
}

/** Future value of a lump sum + monthly SIP at a given annual rate. */
function futureValuePaise(
  lumpSumPaise: Paise,
  monthlyPaise: Paise,
  annualPct: number,
  years: number,
): Paise {
  const r = annualPct / 12 / 100;
  const n = years * 12;
  const lump = lumpSumPaise * Math.pow(1 + r, n);
  const sip =
    r === 0
      ? monthlyPaise * n
      : monthlyPaise * ((Math.pow(1 + r, n) - 1) / r) * (1 + r); // annuity-due (start of month)
  return roundPaise(lump + sip);
}

export function projectInstrument(
  instrument: Instrument,
  inputs: InvestmentInputs,
): InstrumentProjection {
  const { monthlyPaise, lumpSumPaise, years, inflationPct } = inputs;
  const points: ProjectionPoint[] = [];
  const hi = instrument.avgReturnPct + instrument.volatilityPct;
  const lo = instrument.avgReturnPct - instrument.volatilityPct;

  for (let y = 0; y <= years; y++) {
    points.push({
      year: y,
      expectedPaise: futureValuePaise(lumpSumPaise, monthlyPaise, instrument.avgReturnPct, y),
      highPaise: futureValuePaise(lumpSumPaise, monthlyPaise, hi, y),
      lowPaise: Math.max(0, futureValuePaise(lumpSumPaise, monthlyPaise, lo, y)),
    });
  }

  const expectedFinalPaise = points[years]!.expectedPaise;
  const investedPaise = lumpSumPaise + monthlyPaise * years * 12;
  const realFinalPaise = roundPaise(
    expectedFinalPaise / Math.pow(1 + inflationPct / 100, years),
  );

  return {
    instrument,
    points,
    expectedFinalPaise,
    realFinalPaise,
    investedPaise,
    beatsInflation: instrument.avgReturnPct > inflationPct,
  };
}

export function compareInstruments(
  ids: string[],
  inputs: InvestmentInputs,
): InstrumentProjection[] {
  assertPaise(inputs.monthlyPaise, "monthlyPaise");
  assertPaise(inputs.lumpSumPaise, "lumpSumPaise");
  if (inputs.monthlyPaise < 0 || inputs.lumpSumPaise < 0) {
    throw new RangeError("contributions must not be negative");
  }
  if (inputs.monthlyPaise === 0 && inputs.lumpSumPaise === 0) {
    throw new RangeError("provide a monthly amount or a lump sum");
  }
  assertYears(inputs.years, 40);
  if (inputs.years < 1) throw new RangeError("years must be at least 1");
  assertRate(inputs.inflationPct, 30, "inflationPct");

  return ids.map((id) => {
    const instrument = INSTRUMENTS.find((i) => i.id === id);
    if (!instrument) throw new RangeError(`unknown instrument: ${id}`);
    return projectInstrument(instrument, inputs);
  });
}
