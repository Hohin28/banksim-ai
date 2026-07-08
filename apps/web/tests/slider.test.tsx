import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Slider } from "@/components/ui/slider";
import { formatMoney } from "@/lib/format";

/** Controlled harness mirroring real simulator usage. */
function Harness({ initial = 5000 }: { initial?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <Slider
      label="Monthly deposit"
      value={value}
      min={0}
      max={100000}
      step={500}
      onChange={setValue}
      formatValue={(v) => formatMoney(v)}
      valueText={(v) => `${formatMoney(v)} per month`}
    />
  );
}

describe("Slider", () => {
  it("exposes a labelled range input with spoken value text", () => {
    render(<Harness />);
    const range = screen.getByRole("slider", { name: "Monthly deposit" });
    expect(range).toHaveAttribute("aria-valuetext", "₹5,000 per month");
  });

  it("arrow key moves one step", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const range = screen.getByRole("slider", { name: "Monthly deposit" });
    range.focus();
    await user.keyboard("{ArrowRight}");
    expect(range).toHaveValue("5500");
  });

  it("Shift+arrow jumps ten steps and clamps at bounds", async () => {
    const user = userEvent.setup();
    render(<Harness initial={99000} />);
    const range = screen.getByRole("slider", { name: "Monthly deposit" });
    range.focus();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(range).toHaveValue("100000"); // clamped, not 104000
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(range).toHaveValue("95000");
  });

  it("paired input accepts a typed value on Enter and clamps it", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const exact = screen.getByRole("textbox", {
      name: "Monthly deposit (exact value)",
    });
    await user.clear(exact);
    await user.type(exact, "250000{Enter}");
    const range = screen.getByRole("slider", { name: "Monthly deposit" });
    expect(range).toHaveValue("100000"); // clamped to max
    expect(exact).toHaveValue("₹1,00,000");
  });

  it("paired input stays in sync when the range moves", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const range = screen.getByRole("slider", { name: "Monthly deposit" });
    range.focus();
    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("textbox", { name: "Monthly deposit (exact value)" }),
    ).toHaveValue("₹5,500");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Harness />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
