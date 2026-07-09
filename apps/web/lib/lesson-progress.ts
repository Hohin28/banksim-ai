"use client";

import { useLocalState } from "@/lib/use-local-state";

export interface LessonProgress {
  /** slug → best quiz score percent (present = completed). */
  completed: Record<string, number>;
}

const EMPTY: LessonProgress = { completed: {} };

/** Guest-mode lesson progress (localStorage; backend sync arrives with M3). */
export function useLessonProgress() {
  const [progress, setProgress] = useLocalState<LessonProgress>(
    "banksim.lesson-progress",
    EMPTY,
  );

  const markComplete = (slug: string, scorePct: number) =>
    setProgress((p) => ({
      completed: {
        ...p.completed,
        [slug]: Math.max(p.completed[slug] ?? 0, scorePct),
      },
    }));

  return { progress, markComplete };
}
