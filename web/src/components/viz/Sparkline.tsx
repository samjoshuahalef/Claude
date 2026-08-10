/**
 * A sparkline: shape only.
 *
 * No axes, no labels, no gridlines — the adjacent figure carries the precision
 * and this carries the trajectory. Drawn in a de-emphasis grey so a row of them
 * reads as texture rather than as twelve competing charts, with the final point
 * marked because "where it ended" is the part that matters.
 */

interface Props {
  values: number[];
  width?: number;
  height?: number;
  /** Colour the line when the trend itself is the message. */
  tone?: "muted" | "pos" | "neg";
  label?: string;
}

export function Sparkline({ values, width = 84, height = 24, tone = "muted", label }: Props) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const step = width / (values.length - 1);
  const pad = 3;

  const points = values.map((value, index) => ({
    x: index * step,
    y: pad + (1 - (value - min) / span) * (height - pad * 2),
  }));

  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label ?? "Trend"}
    >
      <path d={d} className={`spark__line spark__line--${tone}`} />
      <circle cx={last.x} cy={last.y} r={2.5} className={`spark__dot spark__dot--${tone}`} />
    </svg>
  );
}
