/**
 * Money & number display formatting (docs/05 §8: one util, no hardcoded ₹ in JSX).
 *
 * Display-layer only — takes rupees as a JS number. Exact arithmetic lives in
 * @banksim/finance-core as integer paise; convert before formatting.
 */

export type NumberFormatStyle = "indian" | "international";

const inFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const intlFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Full currency string: ₹1,50,000 (indian) or ₹150,000 (international). */
export function formatMoney(
  rupees: number,
  style: NumberFormatStyle = "indian",
): string {
  const sign = rupees < 0 ? "−" : "";
  const abs = Math.abs(Math.round(rupees));
  const fmt = style === "indian" ? inFmt : intlFmt;
  return `${sign}₹${fmt.format(abs)}`;
}

/**
 * Compact currency for axis ticks and stat chips (docs/10 §6):
 * indian: ₹1.5L, ₹2.3Cr, ₹12k · international: ₹150K, ₹23M.
 * Full value belongs in the tooltip, never rounded away silently.
 */
export function formatMoneyCompact(
  rupees: number,
  style: NumberFormatStyle = "indian",
): string {
  const sign = rupees < 0 ? "−" : "";
  const abs = Math.abs(rupees);

  const one = (n: number) => {
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };

  if (style === "indian") {
    if (abs >= 1_00_00_000) return `${sign}₹${one(abs / 1_00_00_000)}Cr`;
    if (abs >= 1_00_000) return `${sign}₹${one(abs / 1_00_000)}L`;
    if (abs >= 1_000) return `${sign}₹${one(abs / 1_000)}k`;
    return `${sign}₹${inFmt.format(Math.round(abs))}`;
  }
  if (abs >= 1_000_000_000) return `${sign}₹${one(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}₹${one(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}₹${one(abs / 1_000)}K`;
  return `${sign}₹${intlFmt.format(Math.round(abs))}`;
}

/** 7 → "7%", 7.25 → "7.25%" */
export function formatPercent(pct: number, maxDecimals = 2): string {
  const r = Number(pct.toFixed(maxDecimals));
  return `${r}%`;
}

/** Spoken-friendly value text for slider ARIA: "₹5,000 per month". */
export function moneyValueText(
  rupees: number,
  unit?: string,
  style: NumberFormatStyle = "indian",
): string {
  return unit ? `${formatMoney(rupees, style)} ${unit}` : formatMoney(rupees, style);
}
