import { describe, expect, it } from "vitest";
import { FINANCE_CORE_VERSION } from "../src/index";

describe("finance-core package", () => {
  it("exports a semver version string", () => {
    expect(FINANCE_CORE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
