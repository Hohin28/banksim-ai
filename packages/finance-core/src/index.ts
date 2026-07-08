/**
 * @banksim/finance-core — pure financial mathematics for BankSim AI.
 *
 * Invariants (enforced by tests, see docs/12-testing-strategy.md):
 * - No DOM, no React, no dependencies.
 * - All money values are integer paise; no floating-point rupee arithmetic
 *   at API boundaries. Rounding: half away from zero (see money.ts).
 * - Every module ships golden-value tests verified against external sources.
 *
 * Modules land per the roadmap: savings/compound/inflation (M1),
 * loan/investments/goals (M2), credit-score & bank-game engines (M4).
 */
export const FINANCE_CORE_VERSION = "0.2.0";

export * from "./money";
export * from "./rates";
export * from "./savings";
export * from "./compound";
export * from "./inflation";
