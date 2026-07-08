import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { compareGrowth, type CompoundInputs } from "../src/compound";

const base: CompoundInputs = {
  principalPaise: 10_000_00,
  annualRatePct: 8,
  years: 5,
  compounding: "yearly",
};

describe("compareGrowth — golden values", () => {
  it("₹10,000 @8% yearly, 5y: compound ₹14,693.28 vs simple ₹14,000 (gap ₹693.28)", () => {
    // Independently: 1.08^5 = 1.4693280768 (textbook); simple 1 + 0.08·5 = 1.4
    const r = compareGrowth(base);
    expect(r.finalCompoundPaise).toBe(1_469_328);
    expect(r.finalSimplePaise).toBe(1_400_000);
    expect(r.gapPaise).toBe(69_328);
  });

  it("doubling time at 8%: rule of 72 says 9y, exact says ≈9.006y", () => {
    const r = compareGrowth(base);
    expect(r.doublingYearsRule72).toBe(9);
    expect(r.doublingYearsExact).toBeCloseTo(9.006468, 5);
  });

  it("0% rate: growth flat, doubling time infinite", () => {
    const r = compareGrowth({ ...base, annualRatePct: 0 });
    expect(r.finalCompoundPaise).toBe(base.principalPaise);
    expect(r.finalSimplePaise).toBe(base.principalPaise);
    expect(r.doublingYearsRule72).toBe(Infinity);
    expect(r.doublingYearsExact).toBe(Infinity);
  });
});

describe("compareGrowth — structure", () => {
  it("year 0 row: both lines start at the principal, gap 0", () => {
    const r = compareGrowth(base);
    const first = r.yearly[0]!;
    expect(first.simplePaise).toBe(base.principalPaise);
    expect(first.compoundPaise).toBe(base.principalPaise);
    expect(first.gapPaise).toBe(0);
  });

  it("with yearly compounding, year 1 gap is 0 (the aha setup moment)", () => {
    const r = compareGrowth(base);
    expect(r.yearly[1]!.gapPaise).toBe(0);
  });

  it("emits years+1 rows (year 0 through year N)", () => {
    expect(compareGrowth(base).yearly).toHaveLength(6);
  });
});

describe("compareGrowth — validation", () => {
  it("rejects negative principal and fractional paise", () => {
    expect(() => compareGrowth({ ...base, principalPaise: -1 })).toThrow(RangeError);
    expect(() => compareGrowth({ ...base, principalPaise: 0.5 })).toThrow(RangeError);
  });
  it("rejects out-of-range rate/years", () => {
    expect(() => compareGrowth({ ...base, annualRatePct: 51 })).toThrow(RangeError);
    expect(() => compareGrowth({ ...base, years: -1 })).toThrow(RangeError);
  });
});

const arb = fc.record({
  principalPaise: fc.integer({ min: 0, max: 10_00_000_00 }),
  annualRatePct: fc.integer({ min: 0, max: 60 }).map((x) => x / 4),
  years: fc.integer({ min: 0, max: 40 }),
  compounding: fc.constantFrom(
    "yearly" as const,
    "half-yearly" as const,
    "quarterly" as const,
    "monthly" as const,
  ),
});

describe("compareGrowth — properties", () => {
  it("compound never trails simple by more than rounding (gap ≥ −1 paise), and gap grows with years", () => {
    fc.assert(
      fc.property(arb, (inputs) => {
        const r = compareGrowth(inputs);
        let prevGap = -1;
        for (const row of r.yearly) {
          expect(row.gapPaise).toBeGreaterThanOrEqual(-1); // independent rounding of the two lines
          expect(row.gapPaise).toBeGreaterThanOrEqual(prevGap - 1);
          prevGap = row.gapPaise;
        }
      }),
    );
  });

  it("both lines are non-decreasing over time", () => {
    fc.assert(
      fc.property(arb, (inputs) => {
        const r = compareGrowth(inputs);
        for (let i = 1; i < r.yearly.length; i++) {
          expect(r.yearly[i]!.simplePaise).toBeGreaterThanOrEqual(
            r.yearly[i - 1]!.simplePaise,
          );
          expect(r.yearly[i]!.compoundPaise).toBeGreaterThanOrEqual(
            r.yearly[i - 1]!.compoundPaise,
          );
        }
      }),
    );
  });
});
