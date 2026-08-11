import React from "react";
import { AsciiField } from "./AsciiField";

/**
 * The "Scraped pages" chart: a heat stroke over a heat-to-transparent fill,
 * sitting on the same ASCII field used behind page headers.
 *
 * The path is emitted as dense straight segments rather than smoothed
 * beziers — control-point smoothing over a sampled curve puts visible
 * ripples on the rising edge.
 */
export function AreaChart({
  data,
  labels,
  height = 190,
}: {
  data: number[];
  labels: [string, string, string];
  height?: number;
}) {
  const width = 720;
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1);

  const points = data.map((value, index) => {
    const x = index * step;
    const y = height - (value / max) * (height - 10) - 2;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  const line = points.join(" ");

  return (
    <div>
      <div className="relative" style={{ height }}>
        <div className="overlay flex items-center overflow-hidden opacity-40">
          <AsciiField rows={16} cols={150} shape="field" seed={7} />
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="relative h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="fc-area" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-heat-100)"
                stopOpacity="0.16"
              />
              <stop
                offset="100%"
                stopColor="var(--color-heat-100)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          <path
            d={`${line} L ${width} ${height} L 0 ${height} Z`}
            fill="url(#fc-area)"
          />
          <path
            d={line}
            fill="none"
            stroke="var(--color-heat-100)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="flex justify-between border-t-1 border-border-faint pt-8 font-mono text-mono-x-small text-black-alpha-40">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
