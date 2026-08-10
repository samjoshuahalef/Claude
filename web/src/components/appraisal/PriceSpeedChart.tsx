"use client";

import { useMemo, useState } from "react";
import type { Currency, PriceSpeedPoint } from "@/lib/engine/types";
import {
  formatCompactFrancs,
  formatDays,
  formatMoney,
  ordinalPercentile,
} from "@/lib/format";

/**
 * Price against selling speed.
 *
 * The trade-off dealers make constantly and almost never see drawn: every extra
 * franc of asking price is paid for in days on the forecourt, and every day has
 * a cost. Rendered as inline SVG rather than a chart library — one dependency
 * fewer, no runtime cost, and full control over how the curve reads.
 */

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 20, bottom: 34, left: 44 };

interface Props {
  curve: PriceSpeedPoint[];
  currency: Currency;
  /** The engine's recommended asking price, marked on the curve. */
  recommendedPrice: number;
}

export function PriceSpeedChart({ curve, currency, recommendedPrice }: Props) {
  const nearestToRecommended = useMemo(() => {
    let best = 0;
    for (let i = 1; i < curve.length; i++) {
      if (
        Math.abs(curve[i].retailPrice - recommendedPrice) <
        Math.abs(curve[best].retailPrice - recommendedPrice)
      ) {
        best = i;
      }
    }
    return best;
  }, [curve, recommendedPrice]);

  const [activeIndex, setActiveIndex] = useState(nearestToRecommended);
  const active = curve[activeIndex] ?? curve[0];

  const geometry = useMemo(() => {
    const prices = curve.map((p) => p.retailPrice);
    const days = curve.map((p) => p.expectedDays);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const maxDays = Math.max(...days) * 1.12;
    const minDays = Math.min(...days) * 0.85;

    const plotW = WIDTH - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;

    const x = (price: number) =>
      PAD.left + ((price - minPrice) / Math.max(maxPrice - minPrice, 1)) * plotW;
    const y = (d: number) =>
      PAD.top + plotH - ((d - minDays) / Math.max(maxDays - minDays, 1)) * plotH;

    const points = curve.map((p) => ({ x: x(p.retailPrice), y: y(p.expectedDays) }));
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L${points[points.length - 1].x.toFixed(1)},${PAD.top + plotH} L${points[0].x.toFixed(1)},${PAD.top + plotH} Z`;

    const gridDays = [minDays, (minDays + maxDays) / 2, maxDays].map((d) => ({
      value: Math.round(d),
      y: y(d),
    }));

    return { x, y, points, line, area, gridDays, plotH };
  }, [curve]);

  return (
    <div className="af-stack-4">
      <svg
        className="af-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Expected days to sale at each asking price"
      >
        {geometry.gridDays.map((grid) => (
          <g key={grid.value}>
            <line
              className="af-chart__grid"
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={grid.y}
              y2={grid.y}
            />
            <text className="af-chart__axis" x={PAD.left - 8} y={grid.y + 3.5} textAnchor="end">
              {grid.value}d
            </text>
          </g>
        ))}

        <path className="af-chart__area" d={geometry.area} />
        <path className="af-chart__line" d={geometry.line} />

        {/* Where the engine says to price. The reference the eye returns to. */}
        <line
          className="af-chart__marker"
          x1={geometry.x(recommendedPrice)}
          x2={geometry.x(recommendedPrice)}
          y1={PAD.top}
          y2={PAD.top + geometry.plotH}
        />

        {curve.map((point, index) => (
          <g key={point.retailPrice}>
            <rect
              className="af-chart__hit"
              x={geometry.points[index].x - 22}
              y={PAD.top}
              width={44}
              height={geometry.plotH}
              tabIndex={0}
              role="button"
              aria-label={`${formatMoney(point.retailPrice, currency)}, ${formatDays(point.expectedDays)}`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
            />
            <circle
              className={`af-chart__point${index === activeIndex ? " af-chart__point--active" : ""}`}
              cx={geometry.points[index].x}
              cy={geometry.points[index].y}
              r={index === activeIndex ? 5.5 : 3.5}
            />
            <text
              className="af-chart__axis"
              x={geometry.points[index].x}
              y={HEIGHT - 12}
              textAnchor="middle"
            >
              {formatCompactFrancs(point.retailPrice)}
            </text>
          </g>
        ))}
      </svg>

      <div className="af-decision__stats">
        <ReadoutStat label="Asking price" value={formatMoney(active.retailPrice, currency)} note={ordinalPercentile(active.marketPercentile)} />
        <ReadoutStat label="Expected to sell in" value={formatDays(active.expectedDays)} note="Median for this price position" />
        <ReadoutStat
          label="Gross at your ceiling"
          value={formatMoney(active.grossProfitAtMaxBuy, currency)}
          note="After VAT, prep, warranty and holding"
          tone={active.grossProfitAtMaxBuy > 0 ? "go" : "stop"}
        />
      </div>
    </div>
  );
}

function ReadoutStat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "go" | "stop";
}) {
  return (
    <div className={`af-stat${tone ? ` af-stat--${tone}` : ""}`}>
      <span className="af-stat__k">{label}</span>
      <span className="af-stat__v af-num">{value}</span>
      <span className="af-stat__note">{note}</span>
    </div>
  );
}
