/**
 * Credit Score Simulator engine (F4, docs/02).
 *
 * A transparent, weighted, CIBIL-style model (300–900). The five factor
 * weights mirror how bureaus broadly work and are shown to the user; this is
 * a teaching model, not any bureau's real algorithm.
 *
 *   payment history 35% · utilisation 30% · credit age 15%
 *   · credit mix 10% · recent inquiries 10%
 *
 * The engine is a pure reducer: `applyAction(state, action)` returns a new
 * state, so the same event sequence always yields the same score
 * (determinism is tested).
 */

export const FACTOR_WEIGHTS = {
  payment: 0.35,
  utilisation: 0.3,
  age: 0.15,
  mix: 0.1,
  inquiries: 0.1,
} as const;

export type FactorKey = keyof typeof FACTOR_WEIGHTS;

export interface CreditState {
  /** Consecutive on-time payments recorded. */
  onTimeStreak: number;
  /** Months (on the sim clock) at which an EMI was missed. */
  missedAtMonths: number[];
  /** Current card utilisation, percent (can exceed 100 when over-limit). */
  utilisationPct: number;
  /** Age of the oldest account, in months. */
  historyMonths: number;
  /** Distinct account types held (loan, card, …), 0–3+. */
  accountTypes: number;
  /** Months at which a hard inquiry was made. */
  inquiriesAtMonths: number[];
  /** Sim clock, in months elapsed. */
  simMonths: number;
}

export type CreditActionType =
  | "PAY_ON_TIME"
  | "MISS_EMI"
  | "MAX_OUT_CARD"
  | "PAY_DOWN_CARD"
  | "OPEN_ACCOUNT"
  | "CLOSE_OLDEST"
  | "ADVANCE_MONTHS";

export interface CreditAction {
  type: CreditActionType;
  /** For ADVANCE_MONTHS: how many months. Default 3. */
  months?: number;
}

export interface CreditEvent {
  type: CreditActionType;
  atMonth: number;
  /** Score after this action, for the timeline. */
  scoreAfter: number;
  /** Signed change vs the previous score. */
  delta: number;
  label: string;
}

export interface CreditFactors {
  payment: number;
  utilisation: number;
  age: number;
  mix: number;
  inquiries: number;
}

export type StartingProfile = "new" | "building" | "established";

const PROFILES: Record<StartingProfile, CreditState> = {
  new: {
    onTimeStreak: 2,
    missedAtMonths: [],
    utilisationPct: 40,
    historyMonths: 6,
    accountTypes: 1,
    inquiriesAtMonths: [0],
    simMonths: 0,
  },
  building: {
    onTimeStreak: 12,
    missedAtMonths: [],
    utilisationPct: 30,
    historyMonths: 30,
    accountTypes: 2,
    inquiriesAtMonths: [],
    simMonths: 0,
  },
  established: {
    onTimeStreak: 48,
    missedAtMonths: [],
    utilisationPct: 12,
    historyMonths: 96,
    accountTypes: 3,
    inquiriesAtMonths: [],
    simMonths: 0,
  },
};

const MISS_DECAY_MONTHS = 24; // a missed payment stops hurting after ~2 years
const INQUIRY_WINDOW = 12; // inquiries count as "recent" for a year

export function initCreditState(profile: StartingProfile = "new"): CreditState {
  return { ...PROFILES[profile], missedAtMonths: [], inquiriesAtMonths: [...PROFILES[profile].inquiriesAtMonths] };
}

/** Each factor sub-score, 0–100. Exposed so the UI can show the breakdown. */
export function computeFactors(state: CreditState): CreditFactors {
  // Payment: start from perfect, subtract decayed penalties for each miss.
  const missPenalty = state.missedAtMonths.reduce((sum, m) => {
    const age = state.simMonths - m;
    const remaining = Math.max(0, 1 - age / MISS_DECAY_MONTHS);
    return sum + 65 * remaining;
  }, 0);
  const streakBonus = Math.min(15, state.onTimeStreak * 0.5);
  const payment = clamp01to100(100 - missPenalty + streakBonus - 15);

  // Utilisation: ≤10% is ideal, ≥90% is worst.
  const utilisation = clamp01to100(
    100 - ((state.utilisationPct - 10) / 80) * 100,
  );

  // Age: 0mo→20, ~7y+→100.
  const age = clamp01to100(20 + (state.historyMonths / 84) * 80);

  // Mix: 1 type→40, 2→70, 3+→100.
  const mix = state.accountTypes <= 1 ? 40 : state.accountTypes === 2 ? 70 : 100;

  // Inquiries: −15 each within the recent window.
  const recent = state.inquiriesAtMonths.filter(
    (m) => state.simMonths - m < INQUIRY_WINDOW,
  ).length;
  const inquiries = clamp01to100(100 - recent * 15);

  return { payment, utilisation, age, mix, inquiries };
}

/** Map the weighted factors to a 300–900 score. */
export function scoreFromFactors(f: CreditFactors): number {
  const weighted =
    f.payment * FACTOR_WEIGHTS.payment +
    f.utilisation * FACTOR_WEIGHTS.utilisation +
    f.age * FACTOR_WEIGHTS.age +
    f.mix * FACTOR_WEIGHTS.mix +
    f.inquiries * FACTOR_WEIGHTS.inquiries;
  const score = 300 + (weighted / 100) * 600;
  return Math.max(300, Math.min(900, Math.round(score)));
}

export function currentScore(state: CreditState): number {
  return scoreFromFactors(computeFactors(state));
}

const ACTION_LABELS: Record<CreditActionType, string> = {
  PAY_ON_TIME: "Paid EMI on time",
  MISS_EMI: "Missed an EMI",
  MAX_OUT_CARD: "Card utilisation to 90%",
  PAY_DOWN_CARD: "Paid card down to 10%",
  OPEN_ACCOUNT: "Opened a new account",
  CLOSE_OLDEST: "Closed the oldest account",
  ADVANCE_MONTHS: "Time passed",
};

/** Pure reducer: apply one action, returning the next state. */
export function reduceCredit(state: CreditState, action: CreditAction): CreditState {
  switch (action.type) {
    case "PAY_ON_TIME":
      return { ...state, onTimeStreak: state.onTimeStreak + 1 };
    case "MISS_EMI":
      return {
        ...state,
        onTimeStreak: 0,
        missedAtMonths: [...state.missedAtMonths, state.simMonths],
      };
    case "MAX_OUT_CARD":
      return { ...state, utilisationPct: 90 };
    case "PAY_DOWN_CARD":
      return { ...state, utilisationPct: 10 };
    case "OPEN_ACCOUNT":
      return {
        ...state,
        accountTypes: Math.min(3, state.accountTypes + 1),
        inquiriesAtMonths: [...state.inquiriesAtMonths, state.simMonths],
      };
    case "CLOSE_OLDEST":
      return {
        ...state,
        accountTypes: Math.max(1, state.accountTypes - 1),
        historyMonths: Math.round(state.historyMonths * 0.5),
      };
    case "ADVANCE_MONTHS": {
      const months = action.months ?? 3;
      return {
        ...state,
        simMonths: state.simMonths + months,
        historyMonths: state.historyMonths + months,
      };
    }
  }
}

/**
 * Apply an action and produce a timeline event describing the score change.
 * Advancing time counts as an on-time payment for that period (people who
 * let months pass without missing are paying on schedule).
 */
export function applyAction(
  state: CreditState,
  action: CreditAction,
): { state: CreditState; event: CreditEvent } {
  const before = currentScore(state);
  const next = reduceCredit(state, action);
  const after = currentScore(next);
  const label =
    action.type === "ADVANCE_MONTHS"
      ? `${action.months ?? 3} months passed`
      : ACTION_LABELS[action.type];
  return {
    state: next,
    event: {
      type: action.type,
      atMonth: next.simMonths,
      scoreAfter: after,
      delta: after - before,
      label,
    },
  };
}

function clamp01to100(x: number): number {
  return Math.max(0, Math.min(100, x));
}
