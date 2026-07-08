/**
 * @banksim/finance-core — pure financial mathematics for BankSim AI.
 *
 * Invariants (enforced by tests, see docs/12-testing-strategy.md):
 * - No DOM, no React, no dependencies.
 * - All money values are integer paise; no floating-point rupee arithmetic.
 * - Every module ships golden-value tests verified against external sources.
 *
 * Modules land per the roadmap: savings/compound/inflation (M1),
 * loan/investments/goals (M2), credit-score & bank-game engines (M4).
 */
export const FINANCE_CORE_VERSION = "0.1.0";
