import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { projectSavings, type SavingsInputs } from "../src/savings";

const base: SavingsInputs = {
  initialPaise: 0,
  monthlyPaise: 0,
  annualRatePct: 0,
  years: 10,
  compounding: "monthly",
  inflationPct: 0,
};

/**
 * GOLDEN VALUES — computed independently of this library via direct
 * closed-form evaluation (node one-liners, 2026-07-08), cross-checked
 * against textbook factors: 1.07^10 = 1.9671514, (1+0.10/12)^120 = 2.7070415,
 * 1.01^120 = 3.3003869 (standard SIP tables), 1.02^20 = 1.4859474.
 * Loop-vs-closed-form float drift allowance: ±2 paise.
 */
const GOLDEN: {
  name: string;
  inputs: SavingsInputs;
  expectedFinalPaise: number;
}[] = [
  {
    name: "₹1L lump @10% monthly compounding, 10y → ₹2,70,704.15",
    inputs: { ...base, initialPaise: 100_000_00, annualRatePct: 10 },
    expectedFinalPaise: 27_070_415,
  },
  {
    name: "₹5,000 SIP @12% monthly compounding, 10y → ₹11,50,193.45",
    inputs: { ...base, monthlyPaise: 5_000_00, annualRatePct: 12 },
    expectedFinalPaise: 115_019_345,
  },
  {
    name: "₹1,000 lump @7% yearly compounding, 10y → ₹1,967.15",
    inputs: {
      ...base,
      initialPaise: 1_000_00,
      annualRatePct: 7,
      compounding: "yearly",
    },
    expectedFinalPaise: 196_715,
  },
  {
    name: "₹1L lump @8% quarterly compounding, 5y → ₹1,48,594.74",
    inputs: {
      ...base,
      initialPaise: 100_000_00,
      annualRatePct: 8,
      years: 5,
      compounding: "quarterly",
    },
    expectedFinalPaise: 14_859_474,
  },
  {
    name: "₹1L lump @6% half-yearly compounding, 3y → ₹1,19,405.23",
    inputs: {
      ...base,
      initialPaise: 100_000_00,
      annualRatePct: 6,
      years: 3,
      compounding: "half-yearly",
    },
    expectedFinalPaise: 11_940_523,
  },
  {
    name: "₹10k initial + ₹2k SIP @9% quarterly compounding, 15y → ₹7,90,276.54",
    inputs: {
      initialPaise: 10_000_00,
      monthlyPaise: 2_000_00,
      annualRatePct: 9,
      years: 15,
      compounding: "quarterly",
      inflationPct: 0,
    },
    expectedFinalPaise: 79_027_654,
  },
];

describe("projectSavings — golden values", () => {
  for (const { name, inputs, expectedFinalPaise } of GOLDEN) {
    it(name, () => {
      const r = projectSavings(inputs);
      expect(Math.abs(r.finalPaise - expectedFinalPaise)).toBeLessThanOrEqual(2);
    });
  }

  it("real value deflates by inflation: ₹1L lump @10%/10y with 6% inflation", () => {
    const r = projectSavings({
      ...base,
      initialPaise: 100_000_00,
      annualRatePct: 10,
      inflationPct: 6,
    });
    // Independently: 10000000·(1+0.10/12)^120 / 1.06^10 = 15,115,978.29 paise
    expect(Math.abs(r.realFinalPaise - 15_115_978)).toBeLessThanOrEqual(2);
  });
});

describe("projectSavings — exact behaviors", () => {
  it("zero rate ⇒ final is exactly the sum of deposits", () => {
    const r = projectSavings({
      ...base,
      initialPaise: 50_000_00,
      monthlyPaise: 1_000_00,
      years: 3,
    });
    expect(r.finalPaise).toBe(50_000_00 + 36 * 1_000_00);
    expect(r.interestPaise).toBe(0);
    expect(r.growthPct).toBe(0);
  });

  it("zero everything ⇒ zeros, growthPct 0 (no division by zero)", () => {
    const r = projectSavings({ ...base, years: 5 });
    expect(r.finalPaise).toBe(0);
    expect(r.growthPct).toBe(0);
  });

  it("zero years ⇒ final equals the initial deposit, no rows", () => {
    const r = projectSavings({ ...base, initialPaise: 7_777_77, years: 0 });
    expect(r.finalPaise).toBe(7_777_77);
    expect(r.yearly).toHaveLength(0);
  });

  it("reports the effective monthly rate used", () => {
    const r = projectSavings({ ...base, annualRatePct: 12 });
    expect(r.monthlyRate).toBeCloseTo(0.01, 12);
  });
});

describe("projectSavings — validation", () => {
  it("rejects negative deposits", () => {
    expect(() => projectSavings({ ...base, initialPaise: -1 })).toThrow(RangeError);
  });
  it("rejects fractional paise", () => {
    expect(() => projectSavings({ ...base, monthlyPaise: 10.5 })).toThrow(RangeError);
  });
  it("rejects out-of-range rates and years", () => {
    expect(() => projectSavings({ ...base, annualRatePct: -1 })).toThrow(RangeError);
    expect(() => projectSavings({ ...base, annualRatePct: 51 })).toThrow(RangeError);
    expect(() => projectSavings({ ...base, years: 61 })).toThrow(RangeError);
    expect(() => projectSavings({ ...base, years: 2.5 })).toThrow(RangeError);
  });
});

const inputsArb = fc.record({
  initialPaise: fc.integer({ min: 0, max: 10_00_000_00 }),
  monthlyPaise: fc.integer({ min: 0, max: 1_00_000_00 }),
  annualRatePct: fc.integer({ min: 0, max: 60 }).map((x) => x / 4), // 0–15 in 0.25 steps
  years: fc.integer({ min: 1, max: 40 }),
  compounding: fc.constantFrom(
    "yearly" as const,
    "half-yearly" as const,
    "quarterly" as const,
    "monthly" as const,
  ),
  inflationPct: fc.integer({ min: 0, max: 12 }),
});

describe("projectSavings — properties", () => {
  it("deposited + interest = final, on every yearly row and in total", () => {
    fc.assert(
      fc.property(inputsArb, (inputs) => {
        const r = projectSavings(inputs);
        expect(r.depositedPaise + r.interestPaise).toBe(r.finalPaise);
        for (const row of r.yearly) {
          expect(row.depositedPaise + row.interestPaise).toBe(row.balancePaise);
        }
      }),
    );
  });

  it("interest is never negative; balances never decrease year over year", () => {
    fc.assert(
      fc.property(inputsArb, (inputs) => {
        const r = projectSavings(inputs);
        expect(r.interestPaise).toBeGreaterThanOrEqual(0);
        let prev = 0;
        for (const row of r.yearly) {
          expect(row.balancePaise).toBeGreaterThanOrEqual(prev);
          prev = row.balancePaise;
        }
      }),
    );
  });

  it("final amount is monotonic in the interest rate", () => {
    fc.assert(
      fc.property(inputsArb, (inputs) => {
        const lo = projectSavings(inputs);
        const hi = projectSavings({
          ...inputs,
          annualRatePct: inputs.annualRatePct + 1,
        });
        expect(hi.finalPaise).toBeGreaterThanOrEqual(lo.finalPaise);
      }),
    );
  });

  it("real value never exceeds nominal (inflation ≥ 0), equal at 0%", () => {
    fc.assert(
      fc.property(inputsArb, (inputs) => {
        const r = projectSavings(inputs);
        expect(r.realFinalPaise).toBeLessThanOrEqual(r.finalPaise);
        if (inputs.inflationPct === 0) {
          expect(r.realFinalPaise).toBe(r.finalPaise);
        }
      }),
    );
  });

  it("produces exactly `years` rows and the last row matches the totals", () => {
    fc.assert(
      fc.property(inputsArb, (inputs) => {
        const r = projectSavings(inputs);
        expect(r.yearly).toHaveLength(inputs.years);
        const last = r.yearly[inputs.years - 1]!;
        expect(last.balancePaise).toBe(r.finalPaise);
        expect(last.depositedPaise).toBe(r.depositedPaise);
      }),
    );
  });
});
