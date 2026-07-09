"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Persist a value to localStorage under `key` (guest-mode persistence for the
 * behavioural sims — docs/03 state rules). SSR-safe: starts from `initial`,
 * hydrates from storage after mount so server and client first render match.
 * When accounts land (M3), these keys sync to the backend.
 */
export function useLocalState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect --
     Deferred to an effect on purpose: reading storage during the initial
     render (server or hydration) would desync server/client HTML. This is the
     canonical SSR-safe hydration read, so the rule does not apply here. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore corrupt/blocked storage
    }
    setHydrated(true);
  }, [key]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // private mode: keep working in-memory
    }
  }, [key, value, hydrated]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setValue(initial);
    // initial is a stable literal at call sites; intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setValue, reset];
}
