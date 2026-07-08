import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  assertPaise,
  paiseToRupees,
  roundPaise,
  rupeesToPaise,
} from "../src/money";

describe("roundPaise — half away from zero", () => {
  it("rounds exact halves away from zero in both directions", () => {
    expect(roundPaise(2.5)).toBe(3);
    expect(roundPaise(-2.5)).toBe(-3);
    expect(roundPaise(0.5)).toBe(1);
    expect(roundPaise(-0.5)).toBe(-1);
  });

  it("rounds below-half toward zero", () => {
    expect(roundPaise(2.4)).toBe(2);
    expect(roundPaise(-2.4)).toBe(-2);
    expect(roundPaise(0)).toBe(0);
  });

  it("property: result is an integer within 0.5 of the input", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e12, max: 1e12, noNaN: true }),
        (x) => {
          const r = roundPaise(x);
          expect(Number.isInteger(r)).toBe(true);
          expect(Math.abs(r - x)).toBeLessThanOrEqual(0.5);
        },
      ),
    );
  });
});

describe("rupees ⇄ paise", () => {
  it("converts with rounding", () => {
    expect(rupeesToPaise(1234.567)).toBe(123457);
    expect(rupeesToPaise(0.005)).toBe(1);
    expect(paiseToRupees(123457)).toBeCloseTo(1234.57, 10);
  });
});

describe("assertPaise", () => {
  it("accepts safe integers", () => {
    expect(() => assertPaise(0)).not.toThrow();
    expect(() => assertPaise(123456789)).not.toThrow();
  });

  it("rejects fractions and unsafe magnitudes", () => {
    expect(() => assertPaise(1.5)).toThrow(RangeError);
    expect(() => assertPaise(2 ** 53)).toThrow(RangeError);
    expect(() => assertPaise(Number.NaN, "value")).toThrow(/value/);
  });
});
