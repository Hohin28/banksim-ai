/**
 * Financial Goal Planner engine (F8, docs/02).
 *
 * Solves in both directions:
 *  - given a target and a horizon → required monthly saving
 *  - given a monthly capacity and a target → months needed
 * using the future-value-of-an-annuity relationship with monthly compounding.
 */

import { assertPaise, roundPaise, type Paise } from "./money";
import { assertRate } from "./rates";

export interface GoalByDateInputs {
  targetPaise: Paise;
  months: number;
  annualReturnPct: number;
  /** If true, inflate the target so it keeps today's purchasing power. */
  inflationAdjust?: boolean;
  inflationPct?: number;
}

export interface GoalResult {
  /** The target actually solved for (possibly inflation-adjusted). */
  effectiveTargetPaise: Paise;
  monthlyRequiredPaise: Paise;
  totalContributedPaise: Paise;
  /** Portion of the target that comes from returns, not contributions. */
  interestPaise: Paise;
}

/** Monthly saving needed to reach a target by a deadline. */
export function requiredMonthly(inputs: GoalByDateInputs): GoalResult {
  const {
    targetPaise,
    months,
    annualReturnPct,
    inflationAdjust = false,
    inflationPct = 0,
  } = inputs;

  assertPaise(targetPaise, "targetPaise");
  if (targetPaise <= 0) throw new RangeError("target must be positive");
  if (!Number.isInteger(months) || months < 1 || months > 600) {
    throw new RangeError("months must be an integer 1–600");
  }
  assertRate(annualReturnPct, 30, "annualReturnPct");
  assertRate(inflationPct, 30, "inflationPct");

  const years = months / 12;
  const effectiveTargetPaise =
    inflationAdjust
      ? roundPaise(targetPaise * Math.pow(1 + inflationPct / 100, years))
      : targetPaise;

  const r = annualReturnPct / 12 / 100;
  // FV = M · [((1+r)^n − 1) / r]  ⇒  M = FV · r / ((1+r)^n − 1)
  const monthlyRequiredPaise =
    r === 0
      ? roundPaise(effectiveTargetPaise / months)
      : roundPaise(
          (effectiveTargetPaise * r) / (Math.pow(1 + r, months) - 1),
        );

  const totalContributedPaise = monthlyRequiredPaise * months;
  return {
    effectiveTargetPaise,
    monthlyRequiredPaise,
    totalContributedPaise,
    interestPaise: effectiveTargetPaise - totalContributedPaise,
  };
}

/** Months needed to reach a target saving a fixed amount monthly. */
export function monthsToGoal(
  targetPaise: Paise,
  monthlyPaise: Paise,
  annualReturnPct: number,
): number {
  assertPaise(targetPaise, "targetPaise");
  assertPaise(monthlyPaise, "monthlyPaise");
  if (targetPaise <= 0) throw new RangeError("target must be positive");
  if (monthlyPaise <= 0) throw new RangeError("monthly must be positive");
  assertRate(annualReturnPct, 30, "annualReturnPct");

  const r = annualReturnPct / 12 / 100;
  if (r === 0) return Math.ceil(targetPaise / monthlyPaise);

  // n = ln(1 + FV·r/M) / ln(1+r)
  const n = Math.log(1 + (targetPaise * r) / monthlyPaise) / Math.log(1 + r);
  return Math.ceil(n);
}
