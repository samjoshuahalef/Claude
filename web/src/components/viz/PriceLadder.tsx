"use client";

import type { Currency } from "@/lib/engine/types";
import { formatMoney } from "@/lib/format";

/**
 * The price ladder.
 *
 * Four prices govern an acquisition — what it retails for, what you may pay,
 * what you must never exceed, and what the seller is asking. Presented as four
 * stat boxes they are four numbers to read and mentally sort. Presented on one
 * axis they are a picture: the eye reads *position* before it reads digits, and
 * position is the most accurate visual channel there is for quantity.
 *
 * So the dealer's question — "is their price inside my limit?" — stops being
 * arithmetic and becomes a glance. The marker is either in the green band or it
 * is not.
 *
 * This is a range plot with qualitative bands and a value marker, the same
 * construction as a bullet graph, laid out along the money axis rather than a
 * performance one.
 */

interface Props {
  maxBuyPrice: number;
  walkAwayPrice: number;
  expectedRetailPrice: number;
  /** What the seller wants, when the dealer has entered it. */
  askingPrice: number | null;
  currency: Currency;
}

const HEIGHT = 108;
const TRACK_Y = 46;
const TRACK_H = 26;
const PAD_X = 12;

export function PriceLadder({
  maxBuyPrice,
  walkAwayPrice,
  expectedRetailPrice,
  askingPrice,
  currency,
}: Props) {
  // The axis spans from a little below the ceiling to the retail price, because
  // that is the whole of the decision. Prices outside it are not interesting.
  const low = Math.min(maxBuyPrice * 0.9, askingPrice ?? Infinity);
  const high = Math.max(expectedRetailPrice * 1.02, askingPrice ?? 0);
  const span = Math.max(high - low, 1);

  const x = (value: number) => PAD_X + ((value - low) / span) * (1000 - PAD_X * 2);

  const ceilingX = x(maxBuyPrice);
  const walkX = x(walkAwayPrice);
  const retailX = x(expectedRetailPrice);
  const askX = askingPrice === null ? null : x(askingPrice);

  const verdict =
    askingPrice === null
      ? null
      : askingPrice <= maxBuyPrice
        ? "pos"
        : askingPrice <= walkAwayPrice
          ? "warn"
          : "neg";

  return (
    <figure className="ladder" aria-label="Where each price sits">
      <svg viewBox={`0 0 1000 ${HEIGHT}`} className="ladder__svg" role="img">
        {/* Qualitative bands, light to dark as the deal gets worse. A single
            hue would not carry meaning here — these are states, not magnitudes. */}
        <rect
          x={PAD_X}
          y={TRACK_Y}
          width={Math.max(ceilingX - PAD_X, 0)}
          height={TRACK_H}
          rx={3}
          className="ladder__band ladder__band--pos"
        />
        <rect
          x={ceilingX}
          y={TRACK_Y}
          width={Math.max(walkX - ceilingX, 0)}
          height={TRACK_H}
          className="ladder__band ladder__band--warn"
        />
        <rect
          x={walkX}
          y={TRACK_Y}
          width={Math.max(1000 - PAD_X - walkX, 0)}
          height={TRACK_H}
          rx={3}
          className="ladder__band ladder__band--neg"
        />

        {/* The ceiling: the number the whole screen exists to produce, so it is
            the only full-height rule on the axis. */}
        <line
          x1={ceilingX}
          x2={ceilingX}
          y1={TRACK_Y - 12}
          y2={TRACK_Y + TRACK_H + 8}
          className="ladder__rule ladder__rule--ceiling"
        />
        <text x={ceilingX} y={TRACK_Y - 18} className="ladder__label ladder__label--ceiling">
          Your ceiling
        </text>
        <text x={ceilingX} y={TRACK_Y - 32} className="ladder__value">
          {formatMoney(maxBuyPrice, currency)}
        </text>

        <line
          x1={walkX}
          x2={walkX}
          y1={TRACK_Y}
          y2={TRACK_Y + TRACK_H}
          className="ladder__rule ladder__rule--walk"
        />

        {/* Retail sits at the far end as the reference the margin is carved out
            of; a diamond rather than a rule, because it is context, not a limit. */}
        <path
          d={`M${retailX} ${TRACK_Y + TRACK_H / 2 - 6} L${retailX + 6} ${TRACK_Y + TRACK_H / 2} L${retailX} ${TRACK_Y + TRACK_H / 2 + 6} L${retailX - 6} ${TRACK_Y + TRACK_H / 2} Z`}
          className="ladder__retail"
        />

        {askX !== null && (
          <g>
            <line
              x1={askX}
              x2={askX}
              y1={TRACK_Y - 4}
              y2={TRACK_Y + TRACK_H + 14}
              className={`ladder__rule ladder__rule--ask ladder__rule--${verdict}`}
            />
            <circle
              cx={askX}
              cy={TRACK_Y + TRACK_H / 2}
              r={7}
              className={`ladder__ask ladder__ask--${verdict}`}
            />
            <text
              x={askX}
              y={TRACK_Y + TRACK_H + 30}
              className={`ladder__value ladder__value--${verdict}`}
            >
              {formatMoney(askingPrice as number, currency)}
            </text>
            <text x={askX} y={TRACK_Y + TRACK_H + 44} className="ladder__label">
              Their price
            </text>
          </g>
        )}
      </svg>

      <figcaption className="ladder__legend">
        <LegendItem tone="pos" label="Your margin holds" />
        <LegendItem tone="warn" label="Below target, above minimum" />
        <LegendItem tone="neg" label="Never pay this" />
        <span className="ladder__legend-retail">
          <span className="ladder__legend-diamond" aria-hidden />
          Retail {formatMoney(expectedRetailPrice, currency)}
        </span>
      </figcaption>
    </figure>
  );
}

function LegendItem({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="ladder__legend-item">
      <span className={`ladder__legend-swatch ladder__legend-swatch--${tone}`} aria-hidden />
      {label}
    </span>
  );
}
