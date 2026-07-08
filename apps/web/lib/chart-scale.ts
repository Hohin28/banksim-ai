/**
 * Chart scale helpers for the custom SVG chart kit (docs/10 §6).
 * Pure functions — unit tested.
 */

/**
 * "Nice" axis ticks from 0 to at least `max`, targeting ~`count` steps.
 * Steps are 1/2/5 × 10^k so labels read naturally (₹2L, ₹4L, …).
 */
export function niceTicks(max: number, count = 5): number[] {
  if (max <= 0) return [0, 1];
  const rawStep = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const step = niceNorm * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  // Float-safe loop: fixed count, values derived by multiplication.
  const n = Math.round(top / step);
  for (let i = 0; i <= n; i++) ticks.push(i * step);
  return ticks;
}

/** Evenly thinned integer ticks 0..maxYear, at most `maxCount` of them. */
export function yearTicks(maxYear: number, maxCount = 10): number[] {
  if (maxYear <= 0) return [0];
  const step = Math.max(1, Math.ceil(maxYear / maxCount));
  const ticks: number[] = [];
  for (let y = 0; y <= maxYear; y += step) ticks.push(y);
  if (ticks[ticks.length - 1] !== maxYear) ticks.push(maxYear);
  return ticks;
}

/** Linear map d ∈ [d0,d1] → r ∈ [r0,r1]. */
export function scaleLinear(
  d0: number,
  d1: number,
  r0: number,
  r1: number,
): (d: number) => number {
  const dd = d1 - d0;
  return (d) => (dd === 0 ? r0 : r0 + ((d - d0) / dd) * (r1 - r0));
}
