"use client";

import { DEMOS } from "@/components/lessons/demos";
import { Quiz } from "@/components/lessons/quiz";
import { Button } from "@/components/ui/button";
import { useLessonProgress } from "@/lib/lesson-progress";
import type { Lesson } from "@/content/lessons";
import { LESSONS } from "@/content/lessons";
import Link from "next/link";
import { useMemo } from "react";

export function LessonView({ lesson }: { lesson: Lesson }) {
  const { progress, markComplete } = useLessonProgress();
  const done = progress.completed[lesson.slug] !== undefined;

  const nextLesson = useMemo(() => {
    const idx = LESSONS.findIndex((l) => l.slug === lesson.slug);
    return idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : undefined;
  }, [lesson.slug]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 max-sm:px-4">
      <Link href="/learn" className="text-sm text-ink-2 hover:text-brand">
        ← All lessons
      </Link>

      <header className="mb-8 mt-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">{lesson.emoji}</span>
          <h1 className="text-3xl font-semibold">{lesson.title}</h1>
        </div>
        <p className="text-ink-2">
          {lesson.summary} · {lesson.minutes} min read
          {done && <span className="ml-2 text-status-good">· completed ✓</span>}
        </p>
      </header>

      <article className="flex flex-col gap-5 text-[17px] leading-relaxed text-ink-1 [&_p]:text-ink-1 [&_strong]:font-semibold">
        {lesson.blocks.map((block, i) => {
          if (block.kind === "prose") {
            return (
              <div key={i} className="flex flex-col gap-4">
                {block.body}
              </div>
            );
          }
          if (block.kind === "callout") {
            return (
              <aside
                key={i}
                className="rounded-panel border-l-4 border-brand bg-brand/5 p-4"
              >
                <p className="mb-1 font-semibold text-brand-strong dark:text-brand">
                  {block.title}
                </p>
                <p className="text-ink-2">{block.body}</p>
              </aside>
            );
          }
          const Demo = DEMOS[block.demo];
          return <Demo key={i} />;
        })}
      </article>

      <Quiz
        questions={lesson.quiz}
        onPassed={(score) => markComplete(lesson.slug, score)}
      />

      <div className="flex items-center justify-between border-t border-line pt-6">
        <Link href="/learn" className="text-sm text-ink-2 hover:text-brand">
          ← Back to lessons
        </Link>
        {nextLesson && (
          <Link href={`/learn/${nextLesson.slug}`}>
            <Button variant="secondary">
              Next: {nextLesson.title} →
            </Button>
          </Link>
        )}
      </div>
    </main>
  );
}
