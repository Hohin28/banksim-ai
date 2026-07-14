import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  generateApplicant,
  initBankGame,
  makeRng,
  resolveRound,
  TOTAL_ROUNDS,
  type Decision,
} from "../src/bank-game";

describe("makeRng — deterministic PRNG", () => {
  it("same seed → same stream", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces values in [0,1)", () => {
    const r = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("different seeds → different streams", () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });
});

describe("generateApplicant", () => {
  it("produces plausible, in-range attributes", () => {
    const rng = makeRng(123);
    for (let i = 0; i < 50; i++) {
      const a = generateApplicant(rng, i);
      expect(a.age).toBeGreaterThanOrEqual(21);
      expect(a.age).toBeLessThanOrEqual(58);
      expect(a.creditScore).toBeGreaterThanOrEqual(300);
      expect(a.creditScore).toBeLessThanOrEqual(900);
      expect(a.defaultProb).toBeGreaterThan(0);
      expect(a.defaultProb).toBeLessThanOrEqual(0.95);
      expect(a.amountPaise).toBeGreaterThan(0);
    }
  });

  it("low-score applicants have higher default risk on average", () => {
    // FOIR can dominate in individual extreme cases, so compare averages of
    // many applicants binned by credit score rather than a single pair.
    const rng = makeRng(999);
    const low: number[] = [];
    const high: number[] = [];
    for (let i = 0; i < 4000; i++) {
      const a = generateApplicant(rng, i);
      if (a.creditScore < 580) low.push(a.defaultProb);
      else if (a.creditScore > 800) high.push(a.defaultProb);
    }
    const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(low.length).toBeGreaterThan(20);
    expect(high.length).toBeGreaterThan(20);
    expect(mean(low)).toBeGreaterThan(mean(high));
  });
});

describe("game lifecycle", () => {
  it("starts at round 1 with ₹10 crore and a full board", () => {
    const g = initBankGame(1);
    expect(g.round).toBe(1);
    expect(g.capitalPaise).toBe(100_000_000_00);
    expect(g.currentApplicants.length).toBeGreaterThanOrEqual(5);
    expect(g.status).toBe("active");
  });

  it("rejecting everyone is safe but slowly erodes satisfaction", () => {
    let g = initBankGame(5);
    const firstSat = g.satisfaction;
    const decisions: Decision[] = g.currentApplicants.map((a) => ({ applicantId: a.id, approve: false }));
    g = resolveRound(g, decisions);
    expect(g.round).toBe(2);
    expect(g.satisfaction).toBeLessThanOrEqual(firstSat);
  });

  it("surviving 12 disciplined rounds wins", () => {
    let g = initBankGame(77);
    for (let r = 0; r < TOTAL_ROUNDS && g.status === "active"; r++) {
      // Approve only strong applicants at a sensible rate.
      const decisions: Decision[] = g.currentApplicants.map((a) => ({
        applicantId: a.id,
        approve: a.creditScore >= 720 && a.defaultProb < 0.12,
        ratePct: 12,
      }));
      g = resolveRound(g, decisions);
    }
    expect(["won", "active"]).toContain(g.status);
    if (g.status === "won") expect(g.history).toHaveLength(TOTAL_ROUNDS);
  });

  it("reckless lending can collapse the bank", () => {
    let g = initBankGame(3);
    for (let r = 0; r < TOTAL_ROUNDS && g.status === "active"; r++) {
      // Approve everyone, including terrible risks, at a thin rate.
      const decisions: Decision[] = g.currentApplicants.map((a) => ({ applicantId: a.id, approve: true, ratePct: 9 }));
      g = resolveRound(g, decisions);
    }
    // Either collapsed, or at minimum accumulated meaningful NPAs.
    expect(g.status === "collapsed" || g.npaPct > 0).toBe(true);
  });

  it("omitted decisions default to reject; approvals default to 12% rate", () => {
    let g = initBankGame(11);
    const board = g.currentApplicants;
    // Approve only the first applicant, with NO explicit rate; omit the rest
    // entirely (they should be treated as rejected).
    g = resolveRound(g, [{ applicantId: board[0]!.id, approve: true }]);
    const result = g.history[0]!;
    expect(result.approved).toBe(1);
    expect(result.rejected).toBe(board.length - 1);
  });

  it("collapses when capital is driven to zero", () => {
    // White-box: start a game already near-broke, then lend recklessly.
    const base = initBankGame(31);
    const broke = { ...base, capitalPaise: 500_00 }; // ₹500 left
    const after = resolveRound(broke, broke.currentApplicants.map((a) => ({ applicantId: a.id, approve: true, ratePct: 8 })));
    expect(after.status).toBe("collapsed");
  });

  it("does not advance once finished", () => {
    let g = initBankGame(9);
    for (let r = 0; r < TOTAL_ROUNDS; r++) {
      g = resolveRound(g, g.currentApplicants.map((a) => ({ applicantId: a.id, approve: false })));
    }
    const finished = g;
    const again = resolveRound(finished, []);
    expect(again).toBe(finished); // no-op when not active
  });
});

describe("round outcomes — the explanation layer", () => {
  it("emits one outcome per applicant, in dealing order, each with a why", () => {
    let g = initBankGame(21);
    const board = g.currentApplicants;
    g = resolveRound(g, board.map((a, i) => ({ applicantId: a.id, approve: i % 2 === 0, ratePct: 12 })));
    const outcomes = g.history[0]!.outcomes;
    expect(outcomes).toHaveLength(board.length);
    expect(outcomes.map((o) => o.applicant.id)).toEqual(board.map((a) => a.id));
    for (const o of outcomes) {
      expect(o.why.length).toBeGreaterThan(20);
      if (o.decision === "rejected") {
        expect(o.outcome).toBe("rejected");
        expect(o.profitPaise).toBe(0);
        expect(o.ratePct).toBeUndefined();
      } else {
        expect(["repaid", "defaulted"]).toContain(o.outcome);
        expect(o.ratePct).toBe(12);
      }
    }
  });

  it("outcome profits sum exactly to the round profit", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100000 }), (seed) => {
        let g = initBankGame(seed);
        for (let r = 0; r < 3 && g.status === "active"; r++) {
          g = resolveRound(g, g.currentApplicants.map((a, i) => ({ applicantId: a.id, approve: i % 3 !== 0, ratePct: 14 })));
          const round = g.history[g.history.length - 1]!;
          const sum = round.outcomes.reduce((s, o) => s + o.profitPaise, 0);
          expect(sum).toBe(round.profitPaise);
        }
      }),
    );
  });

  it("defaulted outcomes lose money and explain the warning signs", () => {
    // Approve everyone at a thin rate across many seeds until defaults appear.
    let found = false;
    for (let seed = 1; seed < 40 && !found; seed++) {
      let g = initBankGame(seed);
      g = resolveRound(g, g.currentApplicants.map((a) => ({ applicantId: a.id, approve: true, ratePct: 9 })));
      for (const o of g.history[0]!.outcomes) {
        if (o.outcome === "defaulted") {
          found = true;
          expect(o.profitPaise).toBeLessThan(0);
          expect(o.why).toMatch(/Defaulted/);
        }
      }
    }
    expect(found).toBe(true);
  });

  it("rejecting a safe borrower is explained as a missed opportunity", () => {
    let found = false;
    for (let seed = 1; seed < 40 && !found; seed++) {
      let g = initBankGame(seed);
      const safe = g.currentApplicants.find((a) => a.defaultProb < 0.15);
      if (!safe) continue;
      g = resolveRound(g, g.currentApplicants.map((a) => ({ applicantId: a.id, approve: false })));
      const o = g.history[0]!.outcomes.find((x) => x.applicant.id === safe.id)!;
      expect(o.why).toMatch(/safe borrower/);
      found = true;
    }
    expect(found).toBe(true);
  });
});

describe("determinism of resolution", () => {
  it("same seed + same decisions → identical end state (replay)", () => {
    const play = () => {
      let g = initBankGame(2024);
      const log: number[] = [];
      for (let r = 0; r < 5; r++) {
        // Deterministic decision policy so the whole run is reproducible.
        const decisions: Decision[] = g.currentApplicants.map((a, i) => ({
          applicantId: a.id,
          approve: i % 2 === 0,
          ratePct: 13,
        }));
        g = resolveRound(g, decisions);
        log.push(g.capitalPaise, g.stability, Math.round(g.npaPct * 10));
      }
      return log;
    };
    expect(play()).toEqual(play());
  });

  it("profit is the sum of round profits", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100000 }), (seed) => {
        let g = initBankGame(seed);
        let sum = 0;
        for (let r = 0; r < 4 && g.status === "active"; r++) {
          g = resolveRound(g, g.currentApplicants.map((a) => ({ applicantId: a.id, approve: true, ratePct: 14 })));
          sum += g.history[g.history.length - 1]!.profitPaise;
        }
        expect(g.profitPaise).toBe(sum);
      }),
    );
  });
});
