/**
 * Inflation Simulator engine (F7, docs/02): purchasing power decay and
 * future price of today's goods.
 */

import { assertPaise, roundPaise, type Paise } from "./money";
import { assertRate, assertYears } from "./rates";

export interface InflationYearRow {
  year: number;
  /** What today's amount will actually buy, in today's rupees. */
  powerPaise: Paise;
  /** What today's ₹`amount` of goods will cost. */
  pricePaise: Paise;
}

/** Value of `amountPaise` after `years` of inflation, in today's rupees. */
export function purchasingPowerPaise(
  amountPaise: Paise,
  inflationPct: number,
  years: number,
): Paise {
  assertPaise(amountPaise);
  assertRate(inflationPct);
  assertYears(years);
  return roundPaise(amountPaise / Math.pow(1 + inflationPct / 100, years));
}

/** Cost of today's ₹`amountPaise` basket after `years` of inflation. */
export function futurePricePaise(
  amountPaise: Paise,
  inflationPct: number,
  years: number,
): Paise {
  assertPaise(amountPaise);
  assertRate(inflationPct);
  assertYears(years);
  return roundPaise(amountPaise * Math.pow(1 + inflationPct / 100, years));
}

export function inflationSeries(
  amountPaise: Paise,
  inflationPct: number,
  maxYears: number,
): InflationYearRow[] {
  assertPaise(amountPaise);
  assertRate(inflationPct);
  assertYears(maxYears);
  const rows: InflationYearRow[] = [];
  for (let year = 0; year <= maxYears; year++) {
    rows.push({
      year,
      powerPaise: purchasingPowerPaise(amountPaise, inflationPct, year),
      pricePaise: futurePricePaise(amountPaise, inflationPct, year),
    });
  }
  return rows;
}
