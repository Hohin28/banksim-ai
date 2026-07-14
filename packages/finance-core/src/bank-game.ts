/**
 * Bank Manager Simulation engine (F5, docs/02).
 *
 * The player is a bank: approve or reject loan applicants over 12 rounds,
 * balancing profit against default risk. All randomness comes from a seeded
 * PRNG so a saved game replays identically (tested).
 *
 * Attributes → hidden default probability uses the same shape as the loan
 * approval heuristic (F3) and the ML demo (F10), so the three reinforce each
 * other.
 */

import { monthlyEmiPaise } from "./loan";
import type { EmploymentType } from "./loan";
import type { Paise } from "./money";

/** Mulberry32 — tiny, fast, deterministic PRNG. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Applicant {
  id: string;
  name: string;
  age: number;
  employment: EmploymentType;
  creditScore: number;
  amountPaise: Paise;
  months: number;
  monthlyIncomePaise: Paise;
  /** Short history note shown on the card. */
  history: string;
  /** Hidden true probability of default over the loan. 0–1. */
  defaultProb: number;
}

export interface ApprovedLoan {
  applicant: Applicant;
  ratePct: number;
  emiPaise: Paise;
  /** Resolved at round end. */
  defaulted: boolean;
}

export type GameStatus = "active" | "won" | "collapsed";

export interface BankGameState {
  seed: number;
  round: number;
  capitalPaise: Paise;
  /** Cumulative profit/loss since start. */
  profitPaise: Paise;
  /** Non-performing assets ratio, percent. */
  npaPct: number;
  /** Customer satisfaction, 0–100. */
  satisfaction: number;
  /** Bank stability, 0–100; hitting 0 ends the game. */
  stability: number;
  status: GameStatus;
  /** Applicants dealt for the current round. */
  currentApplicants: Applicant[];
  /** Log of resolved rounds for the post-mortem. */
  history: RoundResult[];
}

/** Per-applicant explanation of what happened and WHY (the teaching layer). */
export interface ApplicantOutcome {
  applicant: Applicant;
  decision: "approved" | "rejected";
  outcome: "repaid" | "defaulted" | "rejected";
  /** Rate offered when approved. */
  ratePct?: number;
  /** Signed effect on the round's profit; 0 for rejections. */
  profitPaise: Paise;
  /** Plain-language explanation of the result. */
  why: string;
}

export interface RoundResult {
  round: number;
  approved: number;
  rejected: number;
  defaults: number;
  profitPaise: Paise;
  note: string;
  /** One entry per applicant dealt this round, in dealing order. */
  outcomes: ApplicantOutcome[];
}

export const TOTAL_ROUNDS = 12;
const STARTING_CAPITAL: Paise = 100_000_000_00; // ₹10 crore
const COST_OF_FUNDS_PCT = 4;

const FIRST_NAMES = [
  "Meera", "Arjun", "Devi", "Rohan", "Priya", "Karan", "Anjali", "Vikram",
  "Sneha", "Rahul", "Kavya", "Aditya", "Nisha", "Sanjay", "Pooja", "Farhan",
];
const HISTORIES = [
  "clean repayment record",
  "one late payment last year",
  "new to credit",
  "recently cleared a loan",
  "a past default, since recovered",
  "steady long-term customer",
];

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function intBetween(rng: () => number, lo: number, hi: number): number {
  return Math.floor(lo + rng() * (hi - lo + 1));
}

/**
 * Derive a true default probability from attributes. Lower credit score,
 * higher FOIR, self-employment/student, and a rocky history all raise it.
 */
function computeDefaultProb(
  creditScore: number,
  foirPct: number,
  employment: EmploymentType,
  history: string,
): number {
  let p = 0.06;
  p += (780 - creditScore) * 0.0006; // each point below 780 adds risk
  p += Math.max(0, foirPct - 35) * 0.004;
  if (employment === "self-employed") p += 0.04;
  if (employment === "student") p += 0.09;
  if (history.includes("default")) p += 0.1;
  if (history.includes("late")) p += 0.04;
  if (history.includes("clean") || history.includes("steady")) p -= 0.03;
  return Math.max(0.01, Math.min(0.95, p));
}

export function generateApplicant(rng: () => number, index: number): Applicant {
  const employment = pick<EmploymentType>(rng, ["salaried", "self-employed", "student"]);
  const age = intBetween(rng, 21, 58);
  const creditScore = employment === "student" ? intBetween(rng, 300, 680) : intBetween(rng, 520, 880);
  const amountLakh = intBetween(rng, 1, 25);
  const amountPaise = amountLakh * 100000 * 100;
  const months = pick(rng, [12, 24, 36, 48, 60, 84]);
  const incomeK = intBetween(rng, 15, 120);
  const monthlyIncomePaise = incomeK * 1000 * 100;
  const history = pick(rng, HISTORIES);

  const emi = monthlyEmiPaise(amountPaise, 12, months);
  const foirPct = (emi / monthlyIncomePaise) * 100;
  const defaultProb = computeDefaultProb(creditScore, foirPct, employment, history);

  return {
    id: `r-${index}-${Math.floor(rng() * 1e6)}`,
    name: pick(rng, FIRST_NAMES),
    age,
    employment,
    creditScore,
    amountPaise,
    months,
    monthlyIncomePaise,
    history,
    defaultProb,
  };
}

function dealApplicants(rng: () => number, round: number): Applicant[] {
  const count = intBetween(rng, 5, 8);
  return Array.from({ length: count }, (_, i) => generateApplicant(rng, round * 100 + i));
}

export function initBankGame(seed: number): BankGameState {
  const rng = makeRng(seed);
  return {
    seed,
    round: 1,
    capitalPaise: STARTING_CAPITAL,
    profitPaise: 0,
    npaPct: 0,
    satisfaction: 70,
    stability: 100,
    status: "active",
    currentApplicants: dealApplicants(rng, 1),
    history: [],
  };
}

export interface Decision {
  applicantId: string;
  approve: boolean;
  /** Interest rate offered when approving, percent. */
  ratePct?: number;
}

/**
 * Resolve the current round from the player's decisions and advance.
 * The PRNG is re-seeded from `seed + round` so resolution is deterministic
 * and independent of how many applicants were dealt.
 */
export function resolveRound(
  state: BankGameState,
  decisions: Decision[],
): BankGameState {
  if (state.status !== "active") return state;
  const rng = makeRng(state.seed + state.round * 7919);
  const decisionMap = new Map(decisions.map((d) => [d.applicantId, d]));

  let roundProfit = 0;
  let approved = 0;
  let rejected = 0;
  let defaults = 0;
  let goodRejected = 0;
  let approvedActivePaise = 0;
  let defaultedPaise = 0;
  const outcomes: ApplicantOutcome[] = [];

  for (const applicant of state.currentApplicants) {
    const decision = decisionMap.get(applicant.id);
    const approve = decision?.approve ?? false;
    if (!approve) {
      rejected++;
      if (applicant.defaultProb < 0.15) goodRejected++;
      outcomes.push({
        applicant,
        decision: "rejected",
        outcome: "rejected",
        profitPaise: 0,
        why: rejectionWhy(applicant),
      });
      continue;
    }
    approved++;
    const ratePct = decision?.ratePct ?? 12;
    const emi = monthlyEmiPaise(applicant.amountPaise, ratePct, applicant.months);
    const totalInterest = emi * applicant.months - applicant.amountPaise;
    const fundingCost = (applicant.amountPaise * (COST_OF_FUNDS_PCT / 100) * applicant.months) / 12;

    const defaulted = rng() < applicant.defaultProb;
    if (defaulted) {
      defaults++;
      // Lose roughly half the principal on default (recovery on the rest).
      const loss = Math.round(applicant.amountPaise * 0.5) + Math.round(fundingCost);
      roundProfit -= loss;
      defaultedPaise += applicant.amountPaise;
      outcomes.push({
        applicant,
        decision: "approved",
        outcome: "defaulted",
        ratePct,
        profitPaise: -loss,
        why: defaultWhy(applicant, emi),
      });
    } else {
      const gain = Math.round(totalInterest - fundingCost);
      roundProfit += gain;
      approvedActivePaise += applicant.amountPaise;
      outcomes.push({
        applicant,
        decision: "approved",
        outcome: "repaid",
        ratePct,
        profitPaise: gain,
        why:
          `Repaid all ${applicant.months} EMIs at ${ratePct}% — after paying ` +
          `${COST_OF_FUNDS_PCT}% for the deposits that funded the loan, the ` +
          `interest margin became your profit.`,
      });
    }
  }

  const capitalPaise = state.capitalPaise + roundProfit;
  const totalBook = approvedActivePaise + defaultedPaise;
  const roundNpa = totalBook === 0 ? 0 : (defaultedPaise / totalBook) * 100;
  // Smooth the NPA ratio across rounds.
  const npaPct = Math.round((state.npaPct * 0.5 + roundNpa * 0.5) * 10) / 10;

  const satisfaction = clamp(
    state.satisfaction - goodRejected * 4 + (approved > 0 ? 2 : 0),
    0,
    100,
  );

  // Stability erodes with NPA and capital loss, recovers with profit.
  const capitalRatio = capitalPaise / STARTING_CAPITAL;
  const stability = clamp(
    Math.round(40 * capitalRatio + (100 - npaPct * 2.5) * 0.4 + satisfaction * 0.2),
    0,
    100,
  );

  const note = buildNote(defaults, approved, goodRejected, roundProfit);
  const result: RoundResult = {
    round: state.round,
    approved,
    rejected,
    defaults,
    profitPaise: roundProfit,
    note,
    outcomes,
  };

  const history = [...state.history, result];
  const nextRound = state.round + 1;

  let status: GameStatus = "active";
  if (stability <= 0 || capitalPaise <= 0) status = "collapsed";
  else if (state.round >= TOTAL_ROUNDS) status = "won";

  const nextRng = makeRng(state.seed + nextRound);
  return {
    ...state,
    round: nextRound,
    capitalPaise,
    profitPaise: state.profitPaise + roundProfit,
    npaPct,
    satisfaction,
    stability,
    status,
    currentApplicants: status === "active" ? dealApplicants(nextRng, nextRound) : [],
    history,
  };
}

/** The visible warning signs that made a defaulted applicant risky. */
function defaultWhy(applicant: Applicant, emiPaise: Paise): string {
  const signs: string[] = [];
  if (applicant.creditScore < 620) {
    signs.push(`a weak credit score of ${applicant.creditScore}`);
  }
  if (applicant.employment === "student") signs.push("student income");
  if (applicant.employment === "self-employed") {
    signs.push("less predictable self-employed income");
  }
  if (applicant.history.includes("default")) signs.push("a past default on record");
  if (applicant.history.includes("late")) signs.push("previous late payments");
  const foirPct = (emiPaise / applicant.monthlyIncomePaise) * 100;
  if (foirPct > 45) {
    signs.push(`an EMI eating ${Math.round(foirPct)}% of their income`);
  }
  if (signs.length === 0) {
    return (
      "Defaulted despite a decent profile — no model catches everything, " +
      "which is exactly why banks price risk into every rate."
    );
  }
  return `Defaulted. The warning signs were there: ${joinList(signs)}. You lost about half the principal.`;
}

/** Was rejecting this applicant a good call? Explain either way. */
function rejectionWhy(applicant: Applicant): string {
  if (applicant.defaultProb < 0.15) {
    return (
      `This was actually a safe borrower (score ${applicant.creditScore}, ` +
      `${applicant.history}) — no loss, but they took their business to a ` +
      `rival bank and satisfaction dipped.`
    );
  }
  if (applicant.defaultProb >= 0.4) {
    return (
      `Good call — score ${applicant.creditScore} with "${applicant.history}" ` +
      `made this a genuinely high default risk.`
    );
  }
  return (
    "A judgement call — this profile carried moderate risk. Reasonable " +
    "bankers could disagree."
  );
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function buildNote(defaults: number, approved: number, goodRejected: number, profit: number): string {
  if (defaults >= 3) return `${defaults} of your ${approved} approvals defaulted — risky lending hurts.`;
  if (goodRejected >= 3) return `You rejected ${goodRejected} safe customers — they took their business elsewhere.`;
  if (profit > 0) return `A profitable, disciplined round.`;
  return `A quiet round.`;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
