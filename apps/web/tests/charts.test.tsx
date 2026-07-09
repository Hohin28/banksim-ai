import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { DonutSplit } from "@/components/charts/donut-split";
import { Gauge } from "@/components/charts/gauge";
import { ChartTable } from "@/components/charts/chart-table";
import { formatMoney } from "@/lib/format";

describe("DonutSplit", () => {
  const slices = [
    { id: "p", label: "Principal", value: 500000, colorVar: "--series-1" },
    { id: "i", label: "Interest", value: 275000, colorVar: "--series-6" },
  ];

  it("labels every slice with its value (identity never color-alone)", () => {
    render(
      <DonutSplit
        slices={slices}
        centerLabel="You repay"
        centerValue={formatMoney(775000)}
        format={(x) => formatMoney(x)}
      />,
    );
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("Interest")).toBeInTheDocument();
    // percentage of total shown
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
  });

  it("exposes an image role summarising the split", () => {
    render(
      <DonutSplit
        slices={slices}
        centerLabel="You repay"
        centerValue={formatMoney(775000)}
        format={(x) => formatMoney(x)}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("aria-label", expect.stringContaining("Principal"));
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <DonutSplit slices={slices} centerLabel="You repay" centerValue="₹7,75,000" format={(x) => formatMoney(x)} />,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe("Gauge", () => {
  const bands = [
    { upTo: 30, colorVar: "--status-good", label: "comfortable" },
    { upTo: 45, colorVar: "--status-warning", label: "stretched" },
    { upTo: 80, colorVar: "--status-critical", label: "risky" },
  ];

  it("shows the numeric value as text, not color alone", () => {
    render(<Gauge value={38} min={0} max={80} bands={bands} valueText="38%" markerLabel="of income" caption="FOIR" />);
    expect(screen.getByText("38%")).toBeInTheDocument();
    expect(screen.getByText("of income")).toBeInTheDocument();
  });

  it("clamps the needle within range without erroring", () => {
    render(<Gauge value={200} min={0} max={80} bands={bands} valueText="200%" caption="FOIR" />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", expect.stringContaining("200%"));
  });

  it("has no axe violations", async () => {
    const { container } = render(<Gauge value={38} min={0} max={80} bands={bands} valueText="38%" caption="FOIR" />);
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe("ChartTable", () => {
  it("renders the caption and every row", () => {
    render(
      <ChartTable
        caption="Yearly split"
        columns={[
          { key: "year", label: "Year", format: (r: { year: number; amt: number }) => String(r.year) },
          { key: "amt", label: "Amount", align: "right", format: (r) => formatMoney(r.amt) },
        ]}
        rows={[
          { year: 1, amt: 1000 },
          { year: 2, amt: 2000 },
        ]}
      />,
    );
    expect(screen.getByText("Yearly split")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Year" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "₹2,000" })).toBeInTheDocument();
  });
});
