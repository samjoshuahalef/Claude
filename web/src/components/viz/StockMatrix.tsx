"use client";

import type { StockRecommendation } from "@/lib/engine/stock";
import { formatMoney } from "@/lib/format";

/**
 * Stock triage.
 *
 * A sorted table answers "which car is worst on one measure". Only a plot
 * answers the question a dealer actually has, which is about the *combination*:
 * which cars are old AND unproductive, and which are quietly fine despite
 * looking old. Those off-diagonal cases are invisible in any single ordering.
 *
 * Conventions held deliberately:
 *  - Splits are business thresholds (60 days, 35% return), not medians. A median
 *    split moves every time the data moves, so nothing is comparable week to
 *    week.
 *  - Only the problem quadrant is shaded. Four shaded regions is four regions of
 *    interest, which is none.
 *  - Dot area encodes capital, on a square-root scale, and it is tertiary only —
 *    area is not read pre-attentively and must never carry the decision.
 *  - Every dot carries a surface ring, which is what keeps overlapping cars
 *    countable.
 */

const W = 720;
const H = 300;
const PAD = { top: 18, right: 20, bottom: 40, left: 48 };

const AGE_THRESHOLD = 60;
const RETURN_THRESHOLD = 0.35;

interface Props {
  stock: StockRecommendation[];
}

export function StockMatrix({ stock }: Props) {
  if (stock.length === 0) return null;

  const maxAge = Math.max(...stock.map((r) => r.daysInStock), 120) * 1.08;
  const returns = stock.map((r) => r.holding.annualisedReturn);
  const maxReturn = Math.max(...returns, 0.8) * 1.1;
  const minReturn = Math.min(...returns, 0) * 1.15;
  const maxCapital = Math.max(...stock.map((r) => r.capitalEmployed), 1);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (days: number) => PAD.left + (days / maxAge) * plotW;
  const y = (ret: number) =>
    PAD.top + plotH - ((ret - minReturn) / (maxReturn - minReturn)) * plotH;
  const r = (capital: number) => 5 + Math.sqrt(capital / maxCapital) * 6;

  const problemX = x(AGE_THRESHOLD);
  const problemY = y(RETURN_THRESHOLD);

  // Only the worst few are labelled. Labelling every car reproduces the table.
  const worst = [...stock]
    .filter((review) => review.daysInStock >= AGE_THRESHOLD)
    .sort((a, b) => a.holding.annualisedReturn - b.holding.annualisedReturn)
    .slice(0, 3);
  const labelled = new Set(worst.map((review) => review.item.id));

  return (
    <figure className="matrix">
      <svg viewBox={`0 0 ${W} ${H}`} className="matrix__svg" role="img" aria-label="Days in stock against return on capital">
        {/* The one region of interest: old and unproductive. */}
        <rect
          x={problemX}
          y={problemY}
          width={Math.max(W - PAD.right - problemX, 0)}
          height={Math.max(PAD.top + plotH - problemY, 0)}
          className="matrix__problem"
        />

        <line x1={problemX} x2={problemX} y1={PAD.top} y2={PAD.top + plotH} className="matrix__split" />
        <line x1={PAD.left} x2={W - PAD.right} y1={problemY} y2={problemY} className="matrix__split" />

        {/* A zero rule, because the sign of a return is a different fact from
            its size and the eye should not have to read the axis to find it. */}
        {minReturn < 0 && (
          <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} className="matrix__zero" />
        )}

        <text x={W - PAD.right - 6} y={problemY + 16} className="matrix__quadrant" textAnchor="end">
          Old and unproductive
        </text>
        <text x={PAD.left + 6} y={PAD.top + 12} className="matrix__quadrant">
          Fresh and earning
        </text>

        {stock.map((review) => {
          const cx = x(review.daysInStock);
          const cy = y(review.holding.annualisedReturn);
          const problem =
            review.daysInStock >= AGE_THRESHOLD &&
            review.holding.annualisedReturn < RETURN_THRESHOLD;
          return (
            <g key={review.item.id}>
              {/* Described with aria-label rather than an SVG <title> child:
                  React treats <title> as hoistable document metadata and lifts
                  it into <head> on the client, which desynchronises hydration. */}
              <circle
                cx={cx}
                cy={cy}
                r={r(review.capitalEmployed)}
                className={`matrix__dot${problem ? " matrix__dot--problem" : ""}`}
                role="img"
                aria-label={`${review.item.vehicle.make} ${review.item.vehicle.model}: ${review.daysInStock} days in stock, ${(review.holding.annualisedReturn * 100).toFixed(0)}% return, ${formatMoney(review.capitalEmployed)} employed`}
              />
              {labelled.has(review.item.id) && (
                <text
                  x={cx}
                  y={
                    cy > PAD.top + plotH * 0.55
                      ? cy - r(review.capitalEmployed) - 7
                      : cy + r(review.capitalEmployed) + 13
                  }
                  className="matrix__label"
                  textAnchor={cx > W - PAD.right - 70 ? "end" : cx < PAD.left + 70 ? "start" : "middle"}
                >
                  {review.item.vehicle.make} {review.item.vehicle.model}
                </text>
              )}
            </g>
          );
        })}

        {[0, 60, 120, 180].filter((d) => d <= maxAge).map((d) => (
          <text key={d} x={x(d)} y={H - 12} className="matrix__axis" textAnchor="middle">
            {d}d
          </text>
        ))}
        {[minReturn < 0 ? 0 : null, 0.35, Math.round(maxReturn * 10) / 10]
          .filter((v): v is number => v !== null)
          .map((v) => (
            <text key={v} x={PAD.left - 8} y={y(v) + 3.5} className="matrix__axis" textAnchor="end">
              {(v * 100).toFixed(0)}%
            </text>
          ))}
      </svg>

      <figcaption className="matrix__caption">
        Each car is one dot; size is the capital tied up in it. Split at 60 days and a 35%
        annualised return — your thresholds, not the fleet average, so the picture is comparable
        week to week.
      </figcaption>
    </figure>
  );
}
