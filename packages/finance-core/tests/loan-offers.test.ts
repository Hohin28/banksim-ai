import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  effectiveAprPct,
  evaluateOffer,
  evaluateOffers,
  flatRateEmiPaise,
  type LoanOffer,
} from "../src/loan-offers";
import { monthlyEmiPaise } from "../src/loan";

const L = 100000_00; // ₹1,00,000 in paise

describe("flatRateEmiPaise", () => {
  it("golden: ₹1L at 10% flat over 36 months → ₹3,611.11/mo", () => {
    // interest = 1L × 10% × 3y = 30,000; total 1,30,000 ÷ 36 = 3,611.11
    expect(flatRateEmiPaise(L, 10, 36)).toBe(361111);
  });
});

describe("effectiveAprPct — the flat-rate reveal", () => {
  it('exposes "10% flat" as ~17.9% reducing-balance', () => {
    const emi = flatRateEmiPaise(L, 10, 36);
    const apr = effectiveAprPct(L, emi, 36);
    expect(apr).toBeGreaterThan(17.5);
    expect(apr).toBeLessThan(18.5);
  });

  it("a genuine reducing-balance loan round-trips to its own rate", () => {
    // Feed a reducing-balance EMI back in → recover ~the same rate.
    const emi = monthlyEmiPaise(L, 12, 24);
    expect(effectiveAprPct(L, emi, 24)).toBeCloseTo(12, 1);
  });

  it("a processing fee pushes the effective rate higher", () => {
    const emi = flatRateEmiPaise(L, 10, 36);
    const noFee = effectiveAprPct(L, emi, 36);
    const withFee = effectiveAprPct(L - 2000_00, emi, 36); // 2% fee
    expect(withFee).toBeGreaterThan(noFee);
    expect(withFee).toBeGreaterThan(19);
  });

  it("rejects non-positive inputs", () => {
    expect(() => effectiveAprPct(0, 100, 12)).toThrow(RangeError);
    expect(() => effectiveAprPct(100, 0, 12)).toThrow(RangeError);
  });
});

const OFFERS: LoanOffer[] = [
  { id: "a", lender: "Honest Bank", principalPaise: L, quoting: "reducing", advertisedRatePct: 8.5, processingFeePct: 2, months: 36 },
  { id: "b", lender: "EasyFinance", principalPaise: L, quoting: "flat", advertisedRatePct: 10, processingFeePct: 0, months: 36 },
  { id: "c", lender: "LowEMI Co", principalPaise: L, quoting: "reducing", advertisedRatePct: 9, processingFeePct: 1, months: 60 },
];

describe("evaluateOffer — golden true costs", () => {
  it("Honest 8.5% reducing + 2% fee is genuinely cheapest (~₹15,643)", () => {
    const r = evaluateOffer(OFFERS[0]!);
    expect(r.trueCostPaise).toBeCloseTo(1564300, -3);
    expect(r.effectiveAprPct).toBeCloseTo(9.88, 1);
  });

  it("the 10%-flat offer really costs ~₹30,000 — the trap", () => {
    const r = evaluateOffer(OFFERS[1]!);
    expect(r.trueCostPaise).toBeCloseTo(2999996, -3);
    expect(r.effectiveAprPct).toBeGreaterThan(17.5);
    // Its advertised 10% hides ~8 points of real cost.
    expect(r.hiddenSpreadPct).toBeGreaterThan(7);
  });

  it("net disbursed subtracts the processing fee", () => {
    const r = evaluateOffer(OFFERS[0]!);
    expect(r.feePaise).toBe(2000_00);
    expect(r.netDisbursedPaise).toBe(L - 2000_00);
  });

  it("validates each field of an offer", () => {
    const ok = OFFERS[0]!;
    expect(() => evaluateOffer({ ...ok, principalPaise: 0 })).toThrow(RangeError);
    expect(() => evaluateOffer({ ...ok, advertisedRatePct: -1 })).toThrow(RangeError);
    expect(() => evaluateOffer({ ...ok, advertisedRatePct: 101 })).toThrow(RangeError);
    expect(() => evaluateOffer({ ...ok, processingFeePct: 25 })).toThrow(RangeError);
    expect(() => evaluateOffer({ ...ok, months: 0 })).toThrow(RangeError);
    expect(() => evaluateOffer({ ...ok, months: 601 })).toThrow(RangeError);
  });
});

describe("evaluateOffers — spotting the trap", () => {
  it("flags the lowest-advertised offer that isn't actually cheapest", () => {
    const evaln = evaluateOffers(OFFERS);
    expect(evaln.cheapestId).toBe("a"); // honest 8.5%
    expect(evaln.trapId).toBe("b"); // 10% flat looks mid but costs most
  });

  it("no trap when the lowest advertised rate is also the true cheapest", () => {
    const honest: LoanOffer[] = [
      { id: "x", lender: "A", principalPaise: L, quoting: "reducing", advertisedRatePct: 9, processingFeePct: 0, months: 36 },
      { id: "y", lender: "B", principalPaise: L, quoting: "reducing", advertisedRatePct: 12, processingFeePct: 0, months: 36 },
    ];
    const evaln = evaluateOffers(honest);
    expect(evaln.cheapestId).toBe("x");
    expect(evaln.trapId).toBeNull();
  });

  it("finds the cheapest even when it's dealt last", () => {
    // Reversed order so the true-cheapest offer is not the reduce seed.
    const evaln = evaluateOffers([OFFERS[1]!, OFFERS[2]!, OFFERS[0]!]);
    expect(evaln.cheapestId).toBe("a");
  });

  it("requires at least two offers", () => {
    expect(() => evaluateOffers([OFFERS[0]!])).toThrow(RangeError);
  });
});

describe("loan-offers — properties", () => {
  const offerArb = fc.record({
    principalPaise: fc.integer({ min: 10000_00, max: 5000000_00 }),
    quoting: fc.constantFrom("reducing" as const, "flat" as const),
    advertisedRatePct: fc.integer({ min: 0, max: 100 }).map((x) => x / 4), // 0–25
    processingFeePct: fc.integer({ min: 0, max: 40 }).map((x) => x / 10), // 0–4
    months: fc.integer({ min: 6, max: 240 }),
  });

  it("true cost is always positive and effective APR ≥ advertised for flat/fee loans", () => {
    fc.assert(
      fc.property(offerArb, (o) => {
        const r = evaluateOffer({ id: "p", lender: "L", ...o });
        expect(r.trueCostPaise).toBeGreaterThan(0);
        // Flat quoting or any fee can only raise the real rate above the sticker.
        if (o.quoting === "flat" && o.advertisedRatePct > 0) {
          expect(r.effectiveAprPct).toBeGreaterThan(o.advertisedRatePct);
        }
      }),
    );
  });

  it("total repaid = EMI × months = net disbursed + true cost", () => {
    fc.assert(
      fc.property(offerArb, (o) => {
        const r = evaluateOffer({ id: "p", lender: "L", ...o });
        expect(r.totalRepaidPaise).toBe(r.emiPaise * o.months);
        expect(r.netDisbursedPaise + r.trueCostPaise).toBe(r.totalRepaidPaise);
      }),
    );
  });
});
