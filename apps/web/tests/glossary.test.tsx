import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { GlossaryTermView } from "@/components/lessons/glossary-view";
import { GLOSSARY, TERM_IDS, getTerm, termsByCategory } from "@/lib/glossary";

describe("glossary content contract", () => {
  it.each(TERM_IDS)("%s has complete HOW / WHY / misconception content", (id) => {
    const e = GLOSSARY[id];
    expect(e.term.length).toBeGreaterThan(1);
    expect(e.what.length).toBeGreaterThan(30);
    expect(e.how.length).toBeGreaterThan(80);
    expect(e.why.length).toBeGreaterThan(80);
    expect(e.misconception.claim.length).toBeGreaterThan(10);
    expect(e.misconception.truth.length).toBeGreaterThan(60);
    expect(e.searchQuery.length).toBeGreaterThan(5);
  });

  it.each(TERM_IDS)("%s computes a worked example with a takeaway", (id) => {
    const ex = GLOSSARY[id].example();
    expect(ex.setup.length).toBeGreaterThan(15);
    expect(ex.rows.length).toBeGreaterThanOrEqual(3);
    expect(ex.takeaway.length).toBeGreaterThan(30);
    for (const row of ex.rows) {
      expect(row.label.length).toBeGreaterThan(2);
      expect(String(row.value).length).toBeGreaterThan(0);
    }
    // At least one row is the point of the example.
    expect(ex.rows.some((r) => r.highlight)).toBe(true);
  });

  it.each(TERM_IDS)("%s links only to terms that exist", (id) => {
    for (const rid of GLOSSARY[id].related) {
      expect(TERM_IDS).toContain(rid);
      expect(rid).not.toBe(id); // no self-links
    }
  });

  it("every category bucket is populated and covers all terms", () => {
    const groups = termsByCategory();
    expect(groups).toHaveLength(4);
    const total = groups.reduce((n, g) => n + g.ids.length, 0);
    expect(total).toBe(TERM_IDS.length);
    for (const g of groups) expect(g.ids.length).toBeGreaterThan(0);
  });

  it("getTerm resolves known slugs and rejects unknown ones", () => {
    expect(getTerm("sip")?.term).toBe("SIP");
    expect(getTerm("not-a-term")).toBeUndefined();
  });
});

describe("worked examples use the real engine", () => {
  it("SIP example matches the documented ₹6L in → ~₹11.6L out", () => {
    const rows = GLOSSARY.sip.example().rows;
    expect(rows[0]!.value).toBe("₹6,00,000");
    expect(rows[1]!.value).toBe("₹11,61,695"); // computed by finance-core
  });

  it("EMI example shows the tenure trap: longer tenure, far more interest", () => {
    const rows = GLOSSARY.emi.example().rows;
    // ₹10L @10%: 84mo EMI ₹16,601 vs 240mo EMI ₹9,650 (engine-computed)
    expect(rows[0]!.value).toBe("₹16,601/mo");
    expect(rows[2]!.value).toBe("₹9,650/mo");
    // Interest more than triples: ₹3,94,499 → ₹13,16,053.
    const short = Number(rows[1]!.value.replace(/[^\d]/g, ""));
    const long = Number(rows[3]!.value.replace(/[^\d]/g, ""));
    expect(long).toBeGreaterThan(short * 3);
  });

  it("inflation example matches ₹1,000 → ~₹558 buying power at 6% over 10y", () => {
    const rows = GLOSSARY.inflation.example().rows;
    expect(rows[0]!.value).toBe("₹558");
    expect(rows[1]!.value).toBe("₹1,791");
  });
});

describe("GlossaryTermView", () => {
  it("renders every section for a term", () => {
    render(<GlossaryTermView id="sip" />);
    expect(screen.getByRole("heading", { level: 1, name: "SIP" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A worked example" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Why it matters" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The common mistake" })).toBeInTheDocument();
    expect(screen.getByText(/₹11,61,695/)).toBeInTheDocument();
  });

  it("offers a see-it-live link into the simulator and related terms", () => {
    render(<GlossaryTermView id="emi" />);
    expect(screen.getByRole("link", { name: /See it live/ })).toHaveAttribute(
      "href",
      expect.stringContaining("/loans"),
    );
    expect(screen.getByRole("link", { name: "Tenure" })).toHaveAttribute(
      "href",
      "/learn/glossary/tenure",
    );
  });

  it("keeps the external search as a secondary link", () => {
    render(<GlossaryTermView id="npa" />);
    const google = screen.getByRole("link", { name: /Search the wider web/ });
    expect(google).toHaveAttribute("href", expect.stringContaining("google.com/search"));
    expect(google).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("has no axe violations", async () => {
    const { container } = render(<GlossaryTermView id="foir" />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
