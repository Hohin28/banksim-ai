import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Tabs } from "@/components/ui/tabs";

const items = [
  { id: "chart", label: "Chart", content: <p>chart content</p> },
  { id: "table", label: "Table", content: <p>table content</p> },
  { id: "yearly", label: "Year-by-year", content: <p>yearly content</p> },
];

describe("Tabs", () => {
  it("selects the first tab by default and hides other panels", () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole("tab", { name: "Chart" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("chart content")).toBeVisible();
    expect(screen.getByText("table content")).not.toBeVisible();
  });

  it("clicking a tab activates its panel", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    await user.click(screen.getByRole("tab", { name: "Table" }));
    expect(screen.getByRole("tab", { name: "Table" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("table content")).toBeVisible();
  });

  it("arrow keys move focus and selection together, wrapping", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    const chart = screen.getByRole("tab", { name: "Chart" });
    chart.focus();
    await user.keyboard("{ArrowRight}");
    const table = screen.getByRole("tab", { name: "Table" });
    expect(table).toHaveFocus();
    expect(table).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    // wrapped backwards from Chart to Year-by-year
    expect(
      screen.getByRole("tab", { name: "Year-by-year" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("Home/End jump to first/last tab", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    screen.getByRole("tab", { name: "Chart" }).focus();
    await user.keyboard("{End}");
    expect(
      screen.getByRole("tab", { name: "Year-by-year" }),
    ).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Chart" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("only the active tab is in the tab order (roving tabindex)", () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole("tab", { name: "Chart" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("tab", { name: "Table" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(<Tabs items={items} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
