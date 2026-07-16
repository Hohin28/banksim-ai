import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Term, TermStrip } from "@/components/ui/term";

describe("Term", () => {
  it("renders the term and opens the explainer dialog on click", async () => {
    const user = userEvent.setup();
    render(<Term id="sip" />);
    const chip = screen.getByRole("button", { name: "SIP" });
    expect(chip).toHaveAttribute("aria-haspopup", "dialog");
    await user.click(chip);
    expect(screen.getByText(/Systematic Investment Plan/)).toBeInTheDocument();
    expect(screen.getByText(/Why it matters:/)).toBeInTheDocument();
  });

  it("links to the full explainer, the live simulator, and a Google search", async () => {
    const user = userEvent.setup();
    render(<Term id="emi" />);
    await user.click(screen.getByRole("button", { name: "EMI" }));
    // Primary action is now the in-app explainer page.
    expect(screen.getByRole("link", { name: /Read the full explainer/i })).toHaveAttribute(
      "href",
      "/learn/glossary/emi",
    );
    // "See it live" now carries the worked example's numbers into the sim.
    const tryIt = screen.getByRole("link", { name: /Loan Simulator/i });
    expect(tryIt).toHaveAttribute("href", expect.stringContaining("/loans?"));
    const google = screen.getByRole("link", { name: /Read more on Google/i });
    expect(google).toHaveAttribute(
      "href",
      expect.stringContaining("https://www.google.com/search?q="),
    );
    expect(google).toHaveAttribute("target", "_blank");
    expect(google).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("can wrap custom children text", async () => {
    render(<Term id="inflation">rising prices</Term>);
    expect(screen.getByRole("button", { name: "rising prices" })).toBeInTheDocument();
  });
});

describe("TermStrip", () => {
  it("renders a chip per term and opens the right dialog", async () => {
    const user = userEvent.setup();
    render(<TermStrip ids={["npa", "foir"]} />);
    expect(screen.getByRole("button", { name: "NPA ?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "FOIR / DTI ?" }));
    expect(screen.getByText(/Fixed Obligation to Income Ratio/)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<TermStrip ids={["sip", "inflation", "npa"]} />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
