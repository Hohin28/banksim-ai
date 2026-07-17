import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import PredatoryLoanScenario from "@/app/scenarios/predatory-loan/page";
import BudgetScenario from "@/app/scenarios/budget-paycheck/page";

describe("Predatory loan scenario", () => {
  it("hides the reveal until an offer is locked in", async () => {
    const user = userEvent.setup();
    render(<PredatoryLoanScenario />);
    expect(screen.getByRole("button", { name: /pick an offer first/i })).toBeDisabled();
    expect(screen.queryByText(/The truth, side by side/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /QuickCash Finance/ }));
    await user.click(screen.getByRole("button", { name: /reveal the truth/i }));
    expect(screen.getByText(/The truth, side by side/)).toBeInTheDocument();
  });

  it("exposes the flat-rate offer as the trap with its true APR", async () => {
    const user = userEvent.setup();
    render(<PredatoryLoanScenario />);
    // Pick the trap on purpose.
    await user.click(screen.getByRole("button", { name: /QuickCash Finance/ }));
    await user.click(screen.getByRole("button", { name: /reveal the truth/i }));
    // The reveal calls out the flat-rate trap and its (much higher) true APR.
    expect(screen.getByText(/The trap:/)).toBeInTheDocument();
    expect(screen.getAllByText(/17\.9/).length).toBeGreaterThan(0);
    // Picking the trap is scored as the wrong (costlier) choice.
    expect(screen.getByText(/costs you .* more than the best offer/i)).toBeInTheDocument();
  });

  it("rewards picking the genuinely cheapest offer", async () => {
    const user = userEvent.setup();
    render(<PredatoryLoanScenario />);
    await user.click(screen.getByRole("button", { name: /Sterling Bank/ }));
    await user.click(screen.getByRole("button", { name: /reveal the truth/i }));
    expect(screen.getByText(/Sharp eye/)).toBeInTheDocument();
  });
});

describe("Budget scenario", () => {
  it("blocks the shock while over-allocated, then reveals the waterfall", async () => {
    const user = userEvent.setup();
    render(<BudgetScenario />);
    // Default budget (20k/12k/6k of 40k) leaves a ₹2k buffer → allowed.
    const advance = screen.getByRole("button", { name: /Advance to mid-month/i });
    expect(advance).toBeEnabled();
    await user.click(advance);
    expect(screen.getByText(/The shock waterfall/)).toBeInTheDocument();
  });

  it("shows the credit-card cascade when there's no buffer", async () => {
    const user = userEvent.setup();
    render(<BudgetScenario />);
    // Push savings up so needs+wants+savings = income → zero buffer, no fund.
    const savings = screen.getByRole("textbox", { name: /Savings.*exact value/i });
    await user.clear(savings);
    await user.type(savings, "8000{Enter}"); // 20k+12k+8k = 40k → buffer 0
    await user.click(screen.getByRole("button", { name: /Advance to mid-month/i }));
    // ₹9k shock, ₹8k savings → ₹1k onto the card.
    expect(screen.getByText(/becomes bigger/)).toBeInTheDocument();
    expect(screen.getByText(/After 6 months/)).toBeInTheDocument();
  });

  it("has no axe violations before the reveal", async () => {
    const { container } = render(<BudgetScenario />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
