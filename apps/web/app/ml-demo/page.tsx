"use client";

import { ExplainerPanel } from "@/components/simulator/explainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SelectInput } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TermStrip } from "@/components/ui/term";
import { ApiError, apiFetch } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";

/* ── API payload types (mirror apps/api/app/main.py) ─────────────── */

interface Contribution {
  feature: string;
  weight: number;
}

interface ModelResult {
  model: "logreg" | "rf" | "xgb";
  approved: boolean;
  probability: number;
  risk_band: "low" | "medium" | "high";
  contributions?: Contribution[];
}

interface PredictResponse {
  model_version: string;
  results: ModelResult[];
  disclaimer: string;
}

interface ModelCards {
  version: string;
  dataset: { name: string; url: string; rows: number; year: number; note: string };
  models: Record<string, { accuracy: number; precision: number; recall: number; f1: number; roc_auc: number }>;
}

/* ── Friendly labels for the dataset's raw codes ──────────────────── */

const OPTIONS = {
  checking: [
    { value: "A14", label: "No checking account" },
    { value: "A11", label: "Overdrawn (below 0 DM)" },
    { value: "A12", label: "Low balance (0–200 DM)" },
    { value: "A13", label: "Healthy (200+ DM)" },
  ],
  credit_history: [
    { value: "A30", label: "No credits taken / all paid duly" },
    { value: "A31", label: "All credits at this bank paid" },
    { value: "A32", label: "Existing credits paid till now" },
    { value: "A33", label: "Past payment delays" },
    { value: "A34", label: "Critical account / credits elsewhere" },
  ],
  savings: [
    { value: "A61", label: "Under 100 DM" },
    { value: "A62", label: "100–500 DM" },
    { value: "A63", label: "500–1,000 DM" },
    { value: "A64", label: "1,000+ DM" },
    { value: "A65", label: "Unknown / no savings" },
  ],
  employment: [
    { value: "A71", label: "Unemployed" },
    { value: "A72", label: "Under 1 year" },
    { value: "A73", label: "1–4 years" },
    { value: "A74", label: "4–7 years" },
    { value: "A75", label: "7+ years" },
  ],
  housing: [
    { value: "A151", label: "Renting" },
    { value: "A152", label: "Owns home" },
    { value: "A153", label: "Living rent-free" },
  ],
} as const;

const FEATURE_LABELS: Record<string, string> = {
  checking: "Checking account",
  credit_history: "Credit history",
  savings: "Savings",
  employment: "Employment length",
  housing: "Housing",
  duration_months: "Loan duration",
  amount: "Loan amount",
  installment_rate: "Installment burden",
  existing_credits: "Existing credits",
};

const MODEL_LABELS: Record<string, string> = {
  logreg: "Logistic Regression",
  rf: "Random Forest",
  xgb: "XGBoost",
};

const RISK_BADGE = { low: "good", medium: "warning", high: "critical" } as const;

const DEFAULT_INPUT = {
  checking: "A11",
  credit_history: "A32",
  savings: "A61",
  employment: "A73",
  housing: "A152",
  duration_months: 24,
  amount: 3500,
  installment_rate: 3,
  existing_credits: 1,
};

export default function MlDemoPage() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [cards, setCards] = useState<ModelCards | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiDown, setApiDown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof DEFAULT_INPUT>(key: K, value: (typeof DEFAULT_INPUT)[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    apiFetch<ModelCards>("/api/v1/ml/models")
      .then(setCards)
      .catch(() => setApiDown(true));
  }, []);

  const predict = async () => {
    setLoading(true);
    setError(null);
    try {
      setPrediction(await apiFetch<PredictResponse>("/api/v1/ml/predict", {
        method: "POST",
        body: JSON.stringify(input),
      }));
      setApiDown(false);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setApiDown(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 max-sm:px-4">
      <div className="mb-6 rounded-card border border-status-warning/40 bg-status-warning/10 px-4 py-3 text-sm">
        <strong>⚠ Educational demonstration.</strong> These models are trained
        on a public 1994 dataset to show <em>how</em> machine learning judges
        loan applications — this is not a real banking decision system.
      </div>

      <header className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-semibold max-sm:text-3xl">ML Loan Lab</h1>
          <Badge variant="brand">demonstration</Badge>
        </div>
        <p className="max-w-2xl text-ink-2">
          Three different algorithms learned approval patterns from 1,000 real
          German loan applications. Describe an applicant and watch the models
          judge — and sometimes disagree with each other.
        </p>
      </header>

      <TermStrip ids={["credit-score", "roc-auc", "emi"]} className="mb-6" />

      {apiDown ? (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">The prediction service isn&rsquo;t running</h2>
          <p className="text-sm text-ink-2">
            The ML Lab needs the local Python API. From the repo root, run:
          </p>
          <pre className="overflow-x-auto rounded-field border border-line bg-page px-4 py-3 font-mono text-sm">
{`cd apps/api
..\\..\\.venv\\Scripts\\python -m uvicorn app.main:app --port 8000`}
          </pre>
          <p className="text-sm text-ink-2">
            (First time: train the models with{" "}
            <code className="font-mono">.venv\Scripts\python ml\src\train.py</code>)
            &nbsp;Then <button type="button" className="font-medium text-brand underline-offset-2 hover:underline" onClick={() => location.reload()}>reload this page</button>.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Applicant form */}
          <Card className="flex h-fit flex-col gap-5 lg:sticky lg:top-6">
            <Field label="Checking account status">
              {(p) => <SelectInput {...p} options={[...OPTIONS.checking]} value={input.checking} onChange={(e) => set("checking", e.target.value)} />}
            </Field>
            <Field label="Credit history">
              {(p) => <SelectInput {...p} options={[...OPTIONS.credit_history]} value={input.credit_history} onChange={(e) => set("credit_history", e.target.value)} />}
            </Field>
            <Field label="Savings">
              {(p) => <SelectInput {...p} options={[...OPTIONS.savings]} value={input.savings} onChange={(e) => set("savings", e.target.value)} />}
            </Field>
            <Field label="Employment length">
              {(p) => <SelectInput {...p} options={[...OPTIONS.employment]} value={input.employment} onChange={(e) => set("employment", e.target.value)} />}
            </Field>
            <Field label="Housing">
              {(p) => <SelectInput {...p} options={[...OPTIONS.housing]} value={input.housing} onChange={(e) => set("housing", e.target.value)} />}
            </Field>
            <Slider label="Loan duration" value={input.duration_months} min={4} max={72} step={2} onChange={(v) => set("duration_months", v)} formatValue={(v) => `${v} mo`} />
            <Slider label="Loan amount (1994 DM)" value={input.amount} min={250} max={20000} step={250} onChange={(v) => set("amount", v)} formatValue={(v) => `${v.toLocaleString("en-IN")} DM`} />
            <Slider label="Installment % of income" value={input.installment_rate} min={1} max={4} step={1} onChange={(v) => set("installment_rate", v)} formatValue={(v) => `${v}`} />
            <Slider label="Existing credits" value={input.existing_credits} min={1} max={4} step={1} onChange={(v) => set("existing_credits", v)} formatValue={(v) => `${v}`} />
            <Button onClick={predict} loading={loading}>
              Ask the models
            </Button>
            {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          </Card>

          {/* Results */}
          <div className="flex min-w-0 flex-col gap-6">
            {prediction ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  {prediction.results.map((r) => (
                    <Card key={r.model} className="flex flex-col gap-2">
                      <div className="text-sm font-medium text-ink-2">{MODEL_LABELS[r.model]}</div>
                      <div className={cn("font-display text-2xl font-semibold", r.approved ? "text-status-good" : "text-danger")}>
                        {r.approved ? "✓ Approve" : "✗ Decline"}
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-1/8">
                        <div
                          className={cn("h-full rounded-full", r.approved ? "bg-status-good" : "bg-danger")}
                          style={{ width: `${r.probability * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="tabular-nums text-ink-2">{(r.probability * 100).toFixed(1)}% creditworthy</span>
                        <Badge variant={RISK_BADGE[r.risk_band]}>{r.risk_band} risk</Badge>
                      </div>
                    </Card>
                  ))}
                </div>

                {disagreement(prediction.results) && (
                  <Card className="border-status-warning/40 bg-status-warning/5">
                    <p className="text-sm">
                      <strong>The models disagree.</strong> Same applicant, same
                      data — different algorithms weigh the evidence
                      differently. Real lenders face exactly this problem, which
                      is why &ldquo;the computer said no&rdquo; is never a
                      neutral statement.
                    </p>
                  </Card>
                )}

                {(() => {
                  const contribs = prediction.results.find((r) => r.model === "logreg")?.contributions;
                  if (!contribs) return null;
                  const maxAbs = Math.max(...contribs.map((c) => Math.abs(c.weight)), 0.001);
                  return (
                    <Card>
                      <h2 className="mb-1 text-lg font-semibold">Why? — Logistic Regression&rsquo;s reasoning</h2>
                      <p className="mb-4 text-sm text-ink-2">
                        Signed contributions (log-odds). Green pushes toward
                        approval, red toward decline. Tree models (RF/XGBoost)
                        don&rsquo;t decompose this cleanly — one reason simple
                        models remain popular where decisions must be explained.
                      </p>
                      <ul className="flex flex-col gap-2">
                        {contribs.map((c) => (
                          <li key={c.feature} className="grid grid-cols-[140px_1fr_60px] items-center gap-3 text-sm max-sm:grid-cols-[110px_1fr_52px]">
                            <span className="truncate text-ink-2">{FEATURE_LABELS[c.feature] ?? c.feature}</span>
                            <div className="relative h-3">
                              <div className="absolute inset-y-0 left-1/2 w-px bg-line" aria-hidden="true" />
                              <div
                                className={cn("absolute inset-y-0 rounded-sm", c.weight >= 0 ? "left-1/2 bg-status-good" : "right-1/2 bg-danger")}
                                style={{ width: `${(Math.abs(c.weight) / maxAbs) * 48}%` }}
                              />
                            </div>
                            <span className={cn("text-right tabular-nums", c.weight >= 0 ? "text-status-good" : "text-danger")}>
                              {c.weight >= 0 ? "+" : ""}{c.weight.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  );
                })()}
              </>
            ) : (
              <Card>
                <p className="text-ink-2">
                  Set up an applicant on the left and press{" "}
                  <strong>Ask the models</strong>. Try making one thing worse —
                  say, an overdrawn checking account — and watch how much it
                  moves each verdict.
                </p>
              </Card>
            )}

            {cards && (
              <Card>
                <h2 className="mb-3 text-lg font-semibold">Model report card</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-2">
                        <th className="px-3 py-2 font-medium">Model</th>
                        <th className="px-3 py-2 text-right font-medium">Accuracy</th>
                        <th className="px-3 py-2 text-right font-medium">Precision</th>
                        <th className="px-3 py-2 text-right font-medium">Recall</th>
                        <th className="px-3 py-2 text-right font-medium">ROC-AUC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(cards.models).map(([name, m]) => (
                        <tr key={name} className="border-b border-line/60 last:border-0">
                          <td className="px-3 py-2 font-medium">{MODEL_LABELS[name]}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{(m.accuracy * 100).toFixed(1)}%</td>
                          <td className="px-3 py-2 text-right tabular-nums">{(m.precision * 100).toFixed(1)}%</td>
                          <td className="px-3 py-2 text-right tabular-nums">{(m.recall * 100).toFixed(1)}%</td>
                          <td className="px-3 py-2 text-right tabular-nums">{m.roc_auc.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-ink-3">
                  Measured on a held-out 20% test split of {cards.dataset.rows} applications · model version {cards.version}
                </p>
              </Card>
            )}

            <ExplainerPanel formula={`P(creditworthy) = model(checking, history, savings, employment, housing, duration, amount, installments, credits)`}>
              <p>
                <strong>Where this data comes from:</strong> 1,000 real loan
                applications from a German bank in 1994 (amounts are in
                Deutsche Mark — that&rsquo;s why the currency looks odd). Each
                was labelled &ldquo;good&rdquo; or &ldquo;bad&rdquo; credit
                risk after the fact. The models learned patterns from 800 of
                them and are graded on the 200 they never saw.
              </p>
              <p>
                <strong>What we deliberately removed:</strong> the raw dataset
                also records <em>sex &amp; marital status</em>, <em>age</em>,
                and <em>foreign-worker status</em>. A model trained on those
                would happily use them — and would discriminate. We excluded
                them, but bias can still hide in proxies (housing or employment
                patterns can correlate with the very attributes we dropped).
                Removing a column is not the same as removing the bias.
              </p>
              <p>
                <strong>Why this matters:</strong> a 1994 German dataset
                doesn&rsquo;t describe you. Models inherit the world their data
                came from — its era, its economy, its prejudices. That is the
                single most important thing to know about machine learning in
                lending.
              </p>
            </ExplainerPanel>
          </div>
        </div>
      )}
    </main>
  );
}

function disagreement(results: ModelResult[]): boolean {
  return new Set(results.map((r) => r.approved)).size > 1;
}
