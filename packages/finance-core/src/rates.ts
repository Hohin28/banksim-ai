/** Interest-rate helpers shared by savings/compound/loan modules. */

export type CompoundingFrequency =
  | "yearly"
  | "half-yearly"
  | "quarterly"
  | "monthly";

export const PERIODS_PER_YEAR: Record<CompoundingFrequency, number> = {
  yearly: 1,
  "half-yearly": 2,
  quarterly: 4,
  monthly: 12,
};

/**
 * Effective monthly growth rate for a nominal annual rate compounded n
 * times per year: (1 + r/n)^(n/12) − 1.
 *
 * This is the model decision (docs/02 F1): deposits happen monthly, so the
 * engine simulates month by month at the effective monthly rate. For
 * monthly compounding it reduces exactly to r/12; for other frequencies it
 * captures the real effect of the frequency without pretending deposits
 * wait for the next credit date.
 */
export function effectiveMonthlyRate(
  annualRatePct: number,
  compounding: CompoundingFrequency,
): number {
  const r = annualRatePct / 100;
  const n = PERIODS_PER_YEAR[compounding];
  return Math.pow(1 + r / n, n / 12) - 1;
}

export function assertRate(pct: number, max = 50, name = "rate"): void {
  if (!Number.isFinite(pct) || pct < 0 || pct > max) {
    throw new RangeError(`${name} must be between 0 and ${max}%, got ${pct}`);
  }
}

export function assertYears(years: number, max = 60): void {
  if (!Number.isInteger(years) || years < 0 || years > max) {
    throw new RangeError(`years must be an integer 0–${max}, got ${years}`);
  }
}
