import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  amortize,
  monthlyEmiPaise,
  simulateLoan,
  type LoanInputs,
} from "../src/loan";

/**
 * GOLDEN EMI VALUES — computed independently via the closed-form formula
 * (node one-liners, 2026-07-09) and cross-checked against public bank EMI
 * calculators. EMI in paise:
 *   ₹5,00,000 @9.5% / 60m  = 1050093  (₹10,500.93)
 *   ₹25,00,000 @8.5% / 240m = 2169558  (₹21,695.58)
 *   ₹1,00,000 @12% / 12m   =  888488  (₹8,884.88)
 *   ₹10,00,000 @10% / 120m = 1321507  (₹13,215.07)
 *   ₹3,00,000 @0% / 24m    = 1250000  (₹12,500.00)
 */
const GOLDEN: { name: string; P: number; rate: number; n: number; emi: number }[] = [
  { name: "₹5L @9.5% 5y", P: 500000_00, rate: 9.5, n: 60, emi: 1050093 },
  { name: "₹25L @8.5% 20y", P: 2500000_00, rate: 8.5, n: 240, emi: 2169558 },
  { name: "₹1L @12% 1y", P: 100000_00, rate: 12, n: 12, emi: 888488 },
  { name: "₹10L @10% 10y", P: 1000000_00, rate: 10, n: 120, emi: 1321507 },
  { name: "₹3L @0% 2y (interest-free)", P: 300000_00, rate: 0, n: 24, emi: 1250000 },
];

describe("monthlyEmiPaise — golden values", () => {
  for (const g of GOLDEN) {
    it(g.name, () => {
      expect(Math.abs(monthlyEmiPaise(g.P, g.rate, g.n) - g.emi)).toBeLessThanOrEqual(1);
    });
  }
});

describe("amortize — structure", () => {
  it("principal portions sum exactly to the loan, balance ends at 0", () => {
    const { schedule } = amortize(500000_00, 9.5, 60);
    const principalSum = schedule.reduce((s, r) => s + r.principalPaise, 0);
    expect(principalSum).toBe(500000_00);
    expect(schedule[schedule.length - 1]!.balancePaise).toBe(0);
  });

  it("early instalments are mostly interest (the teaching point)", () => {
    const { schedule } = amortize(1000000_00, 10, 120);
    expect(schedule[0]!.interestPaise).toBeGreaterThan(schedule[0]!.principalPaise);
    const last = schedule[schedule.length - 1]!;
    expect(last.principalPaise).toBeGreaterThan(last.interestPaise);
  });

  it("balance is strictly non-increasing", () => {
    const { schedule } = amortize(750000_00, 11, 84);
    let prev = Infinity;
    for (const row of schedule) {
      expect(row.balancePaise).toBeLessThanOrEqual(prev);
      prev = row.balancePaise;
    }
  });

  it("0% loan: every instalment is pure principal", () => {
    const { schedule } = amortize(300000_00, 0, 24);
    expect(schedule.every((r) => r.interestPaise === 0)).toBe(true);
  });
});

const base: LoanInputs = {
  principalPaise: 500000_00,
  annualRatePct: 9.5,
  months: 60,
  monthlyIncomePaise: 60000_00,
  monthlyExpensesPaise: 20000_00,
  existingEmiPaise: 0,
  creditScore: 780,
  employment: "salaried",
};

describe("simulateLoan — totals", () => {
  it("total payment = principal + total interest", () => {
    const r = simulateLoan(base);
    expect(r.totalPaymentPaise).toBe(base.principalPaise + r.totalInterestPaise);
  });

  it("computes FOIR from existing + new EMI over income", () => {
    const r = simulateLoan({ ...base, existingEmiPaise: 10000_00 });
    const expected = ((10000_00 + r.emiPaise) / 60000_00) * 100;
    expect(r.foirPct).toBeCloseTo(expected, 6);
  });
});

describe("simulateLoan — approval heuristic", () => {
  it("reasons sum to the score offset from the baseline of 50", () => {
    const r = simulateLoan(base);
    const sum = r.approvalReasons.reduce((s, x) => s + x.points, 0);
    expect(r.approvalScore).toBe(Math.max(0, Math.min(100, 50 + sum)));
  });

  it("strong profile → low risk; weak profile → high risk", () => {
    const strong = simulateLoan(base);
    expect(strong.risk).toBe("low");

    const weak = simulateLoan({
      ...base,
      creditScore: 520,
      employment: "student",
      monthlyIncomePaise: 25000_00,
      monthlyExpensesPaise: 20000_00,
      existingEmiPaise: 8000_00,
    });
    expect(weak.risk).toBe("high");
    expect(weak.approvalScore).toBeLessThan(strong.approvalScore);
  });

  it("high FOIR is itemized as a negative reason", () => {
    const r = simulateLoan({
      ...base,
      monthlyIncomePaise: 20000_00,
      existingEmiPaise: 5000_00,
    });
    expect(r.approvalReasons.some((x) => x.points < 0 && /FOIR/.test(x.label))).toBe(true);
  });
});

describe("simulateLoan — validation", () => {
  it("rejects non-positive principal and income", () => {
    expect(() => simulateLoan({ ...base, principalPaise: 0 })).toThrow(RangeError);
    expect(() => simulateLoan({ ...base, monthlyIncomePaise: 0 })).toThrow(RangeError);
  });
  it("rejects out-of-range months, rate, score", () => {
    expect(() => simulateLoan({ ...base, months: 0 })).toThrow(RangeError);
    expect(() => simulateLoan({ ...base, months: 361 })).toThrow(RangeError);
    expect(() => simulateLoan({ ...base, annualRatePct: 41 })).toThrow(RangeError);
    expect(() => simulateLoan({ ...base, creditScore: 299 })).toThrow(RangeError);
  });
  it("rejects negative expenses/existing EMI and fractional paise", () => {
    expect(() => simulateLoan({ ...base, monthlyExpensesPaise: -1 })).toThrow(RangeError);
    expect(() => simulateLoan({ ...base, existingEmiPaise: -1 })).toThrow(RangeError);
    expect(() => simulateLoan({ ...base, principalPaise: 1.5 })).toThrow(RangeError);
  });
});

const loanArb = fc.record({
  principalPaise: fc.integer({ min: 10000_00, max: 50000000_00 }),
  annualRatePct: fc.integer({ min: 0, max: 160 }).map((x) => x / 4), // 0–40
  months: fc.integer({ min: 1, max: 360 }),
  monthlyIncomePaise: fc.integer({ min: 10000_00, max: 500000_00 }),
  monthlyExpensesPaise: fc.integer({ min: 0, max: 200000_00 }),
  existingEmiPaise: fc.integer({ min: 0, max: 100000_00 }),
  creditScore: fc.integer({ min: 300, max: 900 }),
  employment: fc.constantFrom("salaried" as const, "self-employed" as const, "student" as const),
});

describe("simulateLoan — properties", () => {
  it("principal portions always sum to the loan; final balance 0", () => {
    fc.assert(
      fc.property(loanArb, (inputs) => {
        const r = simulateLoan(inputs);
        const sum = r.schedule.reduce((s, x) => s + x.principalPaise, 0);
        expect(sum).toBe(inputs.principalPaise);
        expect(r.schedule[r.schedule.length - 1]!.balancePaise).toBe(0);
      }),
    );
  });

  it("EMI rises with the interest rate", () => {
    fc.assert(
      fc.property(loanArb, (inputs) => {
        const lo = simulateLoan(inputs);
        const hi = simulateLoan({ ...inputs, annualRatePct: Math.min(40, inputs.annualRatePct + 1) });
        expect(hi.emiPaise).toBeGreaterThanOrEqual(lo.emiPaise);
      }),
    );
  });

  it("approval score stays within 0–100 and risk matches the bands", () => {
    fc.assert(
      fc.property(loanArb, (inputs) => {
        const r = simulateLoan(inputs);
        expect(r.approvalScore).toBeGreaterThanOrEqual(0);
        expect(r.approvalScore).toBeLessThanOrEqual(100);
        const expected = r.approvalScore >= 66 ? "low" : r.approvalScore >= 40 ? "medium" : "high";
        expect(r.risk).toBe(expected);
      }),
    );
  });

  it("yearly buckets reconcile with the monthly schedule", () => {
    fc.assert(
      fc.property(loanArb, (inputs) => {
        const r = simulateLoan(inputs);
        const yearlyPrincipal = r.yearly.reduce((s, y) => s + y.principalPaise, 0);
        expect(yearlyPrincipal).toBe(inputs.principalPaise);
        expect(r.yearly[r.yearly.length - 1]!.balancePaise).toBe(0);
      }),
    );
  });
});
