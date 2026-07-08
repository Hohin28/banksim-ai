import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  futurePricePaise,
  inflationSeries,
  purchasingPowerPaise,
} from "../src/inflation";

describe("inflation — golden values", () => {
  it("₹1,000 @6% for 10y: costs ₹1,790.85, buys only ₹558.39 worth", () => {
    // Independently: 1.06^10 = 1.7908477 (textbook factor)
    expect(futurePricePaise(100_000, 6, 10)).toBe(179_085);
    expect(purchasingPowerPaise(100_000, 6, 10)).toBe(55_839);
  });

  it("₹15 samosa @8% doubles in ~9 years", () => {
    // 15 × 1.08^9 = 29.985 → ₹29.99
    expect(futurePricePaise(15_00, 8, 9)).toBe(29_99);
  });
});

describe("inflation — identities", () => {
  it("year 0 changes nothing", () => {
    expect(futurePricePaise(123_45, 7, 0)).toBe(123_45);
    expect(purchasingPowerPaise(123_45, 7, 0)).toBe(123_45);
  });

  it("0% inflation changes nothing across any horizon", () => {
    expect(futurePricePaise(123_45, 0, 30)).toBe(123_45);
    expect(purchasingPowerPaise(123_45, 0, 30)).toBe(123_45);
  });
});

describe("inflationSeries", () => {
  it("emits year 0..N and starts at identity", () => {
    const rows = inflationSeries(100_000, 6, 30);
    expect(rows).toHaveLength(31);
    expect(rows[0]).toEqual({ year: 0, powerPaise: 100_000, pricePaise: 100_000 });
    expect(rows[10]!.pricePaise).toBe(179_085);
  });
});

describe("inflation — validation", () => {
  it("rejects fractional paise and out-of-range inputs", () => {
    expect(() => futurePricePaise(10.5, 6, 10)).toThrow(RangeError);
    expect(() => purchasingPowerPaise(100, -1, 10)).toThrow(RangeError);
    expect(() => inflationSeries(100, 6, 61)).toThrow(RangeError);
  });
});

const arb = fc.record({
  amountPaise: fc.integer({ min: 0, max: 10_00_000_00 }),
  inflationPct: fc.integer({ min: 0, max: 12 }),
  years: fc.integer({ min: 0, max: 40 }),
});

describe("inflation — properties", () => {
  it("purchasing power never rises, prices never fall (inflation ≥ 0)", () => {
    fc.assert(
      fc.property(arb, ({ amountPaise, inflationPct, years }) => {
        expect(
          purchasingPowerPaise(amountPaise, inflationPct, years),
        ).toBeLessThanOrEqual(amountPaise);
        expect(
          futurePricePaise(amountPaise, inflationPct, years),
        ).toBeGreaterThanOrEqual(amountPaise);
      }),
    );
  });

  it("power and price are inverse within rounding tolerance", () => {
    fc.assert(
      fc.property(arb, ({ amountPaise, inflationPct, years }) => {
        const roundTrip = purchasingPowerPaise(
          futurePricePaise(amountPaise, inflationPct, years),
          inflationPct,
          years,
        );
        // Two roundings, each ≤ 0.5 paise, the second deflated: ≤ 1 paise apart.
        expect(Math.abs(roundTrip - amountPaise)).toBeLessThanOrEqual(1);
      }),
    );
  });

  it("series rows are monotonic: power falls, price rises", () => {
    fc.assert(
      fc.property(arb, ({ amountPaise, inflationPct, years }) => {
        const rows = inflationSeries(amountPaise, inflationPct, years);
        for (let i = 1; i < rows.length; i++) {
          expect(rows[i]!.powerPaise).toBeLessThanOrEqual(rows[i - 1]!.powerPaise);
          expect(rows[i]!.pricePaise).toBeGreaterThanOrEqual(rows[i - 1]!.pricePaise);
        }
      }),
    );
  });
});
