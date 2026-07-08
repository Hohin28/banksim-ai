/**
 * Compound Interest Visualizer engine (F2, docs/02): the same lump sum under
 * simple vs compound interest, year by year, plus doubling-time helpers.
 */

import { assertPaise, roundPaise, type Paise } from "./money";
import {
  assertRate,
  assertYears,
  PERIODS_PER_YEAR,
  type CompoundingFrequency,
} from "./rates";

export interface CompoundInputs {
  principalPaise: Paise;
  annualRatePct: number;
  years: number;
  compounding: CompoundingFrequency;
}

export interface CompoundYearRow {
  /** 0-based so the chart starts at the deposit moment. */
  year: number;
  simplePaise: Paise;
  compoundPaise: Paise;
  /** compound − simple: "interest earned by interest". */
  gapPaise: Paise;
}

export interface CompoundResult {
  yearly: CompoundYearRow[];
  finalSimplePaise: Paise;
  finalCompoundPaise: Paise;
  gapPaise: Paise;
  /** Rule-of-72 estimate; NaN-free only for rate > 0. */
  doublingYearsRule72: number;
  /** Exact doubling time ln2 / ln(1+annual effective rate). */
  doublingYearsExact: number;
}

export function compareGrowth(inputs: CompoundInputs): CompoundResult {
  const { principalPaise, annualRatePct, years, compounding } = inputs;
  assertPaise(principalPaise, "principalPaise");
  if (principalPaise < 0) throw new RangeError("principal must not be negative");
  assertRate(annualRatePct);
  assertYears(years);

  const r = annualRatePct / 100;
  const n = PERIODS_PER_YEAR[compounding];

  const simpleAt = (y: number): Paise =>
    roundPaise(principalPaise * (1 + r * y));
  const compoundAt = (y: number): Paise =>
    roundPaise(principalPaise * Math.pow(1 + r / n, n * y));

  const yearly: CompoundYearRow[] = [];
  for (let y = 0; y <= years; y++) {
    const simplePaise = simpleAt(y);
    const compoundPaise = compoundAt(y);
    yearly.push({ year: y, simplePaise, compoundPaise, gapPaise: compoundPaise - simplePaise });
  }

  const finalSimplePaise = simpleAt(years);
  const finalCompoundPaise = compoundAt(years);
  const effectiveAnnual = Math.pow(1 + r / n, n) - 1;

  return {
    yearly,
    finalSimplePaise,
    finalCompoundPaise,
    gapPaise: finalCompoundPaise - finalSimplePaise,
    doublingYearsRule72: annualRatePct > 0 ? 72 / annualRatePct : Infinity,
    doublingYearsExact:
      annualRatePct > 0 ? Math.LN2 / Math.log(1 + effectiveAnnual) : Infinity,
  };
}
