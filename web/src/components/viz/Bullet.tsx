"use client";

/**
 * A bullet bar: one value against qualitative bands.
 *
 * Stephen Few's construction, reduced to what a table row can carry. The bands
 * are the thresholds that matter (fresh, ageing, stale), the marker is the car.
 * A dealer scanning twelve rows sees which cars are in trouble by *where the
 * markers sit*, without reading a single number — and length and position are
 * the two channels the eye judges most accurately.
 *
 * Bands run light to dark in one hue rather than green-amber-red, so the row
 * does not turn into a traffic light. Severity comes from position.
 */

interface Props {
  value: number;
  max: number;
  /** Band edges, ascending. Two edges give three bands. */
  thresholds: [number, number];
  /** Colour the marker when the value is past the final threshold. */
  tone?: "calm" | "warn" | "neg";
  label?: string;
}

export function Bullet({ value, max, thresholds, tone = "calm", label }: Props) {
  const clamp = (n: number) => Math.max(0, Math.min(1, n / max));
  const [first, second] = thresholds;

  return (
    <span className="bullet" role="img" aria-label={label ?? `${value} of ${max}`}>
      <span className="bullet__track">
        <span className="bullet__band" style={{ width: `${clamp(first) * 100}%` }} />
        <span
          className="bullet__band bullet__band--mid"
          style={{ left: `${clamp(first) * 100}%`, width: `${(clamp(second) - clamp(first)) * 100}%` }}
        />
        <span
          className="bullet__band bullet__band--high"
          style={{ left: `${clamp(second) * 100}%`, width: `${(1 - clamp(second)) * 100}%` }}
        />
        <span
          className={`bullet__marker bullet__marker--${tone}`}
          style={{ left: `${clamp(value) * 100}%` }}
        />
      </span>
    </span>
  );
}

/**
 * A magnitude bar for ranked lists.
 *
 * Length against the largest item in the list, so the eye orders the queue
 * before reading any figure. Deliberately not a full chart — it is one channel
 * doing one job inside a row.
 */
export function Magnitude({
  value,
  max,
  tone = "accent",
}: {
  value: number;
  max: number;
  tone?: "accent" | "pos" | "neg" | "warn";
}) {
  const width = max <= 0 ? 0 : Math.max(2, Math.round((Math.abs(value) / max) * 100));
  return (
    <span className="magnitude" aria-hidden>
      <span className={`magnitude__fill magnitude__fill--${tone}`} style={{ width: `${width}%` }} />
    </span>
  );
}
