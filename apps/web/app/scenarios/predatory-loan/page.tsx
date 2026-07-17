"use client";

import {
  evaluateOffers,
  paiseToRupees,
  rupeesToPaise,
  type LoanOffer,
  type OfferResult,
} from "@banksim/finance-core";
import { Reveal, VerdictBanner } from "@/components/scenarios/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Term } from "@/components/ui/term";
import { cn } from "@/lib/cn";
import { formatMoney, formatPercent } from "@/lib/format";
import Link from "next/link";
import { useMemo, useState } from "react";

const PRINCIPAL = 100000; // ₹1,00,000

/**
 * Three offers for the SAME ₹1L loan. The middle-looking one is a flat-rate
 * trap. The advertised rates and posters are designed to mislead; the engine
 * computes the truth.
 */
const OFFERS: (LoanOffer & { pitch: string })[] = [
  {
    id: "honest",
    lender: "Sterling Bank",
    pitch: "8.5% reducing-balance rate · 2% processing fee · 3 years",
    principalPaise: rupeesToPaise(PRINCIPAL),
    quoting: "reducing",
    advertisedRatePct: 8.5,
    processingFeePct: 2,
    months: 36,
    catch: "Charges a 2% fee upfront — the only one that's honest about it.",
  },
  {
    id: "flat",
    lender: "QuickCash Finance",
    pitch: "Just 10% flat · ZERO processing fee · 3 years",
    principalPaise: rupeesToPaise(PRINCIPAL),
    quoting: "flat",
    advertisedRatePct: 10,
    processingFeePct: 0,
    months: 36,
    catch: "“Flat” means you pay interest on the full ₹1L for all 3 years — even the part you've already repaid.",
  },
  {
    id: "loweme",
    lender: "EasyEMI Loans",
    pitch: "9% reducing · low ₹2,076/mo EMI! · 5 years",
    principalPaise: rupeesToPaise(PRINCIPAL),
    quoting: "reducing",
    advertisedRatePct: 9,
    processingFeePct: 1,
    months: 60,
    catch: "The low EMI hides a long 5-year tenure — you pay interest for far longer.",
  },
];

export default function PredatoryLoanScenario() {
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const evaln = useMemo(() => evaluateOffers(OFFERS), []);
  const byId = useMemo(
    () => Object.fromEntries(evaln.results.map((r) => [r.offer.id, r])),
    [evaln],
  );

  const pickedResult = picked ? byId[picked] : null;
  const cheapest = byId[evaln.cheapestId]!;
  const pickedRight = picked === evaln.cheapestId;

  const reveal = () => setRevealed(true);
  const reset = () => {
    setPicked(null);
    setRevealed(false);
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 max-sm:px-4">
      <Link href="/scenarios" className="text-sm text-ink-2 hover:text-brand">
        ← All scenarios
      </Link>

      <header className="mb-6 mt-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-semibold max-sm:text-3xl">Spot the predatory loan</h1>
          <Badge variant="brand">scenario</Badge>
        </div>
        <p className="max-w-2xl text-ink-2">
          You need <strong>{formatMoney(PRINCIPAL)}</strong>. Three lenders make
          you an offer for the exact same amount. Which one actually costs you
          the least? Pick the one you&rsquo;d take — then we&rsquo;ll do the
          maths the posters hope you won&rsquo;t.
        </p>
      </header>

      <div className="mb-6 rounded-card border border-line bg-surface px-4 py-2.5">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-3">
          New to a term? Tap it:{" "}
        </span>
        <span className="text-sm">
          <Term id="emi" /> · <Term id="tenure" /> · <Term id="principal" />
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {OFFERS.map((offer) => {
          const isPicked = picked === offer.id;
          const result = byId[offer.id]!;
          return (
            <button
              key={offer.id}
              type="button"
              onClick={() => !revealed && setPicked(offer.id)}
              disabled={revealed}
              aria-pressed={isPicked}
              className={cn(
                "flex flex-col gap-3 rounded-card border bg-surface p-5 text-left transition-all duration-150",
                isPicked ? "border-brand ring-2 ring-brand" : "border-line",
                !revealed && "hover:-translate-y-0.5 hover:border-brand cursor-pointer",
                revealed && "cursor-default",
              )}
            >
              <div className="font-display text-lg font-semibold">{offer.lender}</div>
              <div className="rounded-field bg-page px-3 py-2 text-sm font-medium text-ink-1">
                {offer.pitch}
              </div>
              <dl className="grid grid-cols-2 gap-1 text-sm">
                <dt className="text-ink-3">Advertised</dt>
                <dd className="text-right font-medium">
                  {formatPercent(offer.advertisedRatePct)} {offer.quoting}
                </dd>
                <dt className="text-ink-3">Monthly EMI</dt>
                <dd className="text-right tabular-nums">{formatMoney(paiseToRupees(result.emiPaise))}</dd>
              </dl>
              {revealed && <RevealDetail result={result} isCheapest={offer.id === evaln.cheapestId} isTrap={offer.id === evaln.trapId} />}
            </button>
          );
        })}
      </div>

      {!revealed ? (
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={reveal} disabled={!picked}>
            {picked ? `Lock in ${OFFERS.find((o) => o.id === picked)!.lender} → reveal the truth` : "Pick an offer first"}
          </Button>
        </div>
      ) : (
        <Reveal show className="mt-6 flex flex-col gap-5">
          <VerdictBanner
            emoji={pickedRight ? "🎯" : "😬"}
            tone={pickedRight ? "good" : "bad"}
            title={
              pickedRight
                ? "Sharp eye — you picked the genuinely cheapest loan."
                : `That one costs you ${formatMoney(paiseToRupees(pickedResult!.trueCostPaise - cheapest.trueCostPaise))} more than the best offer.`
            }
            subtitle={
              pickedRight
                ? "Most people don't. Here's why the others are traps."
                : `You picked ${OFFERS.find((o) => o.id === picked)!.lender}; the true cheapest was ${cheapest.offer.lender}.`
            }
          />

          {evaln.trapId && (
            <Card className="border-danger/40 bg-danger/5">
              <h2 className="mb-2 text-lg font-semibold">
                🪤 The trap: {byId[evaln.trapId]!.offer.lender}&rsquo;s &ldquo;{formatPercent(byId[evaln.trapId]!.offer.advertisedRatePct)} flat&rdquo;
              </h2>
              <p className="text-sm leading-relaxed text-ink-2">
                A <strong>flat rate</strong> charges interest on your whole
                original ₹1,00,000 for all three years — even the ₹90,000 you&rsquo;ve
                already paid back. That &ldquo;{formatPercent(byId[evaln.trapId]!.offer.advertisedRatePct)}&rdquo; on the poster is
                really a{" "}
                <strong className="text-danger">
                  {formatPercent(byId[evaln.trapId]!.effectiveAprPct)} reducing-balance rate
                </strong>{" "}
                once you account for that — nearly double what it claims, and the
                most expensive option here despite looking mid-range.
              </p>
            </Card>
          )}

          <Card>
            <h2 className="mb-4 text-lg font-semibold">The truth, side by side</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-2">
                    <th className="px-3 py-2 font-medium">Lender</th>
                    <th className="px-3 py-2 text-right font-medium">Advertised</th>
                    <th className="px-3 py-2 text-right font-medium">True APR</th>
                    <th className="px-3 py-2 text-right font-medium">Total cost of the loan</th>
                    <th className="px-3 py-2 font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {[...evaln.results]
                    .sort((a, b) => a.trueCostPaise - b.trueCostPaise)
                    .map((r) => (
                      <tr key={r.offer.id} className="border-b border-line/60 last:border-0">
                        <td className="px-3 py-2 font-medium">{r.offer.lender}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-ink-2">
                          {formatPercent(r.offer.advertisedRatePct)}
                        </td>
                        <td className={cn("px-3 py-2 text-right font-semibold tabular-nums", r.hiddenSpreadPct > 2 ? "text-danger" : "text-ink-1")}>
                          {formatPercent(r.effectiveAprPct)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(paiseToRupees(r.trueCostPaise))}</td>
                        <td className="px-3 py-2">
                          {r.offer.id === evaln.cheapestId ? (
                            <Badge variant="good">cheapest</Badge>
                          ) : r.offer.id === evaln.trapId ? (
                            <Badge variant="critical">the trap</Badge>
                          ) : (
                            <Badge variant="warning">costly</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-3">
              &ldquo;True APR&rdquo; is the real reducing-balance rate, computed
              from what you actually receive and repay — the same engine that
              powers the Loan Simulator.
            </p>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">The three things that fooled you</h2>
            <ul className="flex flex-col gap-2 text-sm text-ink-2">
              <li><strong className="text-ink-1">&ldquo;Flat&rdquo; rates</strong> — always roughly double the equivalent reducing rate. If a lender leads with &ldquo;flat&rdquo;, mentally add ~80%.</li>
              <li><strong className="text-ink-1">&ldquo;Zero processing fee!&rdquo;</strong> — a fee is visible and small; a flat rate is invisible and huge. QuickCash waived the small one to hide the big one.</li>
              <li><strong className="text-ink-1">A low monthly EMI</strong> — often just a longer tenure. EasyEMI&rsquo;s ₹2,076 looks kind, but you pay it for 60 months, not 36.</li>
            </ul>
            <p className="text-sm text-ink-2">
              The only number that can&rsquo;t lie is the <strong>true APR</strong> —
              always ask for the reducing-balance rate and the total amount repaid.
            </p>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={reset}>Try again</Button>
            <Link href="/loans" className="text-sm font-medium text-brand-strong underline-offset-2 hover:underline dark:text-brand">
              Model any of these in the Loan Simulator →
            </Link>
          </div>
        </Reveal>
      )}
    </main>
  );
}

function RevealDetail({ result, isCheapest, isTrap }: { result: OfferResult; isCheapest: boolean; isTrap: boolean }) {
  return (
    <div
      className={cn(
        "mt-1 flex flex-col gap-1 rounded-field border px-3 py-2 text-sm",
        isCheapest ? "border-status-good/40 bg-status-good/10" : isTrap ? "border-danger/40 bg-danger/10" : "border-line bg-page",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-ink-2">True APR</span>
        <span className={cn("font-semibold tabular-nums", isTrap ? "text-danger" : "text-ink-1")}>
          {formatPercent(result.effectiveAprPct)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ink-2">Total cost</span>
        <span className="font-semibold tabular-nums">{formatMoney(paiseToRupees(result.trueCostPaise))}</span>
      </div>
    </div>
  );
}
