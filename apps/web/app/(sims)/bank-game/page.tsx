"use client";

import {
  initBankGame,
  paiseToRupees,
  resolveRound,
  TOTAL_ROUNDS,
  type Applicant,
  type BankGameState,
  type Decision,
} from "@banksim/finance-core";
import { ExplainerPanel } from "@/components/simulator/explainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectInput } from "@/components/ui/select";
import { formatMoneyCompact } from "@/lib/format";
import { useLocalState } from "@/lib/use-local-state";
import { useState } from "react";

type PendingDecision = { approve: boolean; ratePct: number };

const EMPLOYMENT_LABEL: Record<string, string> = {
  salaried: "Salaried",
  "self-employed": "Self-employed",
  student: "Student",
};

function newSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

// Deterministic first game (same for server and client render, so no hydration
// mismatch and every new player shares an identical opening board). "Play
// again" switches to a random seed.
const INITIAL_GAME = initBankGame(1);

export default function BankGamePage() {
  const [game, setGame] = useLocalState<BankGameState>(
    "banksim.bank-game",
    INITIAL_GAME,
  );
  const [decisions, setDecisions] = useState<Record<string, PendingDecision>>({});

  const setDecision = (id: string, patch: Partial<PendingDecision>) =>
    setDecisions((d) => {
      const base: PendingDecision = d[id] ?? { approve: false, ratePct: 12 };
      return { ...d, [id]: { ...base, ...patch } };
    });

  const endRound = () => {
    const payload: Decision[] = game.currentApplicants.map((a) => {
      const d = decisions[a.id];
      return { applicantId: a.id, approve: d?.approve ?? false, ratePct: d?.ratePct ?? 12 };
    });
    setGame((g) => resolveRound(g, payload));
    setDecisions({});
  };

  const startNew = () => {
    setGame(initBankGame(newSeed()));
    setDecisions({});
  };

  if (game.status !== "active") {
    return <GameOver game={game} onRestart={startNew} />;
  }

  const approvedCount = game.currentApplicants.filter((a) => decisions[a.id]?.approve).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 max-sm:px-4">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-semibold">Bank Manager</h1>
        <Badge variant="brand">simulation</Badge>
      </div>

      <ScoreBoard game={game} />

      <div className="my-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Round {game.round} of {TOTAL_ROUNDS}</h2>
          <p className="text-sm text-ink-2">
            Approve loans to earn interest — but every approval risks a default. Reject good customers and satisfaction falls.
          </p>
        </div>
        <Button onClick={endRound}>
          End round ({approvedCount} approved) →
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {game.currentApplicants.map((a) => (
          <ApplicantCard
            key={a.id}
            applicant={a}
            decision={decisions[a.id]}
            onApprove={(approve) => setDecision(a.id, { approve })}
            onRate={(ratePct) => setDecision(a.id, { ratePct, approve: true })}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" size="sm" onClick={startNew}>
          Abandon &amp; restart
        </Button>
        <Button onClick={endRound}>End round →</Button>
      </div>

      {game.history.length > 0 && (
        <Card className="mt-6">
          <h3 className="mb-2 text-sm font-semibold">Last round</h3>
          <p className="text-sm text-ink-2">{game.history[game.history.length - 1]!.note}</p>
        </Card>
      )}

      <div className="mt-6">
        <ExplainerPanel formula={`round profit = Σ(interest earned − cost of funds) − losses on defaults`}>
          <p>
            You are the bank now. Every deposit you hold costs you interest (the <strong>cost of funds</strong>), so idle capital loses money — you have to lend. But each loan is a bet: most borrowers repay with interest, a few <strong>default</strong> and you lose much of the principal.
          </p>
          <p>
            The tension is the whole lesson. Approve everyone and defaults sink you (a rising <strong>NPA ratio</strong> — loans unlikely to be repaid). Reject everyone and you earn nothing while customers leave. Good banking is disciplined risk-pricing, not generosity or fear.
          </p>
        </ExplainerPanel>
      </div>
    </main>
  );
}

function ScoreBoard({ game }: { game: BankGameState }) {
  const stats = [
    { label: "Capital", value: formatMoneyCompact(paiseToRupees(game.capitalPaise)) },
    { label: "Profit/loss", value: formatMoneyCompact(paiseToRupees(game.profitPaise)), tone: game.profitPaise >= 0 ? "good" : "bad" },
    { label: "NPA ratio", value: `${game.npaPct.toFixed(1)}%`, tone: game.npaPct > 8 ? "bad" : "neutral" },
    { label: "Satisfaction", value: `${game.satisfaction}%` },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="py-3">
            <div className="text-xs uppercase tracking-wide text-ink-2">{s.label}</div>
            <div
              className={
                "font-display text-2xl font-semibold tabular-nums " +
                ("tone" in s && s.tone === "good" ? "text-status-good" : "tone" in s && s.tone === "bad" ? "text-danger" : "text-ink-1")
              }
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-ink-2">Bank stability</span>
          <span className="tabular-nums text-ink-1">{game.stability}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-ink-1/8">
          <div
            className={
              "h-full rounded-full transition-[width] duration-500 " +
              (game.stability > 50 ? "bg-status-good" : game.stability > 25 ? "bg-status-warning" : "bg-status-critical")
            }
            style={{ width: `${game.stability}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ApplicantCard({
  applicant,
  decision,
  onApprove,
  onRate,
}: {
  applicant: Applicant;
  decision: PendingDecision | undefined;
  onApprove: (approve: boolean) => void;
  onRate: (rate: number) => void;
}) {
  const approved = decision?.approve ?? false;
  const rejected = decision !== undefined && !decision.approve;

  return (
    <Card className={"flex flex-col gap-3 " + (approved ? "ring-2 ring-brand" : rejected ? "opacity-60" : "")}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{applicant.name}, {applicant.age}</div>
          <div className="text-sm text-ink-2">{EMPLOYMENT_LABEL[applicant.employment]}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-3">wants</div>
          <div className="font-semibold tabular-nums">{formatMoneyCompact(paiseToRupees(applicant.amountPaise))}</div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="text-ink-3">Credit score</dt>
        <dd className="text-right tabular-nums">{applicant.creditScore}</dd>
        <dt className="text-ink-3">Income/mo</dt>
        <dd className="text-right tabular-nums">{formatMoneyCompact(paiseToRupees(applicant.monthlyIncomePaise))}</dd>
        <dt className="text-ink-3">Tenure</dt>
        <dd className="text-right tabular-nums">{applicant.months} mo</dd>
      </dl>
      <p className="text-sm text-ink-2">&ldquo;{applicant.history}&rdquo;</p>

      <div className="mt-auto flex items-center gap-2">
        {approved ? (
          <>
            <SelectInput
              aria-label={`Interest rate for ${applicant.name}`}
              className="h-9 flex-1"
              value={String(decision?.ratePct ?? 12)}
              onChange={(e) => onRate(Number(e.target.value))}
              options={[8, 10, 12, 14, 16, 18, 20].map((r) => ({ value: String(r), label: `${r}% rate` }))}
            />
            <Button size="sm" variant="ghost" onClick={() => onApprove(false)}>Undo</Button>
          </>
        ) : (
          <>
            <Button size="sm" className="flex-1" onClick={() => onApprove(true)}>Approve</Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onApprove(false)}>Reject</Button>
          </>
        )}
      </div>
    </Card>
  );
}

function GameOver({ game, onRestart }: { game: BankGameState; onRestart: () => void }) {
  const won = game.status === "won";
  const grade = won ? gradeFor(game) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 max-sm:px-4">
      <Card className="flex flex-col items-center gap-4 text-center">
        <div className="text-5xl" aria-hidden="true">{won ? "🏆" : "💥"}</div>
        <h1 className="text-3xl font-semibold">
          {won ? "You survived all 12 rounds!" : "Your bank collapsed"}
        </h1>
        {won ? (
          <p className="text-ink-2">
            Final grade <strong className="text-gold">{grade}</strong> · profit{" "}
            <strong>{formatMoneyCompact(paiseToRupees(game.profitPaise))}</strong> · NPA {game.npaPct.toFixed(1)}%
          </p>
        ) : (
          <p className="text-ink-2">
            Stability hit zero in round {game.round}. The NPA ratio spiralled and the capital ran out.
          </p>
        )}

        <div className="w-full text-left">
          <h2 className="mb-2 text-lg font-semibold">Post-mortem</h2>
          <ol className="flex flex-col gap-1.5 text-sm">
            {game.history.map((r) => (
              <li key={r.round} className="flex items-start justify-between gap-3 border-b border-line/60 py-1.5 last:border-0">
                <span className="text-ink-3 tabular-nums">R{r.round}</span>
                <span className="flex-1 text-ink-2">{r.note}</span>
                <span className={"tabular-nums " + (r.profitPaise >= 0 ? "text-status-good" : "text-danger")}>
                  {formatMoneyCompact(paiseToRupees(r.profitPaise))}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <Button onClick={onRestart}>Play again</Button>
      </Card>
    </main>
  );
}

function gradeFor(game: BankGameState): string {
  if (game.profitPaise > 5_000_000_00 && game.npaPct < 5) return "A";
  if (game.profitPaise > 0 && game.npaPct < 8) return "B";
  if (game.profitPaise > 0) return "C";
  return "D";
}
