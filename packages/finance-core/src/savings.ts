/**
 * Savings Simulator engine (F1, docs/02).
 *
 * Model: month-by-month simulation at the effective monthly rate.
 * Each month: balance grows by interest, then the deposit lands
 * (ordinary annuity — deposits at period end). With monthly compounding
 * this matches the closed form FV = P(1+i)^m + M·[((1+i)^m − 1)/i]
 * exactly, which the golden tests verify against published values.
 */

import { assertPaise, roundPaise, type Paise } from "./money";
import {
  assertRate,
  assertYears,
  effectiveMonthlyRate,
  type CompoundingFrequency,
} from "./rates";

export interface SavingsInputs {
  /** Opening deposit, integer paise. */
  initialPaise: Paise;
  /** Deposit added at the end of every month, integer paise. */
  monthlyPaise: Paise;
  /** Nominal annual interest rate in percent, e.g. 7 for 7%. */
  annualRatePct: number;
  /** Whole years, 0–60. */
  years: number;
  compounding: CompoundingFrequency;
  /** Annual inflation in percent, used for the real-value overlay. */
  inflationPct: number;
}

export interface SavingsYearRow {
  /** 1-based year index. */
  year: number;
  /** Balance at year end. */
  balancePaise: Paise;
  /** Cumulative deposits (initial + monthlies) by year end. */
  depositedPaise: Paise;
  /** Cumulative interest earned by year end. */
  interestPaise: Paise;
  /** Year-end balance expressed in today's purchasing power. */
  realBalancePaise: Paise;
}

export interface SavingsResult {
  finalPaise: Paise;
  depositedPaise: Paise;
  interestPaise: Paise;
  /** Final balance deflated to today's rupees. */
  realFinalPaise: Paise;
  /** Total growth over deposits, in percent (0 when nothing deposited). */
  growthPct: number;
  yearly: SavingsYearRow[];
  /** The effective monthly rate the simulation used (for the explainer). */
  monthlyRate: number;
}

export function projectSavings(inputs: SavingsInputs): SavingsResult {
  const {
    initialPaise,
    monthlyPaise,
    annualRatePct,
    years,
    compounding,
    inflationPct,
  } = inputs;

  assertPaise(initialPaise, "initialPaise");
  assertPaise(monthlyPaise, "monthlyPaise");
  if (initialPaise < 0 || monthlyPaise < 0) {
    throw new RangeError("deposits must not be negative");
  }
  assertRate(annualRatePct, 50, "annualRatePct");
  assertRate(inflationPct, 50, "inflationPct");
  assertYears(years);

  const monthlyRate = effectiveMonthlyRate(annualRatePct, compounding);
  const deflator = 1 + inflationPct / 100;

  // Float accumulator in paise; rows and totals round on report.
  let balance = initialPaise;
  let deposited = initialPaise;
  const yearly: SavingsYearRow[] = [];

  for (let year = 1; year <= years; year++) {
    for (let m = 0; m < 12; m++) {
      balance += balance * monthlyRate; // interest first…
      balance += monthlyPaise; // …then the end-of-month deposit
      deposited += monthlyPaise;
    }
    const balanceRounded = roundPaise(balance);
    yearly.push({
      year,
      balancePaise: balanceRounded,
      depositedPaise: deposited,
      // Derived, so deposits + interest === balance holds by construction.
      interestPaise: balanceRounded - deposited,
      realBalancePaise: roundPaise(balance / Math.pow(deflator, year)),
    });
  }

  const finalPaise = roundPaise(balance);
  const interestPaise = finalPaise - deposited;
  return {
    finalPaise,
    depositedPaise: deposited,
    interestPaise,
    realFinalPaise: roundPaise(balance / Math.pow(deflator, years)),
    growthPct: deposited === 0 ? 0 : (interestPaise / deposited) * 100,
    yearly,
    monthlyRate,
  };
}
