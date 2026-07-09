import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { monthsToGoal, requiredMonthly } from "../src/goals";

/**
 * GOLDEN VALUES — independent closed-form evaluation (node, 2026-07-09).
 * requiredMonthly (paise): ₹80,000 @6%/24m = 314565; ₹5,00,000 @8%/60m = 680486;
 * ₹1,00,000 @0%/20m = 500000. monthsToGoal: ₹5L @₹5k/mo @10% = ceil(73.04) = 74.
 */
describe("requiredMonthly — golden values", () => {
  it("₹80,000 laptop @6% in 24 months needs ₹3,145.65/mo", () => {
    const r = requiredMonthly({ targetPaise: 80000_00, months: 24, annualReturnPct: 6 });
    expect(Math.abs(r.monthlyRequiredPaise - 314565)).toBeLessThanOrEqual(1);
  });

  it("₹5,00,000 @8% in 60 months needs ₹6,804.86/mo", () => {
    const r = requiredMonthly({ targetPaise: 500000_00, months: 60, annualReturnPct: 8 });
    expect(Math.abs(r.monthlyRequiredPaise - 680486)).toBeLessThanOrEqual(1);
  });

  it("0% return: it's just the target split evenly", () => {
    const r = requiredMonthly({ targetPaise: 100000_00, months: 20, annualReturnPct: 0 });
    expect(r.monthlyRequiredPaise).toBe(500000);
    expect(r.interestPaise).toBe(0);
  });

  it("interest = target − total contributed, and is positive when return > 0", () => {
    const r = requiredMonthly({ targetPaise: 500000_00, months: 60, annualReturnPct: 8 });
    expect(r.interestPaise).toBe(r.effectiveTargetPaise - r.totalContributedPaise);
    expect(r.interestPaise).toBeGreaterThan(0);
  });

  it("inflation adjustment raises the effective target", () => {
    const plain = requiredMonthly({ targetPaise: 100000_00, months: 120, annualReturnPct: 8 });
    const adjusted = requiredMonthly({
      targetPaise: 100000_00,
      months: 120,
      annualReturnPct: 8,
      inflationAdjust: true,
      inflationPct: 6,
    });
    expect(adjusted.effectiveTargetPaise).toBeGreaterThan(plain.effectiveTargetPaise);
    expect(adjusted.monthlyRequiredPaise).toBeGreaterThan(plain.monthlyRequiredPaise);
  });

  it("validates its inputs", () => {
    expect(() => requiredMonthly({ targetPaise: 0, months: 12, annualReturnPct: 6 })).toThrow(RangeError);
    expect(() => requiredMonthly({ targetPaise: 100, months: 0, annualReturnPct: 6 })).toThrow(RangeError);
    expect(() => requiredMonthly({ targetPaise: 100, months: 12, annualReturnPct: 31 })).toThrow(RangeError);
  });
});

describe("monthsToGoal", () => {
  it("₹5,00,000 saving ₹5,000/mo at 10% takes 74 months", () => {
    expect(monthsToGoal(500000_00, 5000_00, 10)).toBe(74);
  });

  it("0% return: ceil(target / monthly)", () => {
    expect(monthsToGoal(100000_00, 3000_00, 0)).toBe(34); // ceil(33.33)
  });

  it("validates its inputs", () => {
    expect(() => monthsToGoal(0, 1000_00, 6)).toThrow(RangeError);
    expect(() => monthsToGoal(100000_00, 0, 6)).toThrow(RangeError);
  });
});

describe("goals — properties", () => {
  const arb = fc.record({
    targetPaise: fc.integer({ min: 10000_00, max: 100000000_00 }),
    months: fc.integer({ min: 1, max: 600 }),
    annualReturnPct: fc.integer({ min: 0, max: 120 }).map((x) => x / 4),
  });

  it("saving the required monthly amount reaches the goal (round-trips)", () => {
    fc.assert(
      fc.property(arb, ({ targetPaise, months, annualReturnPct }) => {
        const { monthlyRequiredPaise } = requiredMonthly({ targetPaise, months, annualReturnPct });
        // Below ~₹1/month the paise rounding of M dominates and the inverse is
        // meaningless (e.g. a ₹10k target spread over 50 years at 20%).
        if (monthlyRequiredPaise < 100) return;
        const n = monthsToGoal(targetPaise, monthlyRequiredPaise, annualReturnPct);
        // Rounding M to whole paise then re-deriving n with a ceil drifts the
        // finish by at most one month for any realistic monthly amount.
        expect(Math.abs(n - months)).toBeLessThanOrEqual(1);
      }),
    );
  });

  it("a higher return never requires saving more", () => {
    fc.assert(
      fc.property(arb, ({ targetPaise, months, annualReturnPct }) => {
        const lo = requiredMonthly({ targetPaise, months, annualReturnPct });
        const hi = requiredMonthly({ targetPaise, months, annualReturnPct: Math.min(30, annualReturnPct + 1) });
        expect(hi.monthlyRequiredPaise).toBeLessThanOrEqual(lo.monthlyRequiredPaise);
      }),
    );
  });
});
