/**
 * Money and figure rendering.
 *
 * Centralised so the treatment is identical everywhere: tabular figures, the
 * currency code stepped back so the digits carry the eye, and a true minus sign
 * rather than a hyphen — a hyphen is visibly short and sits at the wrong height
 * against lining numerals.
 */

import { formatMoney, formatNumber } from "@/lib/engine/money";
import type { Currency } from "@/lib/engine/types";

export function Money({
  value,
  currency = "CHF",
  showCode = true,
  className = "",
}: {
  value: number;
  currency?: Currency;
  showCode?: boolean;
  className?: string;
}) {
  const formatted = formatMoney(value, currency);
  const negative = formatted.startsWith("−");
  const body = negative ? formatted.slice(1) : formatted;
  const [code, ...rest] = body.split(" ");
  const digits = rest.join(" ");

  return (
    <span className={`num ${className}`}>
      {negative && "−"}
      {showCode && <span className="cur">{code}</span>}
      {digits}
    </span>
  );
}

/**
 * A change, not a balance. Absolute balances are never coloured — only
 * movements are, and the glyph carries the signal so the table still reads with
 * colour removed.
 */
export function Delta({
  value,
  format = "money",
  currency = "CHF",
  invert = false,
}: {
  value: number;
  format?: "money" | "percent" | "days";
  currency?: Currency;
  /** When lower is better — days on market, cost. */
  invert?: boolean;
}) {
  if (value === 0) return <span className="num t-muted">—</span>;
  const good = invert ? value < 0 : value > 0;
  const magnitude =
    format === "money"
      ? formatMoney(Math.abs(value), currency)
      : format === "percent"
        ? `${(Math.abs(value) * 100).toFixed(1)}%`
        : `${formatNumber(Math.abs(value))}d`;

  return (
    <span className={`num ${good ? "t-pos" : "t-neg"}`}>
      {value > 0 ? "▲" : "▼"} {magnitude}
    </span>
  );
}

export function Percent({ value, decimals = 0 }: { value: number; decimals?: number }) {
  return <span className="num">{(value * 100).toFixed(decimals)}%</span>;
}

/** An absent value. Blank cells read as a bug; an em-dash reads as "unknown". */
export function Null() {
  return <span className="td-null">—</span>;
}
