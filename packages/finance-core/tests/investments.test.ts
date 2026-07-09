import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  compareInstruments,
  INSTRUMENTS,
  projectInstrument,
  type InvestmentInputs,
} from "../src/investments";

const base: InvestmentInputs = {
  monthlyPaise: 5000_00,
  lumpSumPaise: 0,
  years: 10,
  inflationPct: 6,
};

/**
 * GOLDEN VALUES — independent evaluation (node, 2026-07-09), annuity-due SIP:
 * ₹5,000/mo @12% for 10y = 116169538 paise; lump ₹1,00,000 @8% 10y = 22196402.
 */
describe("projectInstrument — golden values", () => {
  it("₹5,000/mo SIP at 12% for 10y ≈ ₹11,61,695", () => {
    const mutual = INSTRUMENTS.find((i) => i.id === "mutual")!;
    const p = projectInstrument({ ...mutual, avgReturnPct: 12, volatilityPct: 0 }, base);
    expect(Math.abs(p.expectedFinalPaise - 116169538)).toBeLessThanOrEqual(3);
  });

  it("0% return SIP is just the sum of contributions", () => {
    // Covers the r=0 annuity branch: a hypothetical no-growth instrument.
    const zero = { ...INSTRUMENTS.find((i) => i.id === "savings")!, avgReturnPct: 0, volatilityPct: 0 };
    const p = projectInstrument(zero, { monthlyPaise: 1000_00, lumpSumPaise: 0, years: 5, inflationPct: 0 });
    expect(p.expectedFinalPaise).toBe(1000_00 * 60);
  });

  it("lump ₹1,00,000 at 8% for 10y ≈ ₹2,21,964", () => {
    const fd = INSTRUMENTS.find((i) => i.id === "fd")!;
    const p = projectInstrument(
      { ...fd, avgReturnPct: 8, volatilityPct: 0 },
      { monthlyPaise: 0, lumpSumPaise: 100000_00, years: 10, inflationPct: 0 },
    );
    expect(Math.abs(p.expectedFinalPaise - 22196402)).toBeLessThanOrEqual(3);
  });
});

describe("projectInstrument — bands & flags", () => {
  it("high ≥ expected ≥ low at every point", () => {
    const stocks = INSTRUMENTS.find((i) => i.id === "stocks")!;
    const p = projectInstrument(stocks, base);
    for (const pt of p.points) {
      expect(pt.highPaise).toBeGreaterThanOrEqual(pt.expectedPaise);
      expect(pt.expectedPaise).toBeGreaterThanOrEqual(pt.lowPaise);
    }
  });

  it("fixed-return products have zero-width bands (volatility 0)", () => {
    const fd = INSTRUMENTS.find((i) => i.id === "fd")!;
    const p = projectInstrument(fd, base);
    for (const pt of p.points) {
      expect(pt.highPaise).toBe(pt.expectedPaise);
      expect(pt.lowPaise).toBe(pt.expectedPaise);
    }
  });

  it("beatsInflation reflects avg return vs inflation", () => {
    const savings = INSTRUMENTS.find((i) => i.id === "savings")!; // 3.5%
    const stocks = INSTRUMENTS.find((i) => i.id === "stocks")!; // 14%
    expect(projectInstrument(savings, base).beatsInflation).toBe(false); // 3.5 < 6
    expect(projectInstrument(stocks, base).beatsInflation).toBe(true); // 14 > 6
  });

  it("real final value is below nominal when inflation > 0", () => {
    const gold = INSTRUMENTS.find((i) => i.id === "gold")!;
    const p = projectInstrument(gold, base);
    expect(p.realFinalPaise).toBeLessThan(p.expectedFinalPaise);
  });
});

describe("compareInstruments", () => {
  it("projects each requested instrument", () => {
    const out = compareInstruments(["fd", "gold", "mutual"], base);
    expect(out.map((o) => o.instrument.id)).toEqual(["fd", "gold", "mutual"]);
  });

  it("riskier instruments have higher average returns in the defaults", () => {
    const [fd, stocks] = compareInstruments(["fd", "stocks"], base);
    expect(stocks!.instrument.avgReturnPct).toBeGreaterThan(fd!.instrument.avgReturnPct);
  });

  it("validates inputs", () => {
    expect(() => compareInstruments(["fd"], { ...base, monthlyPaise: 0, lumpSumPaise: 0 })).toThrow(RangeError);
    expect(() => compareInstruments(["fd"], { ...base, monthlyPaise: -1 })).toThrow(RangeError);
    expect(() => compareInstruments(["nope"], base)).toThrow(/unknown instrument/);
    expect(() => compareInstruments(["fd"], { ...base, years: 0 })).toThrow(RangeError);
  });
});

describe("investments — properties", () => {
  const arb = fc.record({
    monthlyPaise: fc.integer({ min: 0, max: 100000_00 }),
    lumpSumPaise: fc.integer({ min: 0, max: 10000000_00 }),
    years: fc.integer({ min: 1, max: 40 }),
    inflationPct: fc.integer({ min: 0, max: 12 }),
  });

  it("expected final value ≥ total invested for any positive-return instrument", () => {
    fc.assert(
      fc.property(arb, (inputs) => {
        if (inputs.monthlyPaise === 0 && inputs.lumpSumPaise === 0) return;
        const mutual = INSTRUMENTS.find((i) => i.id === "mutual")!;
        const p = projectInstrument(mutual, inputs);
        expect(p.expectedFinalPaise).toBeGreaterThanOrEqual(p.investedPaise);
      }),
    );
  });

  it("expected line is monotonically non-decreasing over time", () => {
    fc.assert(
      fc.property(arb, (inputs) => {
        if (inputs.monthlyPaise === 0 && inputs.lumpSumPaise === 0) return;
        const bonds = INSTRUMENTS.find((i) => i.id === "bonds")!;
        const p = projectInstrument(bonds, inputs);
        for (let i = 1; i < p.points.length; i++) {
          expect(p.points[i]!.expectedPaise).toBeGreaterThanOrEqual(p.points[i - 1]!.expectedPaise);
        }
      }),
    );
  });

  it("low band never goes negative", () => {
    fc.assert(
      fc.property(arb, (inputs) => {
        if (inputs.monthlyPaise === 0 && inputs.lumpSumPaise === 0) return;
        for (const inst of INSTRUMENTS) {
          for (const pt of projectInstrument(inst, inputs).points) {
            expect(pt.lowPaise).toBeGreaterThanOrEqual(0);
          }
        }
      }),
    );
  });
});
