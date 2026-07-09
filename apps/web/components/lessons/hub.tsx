"use client";

import { LESSONS } from "@/content/lessons";
import { useLessonProgress } from "@/lib/lesson-progress";
import Link from "next/link";

const UPCOMING = [
  "Credit cards", "Taxes", "Insurance", "Inflation",
  "Investing", "Budgeting", "Fraud prevention", "Cybersecurity in banking",
];

export function LearningHub() {
  const { progress } = useLessonProgress();
  const doneCount = LESSONS.filter((l) => progress.completed[l.slug] !== undefined).length;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 max-sm:px-4">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">Learning Hub</h1>
        <p className="max-w-2xl text-ink-2">
          Short, interactive lessons that build on the simulators. Each one ends
          with a quick check — get 60% to complete it. No account needed; your
          progress is saved on this device.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-ink-1/8">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${(doneCount / LESSONS.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-ink-2 tabular-nums">
            {doneCount}/{LESSONS.length} complete
          </span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LESSONS.map((lesson) => {
          const score = progress.completed[lesson.slug];
          const complete = score !== undefined;
          return (
            <Link
              key={lesson.slug}
              href={`/learn/${lesson.slug}`}
              className="group flex flex-col gap-2 rounded-card border border-line bg-surface p-5 transition-[border-color,transform] duration-120 hover:-translate-y-0.5 hover:border-brand"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl" aria-hidden="true">{lesson.emoji}</span>
                {complete && (
                  <span className="rounded-full bg-status-good/10 px-2 py-0.5 text-xs font-medium text-status-good">
                    ✓ {score}%
                  </span>
                )}
              </div>
              <div className="font-display text-lg font-semibold group-hover:text-brand-strong dark:group-hover:text-brand">
                {lesson.title}
              </div>
              <p className="text-sm text-ink-2">{lesson.summary}</p>
              <span className="mt-auto text-xs text-ink-3">{lesson.minutes} min</span>
            </Link>
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-ink-2">More lessons coming</h2>
        <div className="flex flex-wrap gap-2">
          {UPCOMING.map((t) => (
            <span
              key={t}
              className="rounded-full border border-dashed border-line px-3 py-1 text-sm text-ink-3"
            >
              {t}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
