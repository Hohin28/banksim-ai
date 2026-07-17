/**
 * "Spot the predatory loan" engine (scenario, docs/02-features F5 pattern).
 *
 * The teaching payload is the gap between a loan's ADVERTISED rate and its
 * TRUE cost. Two tricks hide cost, and this engine exposes both with real
 * maths rather than assertion:
 *
 *  1. "Flat rate" quoting. A flat rate charges interest on the FULL original
 *     principal for the whole tenure, ignoring that you're paying it down.
 *     A "10% flat" loan behaves like an ~18% reducing-balance loan.
 *  2. Processing fees. A fee deducted upfront means you receive less than you
 *     borrow but still repay EMIs on the full amount — which raises the real
 *     rate further.
 *
 * The honest measure of both is the effective APR: the reducing-balance rate
 * whose present value of EMIs equals what the borrower actually received.
 * We solve it by bisection on the monthly IRR (robust, derivative-free).
 */

import { monthlyEmiPaise } from "./loan";
import { assertPaise, roundPaise, type Paise } from "./money";

export type RateQuoting = "reducing" | "flat";

export interface LoanOffer {
  id: string;
  lender: string;
  principalPaise: Paise;
  /** How the advertised rate is quoted. */
  quoting: RateQuoting;
  /** The number on the poster, percent per year. */
  advertisedRatePct: number;
  /** Upfront processing fee as a percent of principal. */
  processingFeePct: number;
  months: number;
  /** Optional catch shown in the reveal, e.g. "3% prepayment penalty". */
  catch?: string;
}

export interface OfferResult {
  offer: LoanOffer;
  emiPaise: Paise;
  /** Cash the borrower actually receives (principal − fee). */
  netDisbursedPaise: Paise;
  feePaise: Paise;
  /** EMIs × months. */
  totalRepaidPaise: Paise;
  /** totalRepaid − netDisbursed: the real cost of the money. */
  trueCostPaise: Paise;
  /** The honest reducing-balance rate, accounting for flat quoting + fee. */
  effectiveAprPct: number;
  /** effectiveApr − advertisedRate: how much was hidden. */
  hiddenSpreadPct: number;
}

export interface OffersEvaluation {
  results: OfferResult[];
  /** id of the genuinely cheapest offer (lowest true cost). */
  cheapestId: string;
  /**
   * id of the trap: the offer hiding the most cost behind its advertised
   * rate (largest effective-vs-sticker spread), as long as it isn't actually
   * the cheapest and the gap is material. Null when every sticker is honest.
   */
  trapId: string | null;
}

/** A spread this wide between sticker and reality is a genuine trap. */
const TRAP_SPREAD_PCT = 2;

/** EMI when a rate is quoted "flat" (interest on full principal, whole term). */
export function flatRateEmiPaise(
  principalPaise: Paise,
  flatRatePct: number,
  months: number,
): Paise {
  assertPaise(principalPaise, "principalPaise");
  const years = months / 12;
  const interest = principalPaise * (flatRatePct / 100) * years;
  return roundPaise((principalPaise + interest) / months);
}

/**
 * Effective annual rate (reducing-balance) for a stream of `months` equal
 * EMIs against an amount actually received. Bisection on the monthly rate.
 */
export function effectiveAprPct(
  netDisbursedPaise: Paise,
  emiPaise: Paise,
  months: number,
): number {
  if (netDisbursedPaise <= 0 || emiPaise <= 0 || months <= 0) {
    throw new RangeError("effectiveApr requires positive inputs");
  }
  // Present value of the annuity at monthly rate r. The bisection below only
  // ever evaluates r strictly between lo and hi, so r is always > 0 here.
  const pv = (r: number): number =>
    emiPaise * ((1 - Math.pow(1 + r, -months)) / r);
  // We want pv(r) = netDisbursed. pv decreases as r rises.
  let lo = 0; // the r=0 limit, pv→total repaid ≥ net disbursed, is never evaluated
  let hi = 5; // 500% monthly is absurdly high; pv(hi) ≈ emi ≪ net disbursed
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (pv(mid) > netDisbursedPaise) lo = mid;
    else hi = mid;
  }
  const monthly = (lo + hi) / 2;
  return monthly * 12 * 100;
}

export function evaluateOffer(offer: LoanOffer): OfferResult {
  const { principalPaise, quoting, advertisedRatePct, processingFeePct, months } = offer;
  assertPaise(principalPaise, "principalPaise");
  if (principalPaise <= 0) throw new RangeError("principal must be positive");
  if (advertisedRatePct < 0 || advertisedRatePct > 100) {
    throw new RangeError("advertisedRatePct out of range");
  }
  if (processingFeePct < 0 || processingFeePct > 20) {
    throw new RangeError("processingFeePct out of range");
  }
  if (!Number.isInteger(months) || months < 1 || months > 600) {
    throw new RangeError("months out of range");
  }

  const emiPaise =
    quoting === "flat"
      ? flatRateEmiPaise(principalPaise, advertisedRatePct, months)
      : monthlyEmiPaise(principalPaise, advertisedRatePct, months);

  const feePaise = roundPaise(principalPaise * (processingFeePct / 100));
  const netDisbursedPaise = principalPaise - feePaise;
  const totalRepaidPaise = emiPaise * months;
  const trueCostPaise = totalRepaidPaise - netDisbursedPaise;
  const apr = effectiveAprPct(netDisbursedPaise, emiPaise, months);

  return {
    offer,
    emiPaise,
    netDisbursedPaise,
    feePaise,
    totalRepaidPaise,
    trueCostPaise,
    effectiveAprPct: Math.round(apr * 100) / 100,
    hiddenSpreadPct: Math.round((apr - advertisedRatePct) * 100) / 100,
  };
}

export function evaluateOffers(offers: LoanOffer[]): OffersEvaluation {
  if (offers.length < 2) throw new RangeError("compare at least two offers");
  const results = offers.map(evaluateOffer);

  const cheapest = results.reduce((best, r) =>
    r.trueCostPaise < best.trueCostPaise ? r : best,
  );
  // The trap is whichever offer buries the most cost behind its sticker.
  const mostHidden = results.reduce((worst, r) =>
    r.hiddenSpreadPct > worst.hiddenSpreadPct ? r : worst,
  );

  const isTrap =
    mostHidden.offer.id !== cheapest.offer.id &&
    mostHidden.hiddenSpreadPct >= TRAP_SPREAD_PCT;

  return {
    results,
    cheapestId: cheapest.offer.id,
    trapId: isTrap ? mostHidden.offer.id : null,
  };
}
