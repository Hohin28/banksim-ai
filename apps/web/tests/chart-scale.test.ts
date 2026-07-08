import { describe, expect, it } from "vitest";
import { niceTicks, scaleLinear, yearTicks } from "@/lib/chart-scale";

describe("niceTicks", () => {
  it("uses 1/2/5 steps and covers the max", () => {
    expect(niceTicks(97)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(1000)).toEqual([0, 200, 400, 600, 800, 1000]);
    expect(niceTicks(43)).toEqual([0, 10, 20, 30, 40, 50]);
  });

  it("always starts at 0 and ends at or above max", () => {
    for (const max of [1, 7, 12, 999, 1234567, 0.4]) {
      const ticks = niceTicks(max);
      expect(ticks[0]).toBe(0);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
    }
  });

  it("degrades safely for non-positive max", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(-5)).toEqual([0, 1]);
  });
});

describe("yearTicks", () => {
  it("keeps small ranges dense and thins large ones", () => {
    expect(yearTicks(5)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(yearTicks(40).length).toBeLessThanOrEqual(12);
    expect(yearTicks(40)[0]).toBe(0);
    expect(yearTicks(40).at(-1)).toBe(40);
  });

  it("always includes the final year even off-step", () => {
    const ticks = yearTicks(37);
    expect(ticks.at(-1)).toBe(37);
  });
});

describe("scaleLinear", () => {
  it("maps domain to range linearly", () => {
    const s = scaleLinear(0, 10, 0, 100);
    expect(s(0)).toBe(0);
    expect(s(5)).toBe(50);
    expect(s(10)).toBe(100);
  });

  it("handles inverted ranges (SVG y axis)", () => {
    const s = scaleLinear(0, 100, 200, 0);
    expect(s(0)).toBe(200);
    expect(s(100)).toBe(0);
  });

  it("is constant for a zero-width domain instead of dividing by zero", () => {
    const s = scaleLinear(5, 5, 0, 100);
    expect(s(5)).toBe(0);
  });
});
