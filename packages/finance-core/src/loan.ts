/**
 * Loan Simulator engine (F3, docs/02).
 *
 * EMI uses the standard amortization formula:
 *   EMI = P·r·(1+r)^n / ((1+r)^n − 1),  r = monthly rate, n = months.
 * At r = 0 it degrades to P/n.
 *
 * The approval estimate is a **transparent, itemized heuristic** — NOT any
 * bank's real policy. Every point is attributed to a named reason so the
 * feature teaches how lenders think rather than mystifying a yes/no
 * (docs/02 F3). It must never be presented as a real lending decision.
 */

import { assertPaise, roundPaise, type Paise } from "./money";
import { assertRate } from "./rates";

export type EmploymentType = "salaried" | "self-employed" | "student";

export interface LoanInputs {
  principalPaise: Paise;
  annualRatePct: number;
  /** Tenure in months, 1–360. */
  months: number;
  monthlyIncomePaise: Paise;
  monthlyExpensesPaise: Paise;
  /** Existing EMI commitments per month. */
  existingEmiPaise: Paise;
  /** CIBIL-style score 300–900. */
  creditScore: number;
  employment: EmploymentType;
}

export interface AmortizationRow {
  /** 1-based month. */
  month: number;
  emiPaise: Paise;
  principalPaise: Paise;
  interestPaise: Paise;
  balancePaise: Paise;
}

export interface AmortizationYear {
  year: number;
  principalPaise: Paise;
  interestPaise: Paise;
  /** Balance at year end. */
  balancePaise: Paise;
}

export interface ApprovalReason {
  label: string;
  /** Signed contribution to the approval score, in points. */
  points: number;
}

export type RiskBand = "low" | "medium" | "high";

export interface LoanResult {
  emiPaise: Paise;
  totalPaymentPaise: Paise;
  totalInterestPaise: Paise;
  /** Interest as a share of principal, percent. */
  interestRatioPct: number;
  /** (existing + new EMI) / income, percent. The FOIR/DTI gauge. */
  foirPct: number;
  schedule: AmortizationRow[];
  yearly: AmortizationYear[];
  approvalScore: number;
  approvalReasons: ApprovalReason[];
  risk: RiskBand;
}

const MAX_MONTHS = 360;

export function monthlyEmiPaise(
  principalPaise: Paise,
  annualRatePct: number,
  months: number,
): Paise {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return roundPaise(principalPaise / months);
  const factor = Math.pow(1 + r, months);
  return roundPaise((principalPaise * r * factor) / (factor - 1));
}

/**
 * Full amortization. The final EMI absorbs rounding drift so the balance
 * lands exactly at 0 and the principal portions sum to the loan amount.
 */
export function amortize(
  principalPaise: Paise,
  annualRatePct: number,
  months: number,
): { schedule: AmortizationRow[]; emiPaise: Paise; totalInterestPaise: Paise } {
  const r = annualRatePct / 12 / 100;
  const emiPaise = monthlyEmiPaise(principalPaise, annualRatePct, months);
  const schedule: AmortizationRow[] = [];
  let balance = principalPaise;
  let totalInterestPaise = 0;

  for (let month = 1; month <= months; month++) {
    const interest = roundPaise(balance * r);
    let principalPart = emiPaise - interest;
    let emiThisMonth = emiPaise;

    if (month === months) {
      // Last instalment clears whatever remains (may differ by a few paise).
      principalPart = balance;
      emiThisMonth = balance + interest;
    }

    balance -= principalPart;
    totalInterestPaise += interest;
    schedule.push({
      month,
      emiPaise: emiThisMonth,
      principalPaise: principalPart,
      interestPaise: interest,
      balancePaise: balance,
    });
  }

  return { schedule, emiPaise, totalInterestPaise };
}

function toYearly(schedule: AmortizationRow[]): AmortizationYear[] {
  const years: AmortizationYear[] = [];
  for (let i = 0; i < schedule.length; i++) {
    const row = schedule[i]!;
    const yearIdx = Math.floor(i / 12);
    let bucket = years[yearIdx];
    if (!bucket) {
      bucket = {
        year: yearIdx + 1,
        principalPaise: 0,
        interestPaise: 0,
        balancePaise: 0,
      };
      years[yearIdx] = bucket;
    }
    bucket.principalPaise += row.principalPaise;
    bucket.interestPaise += row.interestPaise;
    bucket.balancePaise = row.balancePaise;
  }
  return years;
}

/**
 * Transparent approval heuristic. Baseline 50, adjusted by named factors,
 * clamped to 0–100. Educational only — see file header.
 */
function scoreApproval(
  inputs: LoanInputs,
  emiPaise: Paise,
  foirPct: number,
): { score: number; reasons: ApprovalReason[] } {
  const reasons: ApprovalReason[] = [];
  const add = (label: string, points: number) => {
    if (points !== 0) reasons.push({ label, points });
  };

  // Credit score band.
  const cs = inputs.creditScore;
  if (cs >= 800) add("Excellent credit score (800+)", 30);
  else if (cs >= 750) add("Strong credit score (750–799)", 22);
  else if (cs >= 700) add("Good credit score (700–749)", 12);
  else if (cs >= 650) add("Fair credit score (650–699)", 0);
  else if (cs >= 550) add("Low credit score (550–649)", -20);
  else add("Poor credit score (below 550)", -40);

  // FOIR / debt-to-income.
  if (foirPct <= 30) add("Low debt burden (FOIR ≤ 30%)", 20);
  else if (foirPct <= 40) add("Comfortable debt burden (FOIR ≤ 40%)", 10);
  else if (foirPct <= 50) add("Elevated debt burden (FOIR 40–50%)", -10);
  else add("High debt burden (FOIR above 50%)", -30);

  // Employment stability.
  if (inputs.employment === "salaried") add("Salaried employment", 8);
  else if (inputs.employment === "self-employed")
    add("Self-employed income (less predictable)", -5);
  else add("Student / no stable income", -25);

  // Affordability after existing obligations and living expenses.
  const disposable =
    inputs.monthlyIncomePaise -
    inputs.monthlyExpensesPaise -
    inputs.existingEmiPaise;
  if (disposable < emiPaise) {
    add("New EMI exceeds money left after expenses", -25);
  } else if (disposable < emiPaise * 1.5) {
    add("Little cushion after the new EMI", -8);
  } else {
    add("Comfortable cushion after the new EMI", 8);
  }

  const raw = 50 + reasons.reduce((sum, r) => sum + r.points, 0);
  const score = Math.max(0, Math.min(100, raw));
  return { score, reasons };
}

export function simulateLoan(inputs: LoanInputs): LoanResult {
  const {
    principalPaise,
    annualRatePct,
    months,
    monthlyIncomePaise,
    monthlyExpensesPaise,
    existingEmiPaise,
    creditScore,
  } = inputs;

  assertPaise(principalPaise, "principalPaise");
  assertPaise(monthlyIncomePaise, "monthlyIncomePaise");
  assertPaise(monthlyExpensesPaise, "monthlyExpensesPaise");
  assertPaise(existingEmiPaise, "existingEmiPaise");
  if (principalPaise <= 0) throw new RangeError("principal must be positive");
  if (monthlyIncomePaise <= 0) throw new RangeError("income must be positive");
  if (monthlyExpensesPaise < 0 || existingEmiPaise < 0) {
    throw new RangeError("expenses and existing EMI must not be negative");
  }
  assertRate(annualRatePct, 40, "annualRatePct");
  if (!Number.isInteger(months) || months < 1 || months > MAX_MONTHS) {
    throw new RangeError(`months must be an integer 1–${MAX_MONTHS}`);
  }
  if (creditScore < 300 || creditScore > 900) {
    throw new RangeError("creditScore must be 300–900");
  }

  const { schedule, emiPaise, totalInterestPaise } = amortize(
    principalPaise,
    annualRatePct,
    months,
  );
  const totalPaymentPaise = principalPaise + totalInterestPaise;
  const foirPct =
    ((existingEmiPaise + emiPaise) / monthlyIncomePaise) * 100;

  const { score, reasons } = scoreApproval(inputs, emiPaise, foirPct);
  const risk: RiskBand = score >= 66 ? "low" : score >= 40 ? "medium" : "high";

  return {
    emiPaise,
    totalPaymentPaise,
    totalInterestPaise,
    interestRatioPct: (totalInterestPaise / principalPaise) * 100,
    foirPct,
    schedule,
    yearly: toYearly(schedule),
    approvalScore: score,
    approvalReasons: reasons,
    risk,
  };
}
