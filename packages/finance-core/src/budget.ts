/**
 * "Budget one paycheck" scenario engine.
 *
 * The user splits one month's income across needs / wants / savings, then an
 * unexpected expense hits mid-month. The lesson is the WATERFALL: a shock is
 * absorbed first by unspent buffer, then by an emergency fund, then by
 * raiding savings — and only when all of those run dry does it become
 * credit-card debt, where it quietly compounds at punishing rates.
 *
 * The mind-bending number the engine surfaces: a small shock with no buffer
 * doesn't cost you the shock — it costs you the shock plus months of ~42%
 * card interest, often turning ₹9,000 into well over ₹10,000.
 */

import { assertPaise, roundPaise, type Paise } from "./money";

/** Typical Indian credit-card APR when a balance is carried. */
export const CARD_APR_PCT = 42;

export interface BudgetInputs {
  incomePaise: Paise;
  /** Rent, food, bills, transport — the unavoidable. */
  needsPaise: Paise;
  /** Dining out, subscriptions, shopping — the nice-to-have. */
  wantsPaise: Paise;
  /** Deliberately set aside this month. */
  savingsPaise: Paise;
  /** Emergency fund already saved from previous months. */
  emergencyFundPaise: Paise;
  /** The unexpected mid-month expense. */
  shockPaise: Paise;
  /** Months you'd take to clear any card debt the shock forces. */
  cardRepayMonths: number;
}

export type ShockSource = "buffer" | "emergency_fund" | "savings" | "card";

export interface ShockAbsorption {
  source: ShockSource;
  amountPaise: Paise;
}

export interface BudgetResult {
  /** income − needs − wants − savings; negative means over-allocated. */
  bufferPaise: Paise;
  overAllocated: boolean;
  /** Shares of income, percent. */
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
  /** How the shock was paid, in waterfall order. */
  absorption: ShockAbsorption[];
  /** Debt pushed onto the card (0 if fully absorbed). */
  cardDebtPaise: Paise;
  /** What that debt becomes after cardRepayMonths at CARD_APR, if carried. */
  cardDebtAfterInterestPaise: Paise;
  /** Extra paid purely as card interest. */
  cardInterestPaise: Paise;
  /** Savings actually kept after the shock raided them. */
  savingsSurvivingPaise: Paise;
  /** Emergency fund left after the shock. */
  emergencyFundLeftPaise: Paise;
  /** A grade for the month. */
  outcome: "thrived" | "survived" | "squeezed" | "debt_spiral";
  /** Plain-language verdict lines. */
  notes: string[];
}

const round = roundPaise;

export function evaluateBudget(inputs: BudgetInputs): BudgetResult {
  const {
    incomePaise,
    needsPaise,
    wantsPaise,
    savingsPaise,
    emergencyFundPaise,
    shockPaise,
    cardRepayMonths,
  } = inputs;

  for (const [name, v] of Object.entries(inputs)) {
    if (name === "cardRepayMonths") continue;
    assertPaise(v, name);
    if (v < 0) throw new RangeError(`${name} must not be negative`);
  }
  if (incomePaise <= 0) throw new RangeError("income must be positive");
  if (!Number.isInteger(cardRepayMonths) || cardRepayMonths < 1 || cardRepayMonths > 60) {
    throw new RangeError("cardRepayMonths must be 1–60");
  }

  const bufferPaise = incomePaise - needsPaise - wantsPaise - savingsPaise;
  const overAllocated = bufferPaise < 0;

  // The shock waterfall. Positive buffer is spent first; if the user
  // over-allocated, there is no buffer to draw on.
  let remaining = shockPaise;
  const absorption: ShockAbsorption[] = [];
  const take = (source: ShockSource, available: number) => {
    if (remaining <= 0 || available <= 0) return 0;
    const used = Math.min(remaining, available);
    remaining -= used;
    absorption.push({ source, amountPaise: used });
    return used;
  };

  const availableBuffer = Math.max(0, bufferPaise);
  take("buffer", availableBuffer);
  const emergencyUsed = take("emergency_fund", emergencyFundPaise);
  const savingsUsed = take("savings", savingsPaise);
  const cardDebtPaise = Math.max(0, remaining);
  if (cardDebtPaise > 0) {
    absorption.push({ source: "card", amountPaise: cardDebtPaise });
  }

  // Card debt compounds monthly if carried.
  const monthlyRate = CARD_APR_PCT / 12 / 100;
  const cardDebtAfterInterestPaise =
    cardDebtPaise > 0
      ? round(cardDebtPaise * Math.pow(1 + monthlyRate, cardRepayMonths))
      : 0;
  const cardInterestPaise = cardDebtAfterInterestPaise - cardDebtPaise;

  const emergencyFundLeftPaise = emergencyFundPaise - emergencyUsed;
  const savingsSurvivingPaise = savingsPaise - savingsUsed;

  const pct = (p: number) => Math.round((p / incomePaise) * 1000) / 10;
  const needsPct = pct(needsPaise);
  const wantsPct = pct(wantsPaise);
  const savingsPct = pct(savingsPaise);

  const outcome = gradeOutcome({
    overAllocated,
    cardDebtPaise,
    savingsUsed,
    emergencyUsed,
    savingsPaise,
  });

  return {
    bufferPaise,
    overAllocated,
    needsPct,
    wantsPct,
    savingsPct,
    absorption,
    cardDebtPaise,
    cardDebtAfterInterestPaise,
    cardInterestPaise,
    savingsSurvivingPaise,
    emergencyFundLeftPaise,
    outcome,
    notes: buildNotes({
      inputs,
      bufferPaise,
      overAllocated,
      needsPct,
      wantsPct,
      savingsPct,
      cardDebtPaise,
      cardInterestPaise,
      emergencyUsed,
      savingsUsed,
    }),
  };
}

function gradeOutcome(a: {
  overAllocated: boolean;
  cardDebtPaise: number;
  savingsUsed: number;
  emergencyUsed: number;
  savingsPaise: number;
}): BudgetResult["outcome"] {
  if (a.cardDebtPaise > 0) return "debt_spiral";
  if (a.savingsUsed > 0) return "squeezed";
  if (a.emergencyUsed > 0) return "survived";
  return "thrived";
}

function buildNotes(a: {
  inputs: BudgetInputs;
  bufferPaise: number;
  overAllocated: boolean;
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
  cardDebtPaise: number;
  cardInterestPaise: number;
  emergencyUsed: number;
  savingsUsed: number;
}): string[] {
  const notes: string[] = [];

  // The 50/30/20 guideline as a gentle yardstick, not a rule.
  if (a.needsPct > 60) {
    notes.push(
      `Needs eat ${a.needsPct}% of your income — above the ~50% guideline, which leaves little room to absorb surprises.`,
    );
  }
  if (a.wantsPct > 30) {
    notes.push(
      `Wants are ${a.wantsPct}% of income (guideline is ~30%). Trimming here is the easiest place to free up a buffer.`,
    );
  }
  if (a.savingsPct >= 20) {
    notes.push(
      `Saving ${a.savingsPct}% is genuinely strong — most people never reach 20%.`,
    );
  }

  if (a.overAllocated) {
    notes.push(
      "You allocated more than you earn — before any shock, this month is already in the red.",
    );
  } else if (a.bufferPaise === 0) {
    notes.push(
      "You allocated every rupee with zero buffer. It feels efficient, but it means any surprise has nowhere to land except debt.",
    );
  }

  if (a.cardDebtPaise > 0) {
    notes.push(
      `The shock outran your buffer, emergency fund and savings — so it landed on a credit card. Carried at ${CARD_APR_PCT}% APR, it grows by an extra amount in interest, turning a one-off expense into a months-long drag.`,
    );
  } else if (a.emergencyUsed > 0) {
    notes.push(
      "Your emergency fund did exactly its job — it absorbed the shock so your savings and your month survived intact. This is precisely why the fund exists.",
    );
  } else if (a.savingsUsed > 0) {
    notes.push(
      "Your buffer wasn't enough, so the shock ate into this month's savings. No debt — but your progress stalled, which is what an emergency fund is meant to prevent.",
    );
  } else {
    notes.push(
      "Your unspent buffer swallowed the shock without touching savings or debt. That slack is the quiet superpower of not budgeting to the last rupee.",
    );
  }

  return notes;
}
