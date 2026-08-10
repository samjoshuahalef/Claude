"use client";

import type { BridgeLine, Currency } from "@/lib/engine/types";
import { formatMoney, formatSignedMoney } from "@/lib/format";

/**
 * The retail-to-ceiling walk-down.
 *
 * This is the entire explanation of the headline number, and it is deliberately
 * arithmetic rather than prose. A dealer can check it against the back of an
 * envelope in fifteen seconds, and every line traces to an input they control.
 * No paragraph of generated text could earn the same trust.
 */

interface Props {
  bridge: BridgeLine[];
  currency: Currency;
}

const BAR_TONE: Record<string, string> = {
  expected_retail: "base",
  vat: "cost",
  recon: "cost",
  warranty: "cost",
  logistics: "cost",
  holding: "cost",
  target_margin: "margin",
  max_buy: "total",
};

export function BridgeWaterfall({ bridge, currency }: Props) {
  const totals = bridge.map((line) => line.runningTotal);
  const max = Math.max(...totals);
  const min = Math.min(...totals);

  /**
   * The axis is zoomed to the descent rather than anchored at zero. Costs here
   * are a small fraction of the retail price, so a zero-based axis renders every
   * deduction as an invisible sliver and the walk-down communicates nothing.
   * The headroom below the lowest total keeps the final bar from touching the
   * left edge.
   */
  const span = Math.max(max - min, 1);
  const axisMin = min - span * 1.1;
  const position = (value: number) => ((value - axisMin) / (max - axisMin)) * 100;

  return (
    <div className="bridge" role="table" aria-label="Retail to ceiling bridge">
      {bridge.map((line) => {
        const isTotal = line.key === "max_buy" || line.key === "expected_retail";
        const previous = line.runningTotal - line.amount;

        // Bars span from the previous running total to the new one, so a cost
        // reads as a segment removed rather than a bar in its own right.
        // The opening and closing rows are totals, not movements: both are drawn
        // as full columns from the baseline so the eye reads "start" and "end".
        const from = isTotal ? axisMin : Math.min(previous, line.runningTotal);
        const to = isTotal ? line.runningTotal : Math.max(previous, line.runningTotal);
        const left = position(from);
        const width = Math.max(position(to) - left, 0.8);

        return (
          <div
            key={line.key}
            className={`bridge__row${line.key === "max_buy" ? " bridge__row--total" : ""}`}
            role="row"
          >
            <span className="bridge__label" role="cell">
              {line.label}
            </span>

            <span className="bridge__track" role="cell" aria-hidden>
              <span
                className={`bridge__bar bridge__bar--${BAR_TONE[line.key] ?? "cost"}`}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            </span>

            <span className="bridge__value num" role="cell">
              {isTotal
                ? formatMoney(line.runningTotal, currency)
                : formatSignedMoney(line.amount, currency)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
