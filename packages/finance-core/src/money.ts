/**
 * Money primitives. All monetary values in finance-core are **integer paise**
 * (₹1 = 100 paise). JS numbers are safe integers to 2^53−1 ≈ ₹90 trillion,
 * far beyond any simulator bound (docs/06 §3).
 *
 * Rounding policy (decided once, tested): **half away from zero** ("half-up"
 * in common Indian banking usage): 0.5 → 1, −0.5 → −1.
 */

export type Paise = number;

/** Round a fractional paise amount using the project rounding policy. */
export function roundPaise(x: number): Paise {
  const r = Math.floor(Math.abs(x) + 0.5);
  return x < 0 ? -r : r;
}

export function rupeesToPaise(rupees: number): Paise {
  return roundPaise(rupees * 100);
}

export function paiseToRupees(paise: Paise): number {
  return paise / 100;
}

/** Guard for API boundaries: throws if a value is not integer paise. */
export function assertPaise(value: number, name = "amount"): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be integer paise, got ${value}`);
  }
}
