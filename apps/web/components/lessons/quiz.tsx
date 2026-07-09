"use client";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  /** Index of the correct option. */
  correct: number;
  /** Shown after answering — teaches, whether right or wrong. */
  explanation: string;
}

export const PASS_THRESHOLD = 0.6;

/**
 * Lesson quiz (docs/02 F11): instant per-question feedback that teaches
 * rather than punishes. Scored client-side for guest mode; server-side
 * re-scoring arrives with the backend (M3). Passing (≥60%) reports up so the
 * hub can mark the lesson complete.
 */
export function Quiz({
  questions,
  onPassed,
}: {
  questions: QuizQuestion[];
  onPassed: (scorePct: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredAll = questions.every((q) => answers[q.id] !== undefined);
  const correctCount = questions.filter((q) => answers[q.id] === q.correct).length;
  const scorePct = Math.round((correctCount / questions.length) * 100);
  const passed = scorePct >= PASS_THRESHOLD * 100;

  const submit = () => {
    setSubmitted(true);
    if (passed) onPassed(scorePct);
  };

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="my-8 rounded-panel border border-line bg-surface p-6">
      <h2 className="mb-1 text-xl font-semibold">Quick check</h2>
      <p className="mb-5 text-sm text-ink-2">
        Answer these to complete the lesson. Wrong answers explain themselves —
        that&rsquo;s the point.
      </p>

      <ol className="flex flex-col gap-6">
        {questions.map((q, qi) => (
          <li key={q.id}>
            <p className="mb-2 font-medium">
              {qi + 1}. {q.question}
            </p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const chosen = answers[q.id] === oi;
                const isCorrect = oi === q.correct;
                const showState = submitted;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={cn(
                      "flex items-center gap-3 rounded-field border px-3 py-2 text-left text-sm transition-colors",
                      !showState && chosen && "border-brand bg-brand/5",
                      !showState && !chosen && "border-line hover:border-brand/60",
                      showState && isCorrect && "border-status-good bg-status-good/10",
                      showState && chosen && !isCorrect && "border-danger bg-danger/10",
                      showState && !isCorrect && !chosen && "border-line opacity-60",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border text-xs",
                        chosen ? "border-current" : "border-ink-3",
                      )}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <p
                className={cn(
                  "mt-2 text-sm",
                  answers[q.id] === q.correct ? "text-status-good" : "text-ink-2",
                )}
              >
                {answers[q.id] === q.correct ? "Correct. " : "Not quite. "}
                {q.explanation}
              </p>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center gap-3">
        {!submitted ? (
          <Button onClick={submit} disabled={!answeredAll}>
            {answeredAll ? "Check answers" : "Answer all questions"}
          </Button>
        ) : (
          <>
            <span
              className={cn(
                "font-medium",
                passed ? "text-status-good" : "text-danger",
              )}
            >
              {correctCount}/{questions.length} correct ({scorePct}%) —{" "}
              {passed ? "lesson complete!" : "have another go"}
            </span>
            {!passed && (
              <Button variant="secondary" size="sm" onClick={retry}>
                Retry
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
