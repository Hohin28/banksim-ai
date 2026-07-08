import { describe, expect, it } from "vitest";
import { buildSearch, parseParams, type ParamSpec } from "@/lib/url-state";

const SPECS = {
  monthly: { kind: "int", def: 5000, min: 0, max: 100000 },
  rate: { kind: "float", def: 7, min: 0, max: 15 },
  comp: {
    kind: "enum",
    def: "quarterly",
    options: ["yearly", "quarterly", "monthly"],
  },
} satisfies Record<string, ParamSpec>;

describe("parseParams", () => {
  it("returns defaults for an empty query", () => {
    expect(parseParams(SPECS, new URLSearchParams(""))).toEqual({
      monthly: 5000,
      rate: 7,
      comp: "quarterly",
    });
  });

  it("reads valid values", () => {
    const v = parseParams(
      SPECS,
      new URLSearchParams("monthly=2500&rate=8.5&comp=monthly"),
    );
    expect(v).toEqual({ monthly: 2500, rate: 8.5, comp: "monthly" });
  });

  it("clamps out-of-range numbers instead of erroring", () => {
    const v = parseParams(
      SPECS,
      new URLSearchParams("monthly=999999999&rate=-3"),
    );
    expect(v.monthly).toBe(100000);
    expect(v.rate).toBe(0);
  });

  it("rounds int params and rejects junk", () => {
    const v = parseParams(
      SPECS,
      new URLSearchParams("monthly=2500.7&rate=abc&comp=hack"),
    );
    expect(v.monthly).toBe(2501);
    expect(v.rate).toBe(7); // junk → default
    expect(v.comp).toBe("quarterly"); // unknown enum → default
  });
});

describe("buildSearch", () => {
  it("omits defaults so links stay short", () => {
    expect(buildSearch(SPECS, { monthly: 5000, rate: 7, comp: "quarterly" })).toBe("");
  });

  it("serializes only the changed values", () => {
    expect(
      buildSearch(SPECS, { monthly: 2500, rate: 7, comp: "monthly" }),
    ).toBe("?monthly=2500&comp=monthly");
  });

  it("round-trips through parseParams", () => {
    const values = { monthly: 12000, rate: 9.25, comp: "yearly" };
    const qs = buildSearch(SPECS, values);
    expect(parseParams(SPECS, new URLSearchParams(qs))).toEqual(values);
  });
});
