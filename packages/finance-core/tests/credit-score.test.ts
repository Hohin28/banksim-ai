import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  applyAction,
  computeFactors,
  currentScore,
  FACTOR_WEIGHTS,
  initCreditState,
  reduceCredit,
  scoreFromFactors,
  type CreditAction,
  type CreditState,
} from "../src/credit-score";

describe("credit model — invariants", () => {
  it("factor weights sum to 1", () => {
    const sum = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("scores always land in the CIBIL 300–900 range", () => {
    const factorArb = fc.record({
      payment: fc.integer({ min: 0, max: 100 }),
      utilisation: fc.integer({ min: 0, max: 100 }),
      age: fc.integer({ min: 0, max: 100 }),
      mix: fc.integer({ min: 0, max: 100 }),
      inquiries: fc.integer({ min: 0, max: 100 }),
    });
    fc.assert(
      fc.property(factorArb, (f) => {
        const s = scoreFromFactors(f);
        expect(s).toBeGreaterThanOrEqual(300);
        expect(s).toBeLessThanOrEqual(900);
      }),
    );
  });

  it("perfect factors → 900, zero factors → 300", () => {
    expect(scoreFromFactors({ payment: 100, utilisation: 100, age: 100, mix: 100, inquiries: 100 })).toBe(900);
    expect(scoreFromFactors({ payment: 0, utilisation: 0, age: 0, mix: 0, inquiries: 0 })).toBe(300);
  });
});

describe("starting profiles", () => {
  it("rank as expected: new < building < established", () => {
    const s = (p: Parameters<typeof initCreditState>[0]) => currentScore(initCreditState(p));
    expect(s("new")).toBeLessThan(s("building"));
    expect(s("building")).toBeLessThan(s("established"));
  });

  it("established profile is a strong score (>= 780)", () => {
    expect(currentScore(initCreditState("established"))).toBeGreaterThanOrEqual(780);
  });
});

describe("actions move the score the right way", () => {
  const start = initCreditState("building");

  it("missing an EMI drops the score sharply", () => {
    const { state, event } = applyAction(start, { type: "MISS_EMI" });
    expect(event.delta).toBeLessThan(0);
    expect(currentScore(state)).toBeLessThan(currentScore(start));
    expect(event.label).toMatch(/missed/i);
  });

  it("maxing out the card lowers, paying it down raises", () => {
    const maxed = reduceCredit(start, { type: "MAX_OUT_CARD" });
    const paid = reduceCredit(start, { type: "PAY_DOWN_CARD" });
    expect(currentScore(maxed)).toBeLessThan(currentScore(start));
    expect(currentScore(paid)).toBeGreaterThan(currentScore(start));
  });

  it("opening an account adds an inquiry (small dip) but improves mix", () => {
    const newProfile = initCreditState("new"); // mix starts low
    const opened = reduceCredit(newProfile, { type: "OPEN_ACCOUNT" });
    const f0 = computeFactors(newProfile);
    const f1 = computeFactors(opened);
    expect(f1.mix).toBeGreaterThan(f0.mix);
    expect(f1.inquiries).toBeLessThan(f0.inquiries);
  });

  it("closing the oldest account shortens history", () => {
    const closed = reduceCredit(start, { type: "CLOSE_OLDEST" });
    expect(closed.historyMonths).toBeLessThan(start.historyMonths);
  });

  it("a missed payment recovers as time passes", () => {
    const missed = reduceCredit(start, { type: "MISS_EMI" });
    const scoreRightAfter = currentScore(missed);
    let aged = missed;
    for (let i = 0; i < 10; i++) aged = reduceCredit(aged, { type: "ADVANCE_MONTHS", months: 3 });
    expect(currentScore(aged)).toBeGreaterThan(scoreRightAfter);
  });
});

describe("applyAction — timeline events", () => {
  it("ADVANCE_MONTHS defaults to 3 months and labels the event", () => {
    const start = initCreditState("building");
    const { state, event } = applyAction(start, { type: "ADVANCE_MONTHS" });
    expect(state.simMonths).toBe(3);
    expect(event.label).toBe("3 months passed");
  });

  it("ADVANCE_MONTHS honours an explicit month count", () => {
    const start = initCreditState("building");
    const { state, event } = applyAction(start, { type: "ADVANCE_MONTHS", months: 6 });
    expect(state.simMonths).toBe(6);
    expect(event.label).toBe("6 months passed");
  });

  it("a non-time action carries its human-readable label and score", () => {
    const start = initCreditState("building");
    const { event } = applyAction(start, { type: "PAY_ON_TIME" });
    expect(event.label).toBe("Paid EMI on time");
    expect(event.scoreAfter).toBeGreaterThanOrEqual(300);
  });
});

describe("reduceCredit — ADVANCE_MONTHS default", () => {
  it("advances 3 months when none given", () => {
    const s = reduceCredit(initCreditState("new"), { type: "ADVANCE_MONTHS" });
    expect(s.simMonths).toBe(3);
    expect(s.historyMonths).toBe(initCreditState("new").historyMonths + 3);
  });
});

describe("determinism", () => {
  it("the same action sequence always yields the same score", () => {
    const actions: CreditAction[] = [
      { type: "MISS_EMI" },
      { type: "ADVANCE_MONTHS", months: 6 },
      { type: "PAY_DOWN_CARD" },
      { type: "OPEN_ACCOUNT" },
      { type: "PAY_ON_TIME" },
    ];
    const run = () => {
      let s = initCreditState("building");
      for (const a of actions) s = reduceCredit(s, a);
      return currentScore(s);
    };
    expect(run()).toBe(run());
  });

  it("currentScore never leaves 300–900 under random action walks", () => {
    const actionArb = fc.constantFrom<CreditAction>(
      { type: "PAY_ON_TIME" },
      { type: "MISS_EMI" },
      { type: "MAX_OUT_CARD" },
      { type: "PAY_DOWN_CARD" },
      { type: "OPEN_ACCOUNT" },
      { type: "CLOSE_OLDEST" },
      { type: "ADVANCE_MONTHS", months: 3 },
    );
    fc.assert(
      fc.property(fc.array(actionArb, { maxLength: 40 }), (actions) => {
        let s: CreditState = initCreditState("new");
        for (const a of actions) {
          s = reduceCredit(s, a);
          const score = currentScore(s);
          expect(score).toBeGreaterThanOrEqual(300);
          expect(score).toBeLessThanOrEqual(900);
        }
      }),
    );
  });
});
