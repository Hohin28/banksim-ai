import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  moneyValueText,
} from "@/lib/format";

describe("formatMoney", () => {
  it("groups digits Indian-style by default", () => {
    expect(formatMoney(1730850)).toBe("₹17,30,850");
    expect(formatMoney(1000)).toBe("₹1,000");
    expect(formatMoney(0)).toBe("₹0");
  });

  it("groups digits international-style when asked", () => {
    expect(formatMoney(1730850, "international")).toBe("₹1,730,850");
  });

  it("renders negatives with a minus sign", () => {
    expect(formatMoney(-50000)).toBe("−₹50,000");
  });

  it("rounds fractional rupees for display", () => {
    expect(formatMoney(999.6)).toBe("₹1,000");
  });
});

describe("formatMoneyCompact", () => {
  it("uses lakh and crore in Indian style", () => {
    expect(formatMoneyCompact(150000)).toBe("₹1.5L");
    expect(formatMoneyCompact(23000000)).toBe("₹2.3Cr");
    expect(formatMoneyCompact(12000)).toBe("₹12k");
    expect(formatMoneyCompact(950)).toBe("₹950");
  });

  it("uses K/M in international style", () => {
    expect(formatMoneyCompact(150000, "international")).toBe("₹150K");
    expect(formatMoneyCompact(23000000, "international")).toBe("₹23M");
  });

  it("drops the trailing .0", () => {
    expect(formatMoneyCompact(100000)).toBe("₹1L");
    expect(formatMoneyCompact(10000000)).toBe("₹1Cr");
  });
});

describe("formatPercent", () => {
  it("keeps up to two decimals without trailing zeros", () => {
    expect(formatPercent(7)).toBe("7%");
    expect(formatPercent(7.25)).toBe("7.25%");
    expect(formatPercent(7.1)).toBe("7.1%");
  });
});

describe("moneyValueText", () => {
  it("appends the unit for screen readers", () => {
    expect(moneyValueText(5000, "per month")).toBe("₹5,000 per month");
  });
});
