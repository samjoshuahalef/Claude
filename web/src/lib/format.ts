/**
 * Display formatting.
 *
 * Kept apart from the engine on purpose: the engine deals in integer Rappen and
 * knows nothing about presentation, and every string a dealer reads is built
 * here so tone and precision stay consistent across the product.
 */

import type { Currency } from "@/lib/engine/types";
import { formatMoney, formatNumber, toFrancs } from "@/lib/engine/money";

export { formatMoney, formatNumber, formatSignedMoney } from "@/lib/engine/money";

/** "CHF 47'500" split so the currency can be set in a quieter weight. */
export function splitMoney(rappen: number, currency: Currency = "CHF"): {
  currency: string;
  amount: string;
} {
  const formatted = formatMoney(rappen, currency);
  const [code, ...rest] = formatted.split(" ");
  return { currency: code, amount: rest.join(" ") };
}

export function formatKm(km: number): string {
  return `${formatNumber(km)} km`;
}

export function formatDays(days: number): string {
  return `${Math.round(days)} ${days === 1 ? "day" : "days"}`;
}

export function formatPercent(fraction: number, decimals = 0): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}

/** "3y 6m" — how dealers actually describe a car's age. */
export function formatAge(months: number): string {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (years === 0) return `${remainder}m`;
  if (remainder === 0) return `${years}y`;
  return `${years}y ${remainder}m`;
}

/**
 * Month names are spelled out rather than taken from `Intl.DateTimeFormat` for
 * the same reason money is grouped by hand: ICU builds differ between Node and
 * the browser, and a date that renders differently on the server than on the
 * client is a hydration mismatch on every row of the evidence table.
 */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Apr 2022" from an ISO month. */
export function formatRegistration(isoMonth: string): string {
  const [year, month] = isoMonth.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return isoMonth;
  return `${MONTHS[month - 1]} ${year}`;
}

/** "12 Jun" for compact listing dates. */
export function formatShortDate(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  if (!month || !day || month < 1 || month > 12) return iso;
  return `${day} ${MONTHS[month - 1]}`;
}

/** Compact franc figure for chart axes: "48k". */
export function formatCompactFrancs(rappen: number): string {
  const value = toFrancs(rappen);
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}k`;
  return String(Math.round(value));
}

export function ordinalPercentile(fraction: number): string {
  const percentile = Math.round(fraction * 100);
  if (percentile <= 15) return "cheapest in market";
  if (percentile <= 40) return "below market middle";
  if (percentile <= 60) return "at market middle";
  if (percentile <= 85) return "above market middle";
  return "most expensive in market";
}
