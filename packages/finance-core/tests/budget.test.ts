import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CARD_APR_PCT, evaluateBudget, type BudgetInputs } from "../src/budget";

// ₹40,000 income; needs ₹20k, wants ₹10k, savings ₹8k → ₹2k buffer.
const base: BudgetInputs = {
  incomePaise: 40000_00,
  needsPaise: 20000_00,
  wantsPaise: 10000_00,
  savingsPaise: 8000_00,
  emergencyFundPaise: 0,
  shockPaise: 9000_00,
  cardRepayMonths: 6,
};

describe("evaluateBudget — the waterfall", () => {
  it("buffer then savings absorb a shock, no debt (squeezed)", () => {
    const r = evaluateBudget(base);
    expect(r.bufferPaise).toBe(2000_00);
    expect(r.cardDebtPaise).toBe(0);
    // ₹9k shock = ₹2k buffer + ₹7k savings
    expect(r.absorption).toEqual([
      { source: "buffer", amountPaise: 2000_00 },
      { source: "savings", amountPaise: 7000_00 },
    ]);
    expect(r.savingsSurvivingPaise).toBe(1000_00);
    expect(r.outcome).toBe("squeezed");
  });

  it("an emergency fund absorbs the shock and protects savings (survived)", () => {
    const r = evaluateBudget({ ...base, emergencyFundPaise: 50000_00 });
    // ₹2k buffer + ₹7k from the fund; savings untouched.
    expect(r.cardDebtPaise).toBe(0);
    expect(r.savingsSurvivingPaise).toBe(8000_00);
    expect(r.emergencyFundLeftPaise).toBe(43000_00);
    expect(r.outcome).toBe("survived");
  });

  it("a fat buffer swallows the shock outright (thrived)", () => {
    const r = evaluateBudget({ ...base, savingsPaise: 2000_00, shockPaise: 3000_00 });
    // buffer = 40k-20k-10k-2k = 8k, shock 3k fully absorbed by buffer.
    expect(r.absorption).toEqual([{ source: "buffer", amountPaise: 3000_00 }]);
    expect(r.outcome).toBe("thrived");
  });

  it("no buffer + no fund forces card debt that compounds (debt_spiral)", () => {
    // needs 25k, wants 12k, savings 3k → buffer 0.
    const r = evaluateBudget({
      ...base,
      needsPaise: 25000_00,
      wantsPaise: 12000_00,
      savingsPaise: 3000_00,
    });
    expect(r.bufferPaise).toBe(0);
    // ₹9k shock: ₹3k savings + ₹6k onto the card.
    expect(r.cardDebtPaise).toBe(6000_00);
    // Carried 6 months at 42% APR → ~₹7,375.53.
    expect(r.cardDebtAfterInterestPaise).toBe(737553);
    expect(r.cardInterestPaise).toBe(137553);
    expect(r.outcome).toBe("debt_spiral");
    expect(r.notes.some((n) => n.includes(`${CARD_APR_PCT}%`))).toBe(true);
  });

  it("over-allocating is flagged before any shock", () => {
    const r = evaluateBudget({ ...base, wantsPaise: 25000_00 });
    expect(r.overAllocated).toBe(true);
    expect(r.bufferPaise).toBeLessThan(0);
    expect(r.notes.some((n) => /more than you earn/.test(n))).toBe(true);
  });

  it("computes category shares of income", () => {
    const r = evaluateBudget(base);
    expect(r.needsPct).toBe(50);
    expect(r.wantsPct).toBe(25);
    expect(r.savingsPct).toBe(20);
  });

  it("validates inputs", () => {
    expect(() => evaluateBudget({ ...base, incomePaise: 0 })).toThrow(RangeError);
    expect(() => evaluateBudget({ ...base, needsPaise: -1 })).toThrow(RangeError);
    expect(() => evaluateBudget({ ...base, cardRepayMonths: 0 })).toThrow(RangeError);
    expect(() => evaluateBudget({ ...base, shockPaise: 1.5 })).toThrow(RangeError);
  });
});

describe("budget — properties", () => {
  const arb = fc.record({
    incomePaise: fc.integer({ min: 10000_00, max: 200000_00 }),
    needsPaise: fc.integer({ min: 0, max: 150000_00 }),
    wantsPaise: fc.integer({ min: 0, max: 100000_00 }),
    savingsPaise: fc.integer({ min: 0, max: 100000_00 }),
    emergencyFundPaise: fc.integer({ min: 0, max: 500000_00 }),
    shockPaise: fc.integer({ min: 0, max: 100000_00 }),
    cardRepayMonths: fc.integer({ min: 1, max: 60 }),
  });

  it("the shock is always fully accounted for across the waterfall", () => {
    fc.assert(
      fc.property(arb, (inputs) => {
        const r = evaluateBudget(inputs);
        const absorbed = r.absorption.reduce((s, a) => s + a.amountPaise, 0);
        expect(absorbed).toBe(inputs.shockPaise);
      }),
    );
  });

  it("never draws more from a source than it holds", () => {
    fc.assert(
      fc.property(arb, (inputs) => {
        const r = evaluateBudget(inputs);
        for (const a of r.absorption) {
          if (a.source === "emergency_fund") {
            expect(a.amountPaise).toBeLessThanOrEqual(inputs.emergencyFundPaise);
          }
          if (a.source === "savings") {
            expect(a.amountPaise).toBeLessThanOrEqual(inputs.savingsPaise);
          }
        }
        expect(r.savingsSurvivingPaise).toBeGreaterThanOrEqual(0);
        expect(r.emergencyFundLeftPaise).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it("card interest is non-negative and zero exactly when there's no debt", () => {
    fc.assert(
      fc.property(arb, (inputs) => {
        const r = evaluateBudget(inputs);
        expect(r.cardInterestPaise).toBeGreaterThanOrEqual(0);
        expect(r.cardDebtPaise === 0).toBe(r.cardInterestPaise === 0);
      }),
    );
  });
});
