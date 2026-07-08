"use client";

import { useEffect } from "react";

/**
 * Simulator state ⇄ URL query (docs/05 §8): every simulator is
 * deep-linkable and shareable. Defaults are omitted from the URL so links
 * stay short; out-of-range values clamp instead of erroring.
 */

export type ParamSpec =
  | { kind: "int"; def: number; min: number; max: number }
  | { kind: "float"; def: number; min: number; max: number }
  | { kind: "enum"; def: string; options: readonly string[] };

export type ParamValues<S extends Record<string, ParamSpec>> = {
  [K in keyof S]: S[K] extends { kind: "enum" } ? string : number;
};

export function parseParams<S extends Record<string, ParamSpec>>(
  specs: S,
  search: URLSearchParams,
): ParamValues<S> {
  const out: Record<string, number | string> = {};
  for (const [key, spec] of Object.entries(specs)) {
    const raw = search.get(key);
    if (spec.kind === "enum") {
      out[key] = raw !== null && spec.options.includes(raw) ? raw : spec.def;
      continue;
    }
    if (raw === null || raw.trim() === "") {
      out[key] = spec.def;
      continue;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) {
      out[key] = spec.def;
      continue;
    }
    const clamped = Math.min(spec.max, Math.max(spec.min, num));
    out[key] = spec.kind === "int" ? Math.round(clamped) : clamped;
  }
  return out as ParamValues<S>;
}

export function buildSearch<S extends Record<string, ParamSpec>>(
  specs: S,
  values: ParamValues<S>,
): string {
  const search = new URLSearchParams();
  for (const [key, spec] of Object.entries(specs)) {
    const v = values[key as keyof S];
    if (v !== spec.def) search.set(key, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

/** Debounced history.replaceState sync — call from the simulator page. */
export function useUrlSync<S extends Record<string, ParamSpec>>(
  specs: S,
  values: ParamValues<S>,
): void {
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = buildSearch(specs, values);
      const url = `${window.location.pathname}${qs}`;
      if (url !== window.location.pathname + window.location.search) {
        window.history.replaceState(null, "", url);
      }
    }, 300);
    return () => clearTimeout(t);
    // Values object is rebuilt per render; serialize for a stable dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);
}
