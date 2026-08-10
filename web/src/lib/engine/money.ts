/**
 * Money handling.
 *
 * All monetary values in the engine are integer Rappen (1/100 CHF). Floating
 * point francs accumulate error across a bridge of eight lines, and a ceiling
 * that is two rappen off is a ceiling a dealer stops trusting.
 */

import type { Currency } from "./types";

export const RAPPEN = 100;

/** Swiss standard VAT rate since 1 January 2024. */
export const CH_VAT_RATE = 0.081;

export function francs(amount: number): number {
  return Math.round(amount * RAPPEN);
}

export function toFrancs(rappen: number): number {
  return rappen / RAPPEN;
}

/** Round to the nearest whole franc — the granularity dealers actually think in. */
export function roundToFranc(rappen: number): number {
  return Math.round(rappen / RAPPEN) * RAPPEN;
}

/**
 * Round a price to the nearest 100 francs, the convention for a buying ceiling.
 * Always rounds *down* so rounding never pushes the dealer over their limit.
 */
export function roundCeilingDown(rappen: number): number {
  const step = 100 * RAPPEN;
  return Math.floor(rappen / step) * step;
}

/** Round a retail asking price to the psychological 900-ending Swiss dealers use. */
export function roundToAskingPrice(rappen: number): number {
  const thousand = 1000 * RAPPEN;
  const base = Math.floor(rappen / thousand) * thousand;
  const remainder = rappen - base;
  // Snap to the nearest of x'400 / x'900 / (x+1)'400.
  if (remainder < 400 * RAPPEN) return base - 100 * RAPPEN; // previous x'900
  if (remainder < 900 * RAPPEN) return base + 400 * RAPPEN;
  return base + 900 * RAPPEN;
}

/**
 * Swiss thousands separator: U+2019, per the Federal Chancellery's style rules.
 *
 * Grouping is done by hand rather than through `Intl`, deliberately. Node's ICU
 * and the browser's disagree about this character for `de-CH` — one emits U+0027,
 * the other U+2019 — which produced a server/client hydration mismatch on every
 * price on the page. Formatting a figure identically everywhere is not a
 * cosmetic concern here: a recommendation that must be replayable months later
 * cannot depend on which ICU build rendered it.
 */
const GROUP_SEPARATOR = "’";

function groupDigits(whole: string): string {
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
}

/**
 * Swiss-grouped integer, e.g. "62’000". Use this anywhere a number is shown —
 * `toLocaleString` reintroduces the ICU discrepancy this file exists to avoid.
 */
export function formatNumber(value: number): string {
  const negative = value < 0;
  return `${negative ? "−" : ""}${groupDigits(String(Math.abs(Math.round(value))))}`;
}

/** "CHF 48'200" — Swiss apostrophe grouping, no decimals for whole francs. */
export function formatMoney(rappen: number, currency: Currency = "CHF"): string {
  const negative = rappen < 0;
  const absolute = Math.abs(rappen);
  const whole = Math.floor(absolute / RAPPEN);
  const cents = absolute % RAPPEN;

  const digits =
    cents === 0
      ? groupDigits(String(whole))
      : `${groupDigits(String(whole))}.${String(cents).padStart(2, "0")}`;

  return `${negative ? "−" : ""}${currency} ${digits}`;
}

/** Signed, for bridge lines: "−CHF 1'850" / "+CHF 400". */
export function formatSignedMoney(rappen: number, currency: Currency = "CHF"): string {
  if (rappen === 0) return formatMoney(0, currency);
  const sign = rappen > 0 ? "+" : "−";
  return `${sign}${formatMoney(Math.abs(rappen), currency)}`;
}

/**
 * VAT payable expressed as a fraction of the taxed base.
 * A gross (VAT-inclusive) amount of X contains X * k of tax, where k = r/(1+r).
 */
export function vatFraction(rate: number = CH_VAT_RATE): number {
  return rate / (1 + rate);
}
