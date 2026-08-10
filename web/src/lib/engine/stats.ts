/**
 * Statistical primitives.
 *
 * Deliberately robust rather than clever: the comparable sets we work with are
 * small (often 8–40 listings) and contain genuine outliers — misdescribed cars,
 * damaged stock, dealers fishing with an absurd price. Means and ordinary least
 * squares both chase those. Weighted medians and Theil–Sen do not.
 */

export interface WeightedValue {
  value: number;
  weight: number;
}

/**
 * Weighted median. With small samples this is materially more stable than a
 * weighted mean, and it is the number the retail estimate is built on.
 */
export function weightedMedian(items: WeightedValue[]): number {
  const usable = items.filter((i) => i.weight > 0 && Number.isFinite(i.value));
  if (usable.length === 0) return 0;
  if (usable.length === 1) return usable[0].value;

  const sorted = [...usable].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, i) => sum + i.weight, 0);
  const half = totalWeight / 2;

  let cumulative = 0;
  for (let i = 0; i < sorted.length; i++) {
    cumulative += sorted[i].weight;
    if (cumulative >= half) {
      // Interpolate across the crossing point so the result moves smoothly as
      // weights change, rather than jumping between two comparables.
      const previous = cumulative - sorted[i].weight;
      if (i + 1 < sorted.length && Math.abs(cumulative - half) < 1e-9) {
        return (sorted[i].value + sorted[i + 1].value) / 2;
      }
      const span = cumulative - previous;
      const position = span === 0 ? 0 : (half - previous) / span;
      if (i > 0 && position < 0.5) {
        const t = position + 0.5;
        return sorted[i - 1].value + (sorted[i].value - sorted[i - 1].value) * t;
      }
      return sorted[i].value;
    }
  }
  return sorted[sorted.length - 1].value;
}

/** Unweighted quantile with linear interpolation. `q` in 0..1. */
export function quantile(values: number[], q: number): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function interquartileRange(values: number[]): number {
  return quantile(values, 0.75) - quantile(values, 0.25);
}

/**
 * Where `value` sits within `values`, as a 0..1 percentile.
 * Used to place a candidate asking price inside the live market.
 */
export function percentileOf(values: number[], value: number): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return 0.5;
  if (value <= sorted[0]) return 0;
  if (value >= sorted[sorted.length - 1]) return 1;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (value >= sorted[i] && value <= sorted[i + 1]) {
      const span = sorted[i + 1] - sorted[i];
      const within = span === 0 ? 0 : (value - sorted[i]) / span;
      return (i + within) / (sorted.length - 1);
    }
  }
  return 0.5;
}

export interface Point {
  x: number;
  y: number;
}

export interface LineFit {
  slope: number;
  intercept: number;
  /** Observations used. Callers fall back to priors when this is too small. */
  n: number;
}

/**
 * Theil–Sen slope estimator: the median of pairwise slopes.
 *
 * Chosen over least squares because it tolerates up to ~29% contaminated data
 * without the fit collapsing. One damaged car listed at half price should not
 * be able to swing the mileage coefficient for an entire model.
 */
export function theilSen(points: Point[]): LineFit {
  const usable = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (usable.length < 2) {
    return { slope: 0, intercept: usable[0]?.y ?? 0, n: usable.length };
  }

  const slopes: number[] = [];
  for (let i = 0; i < usable.length; i++) {
    for (let j = i + 1; j < usable.length; j++) {
      const dx = usable[j].x - usable[i].x;
      if (Math.abs(dx) < 1e-9) continue;
      slopes.push((usable[j].y - usable[i].y) / dx);
    }
  }
  if (slopes.length === 0) {
    return { slope: 0, intercept: median(usable.map((p) => p.y)), n: usable.length };
  }

  const slope = median(slopes);
  const intercept = median(usable.map((p) => p.y - slope * p.x));
  return { slope, intercept, n: usable.length };
}

export function median(values: number[]): number {
  return quantile(values, 0.5);
}

export function mean(values: number[]): number {
  const usable = values.filter(Number.isFinite);
  if (usable.length === 0) return 0;
  return usable.reduce((sum, v) => sum + v, 0) / usable.length;
}

/** Median absolute deviation — a robust standard-deviation analogue. */
export function medianAbsoluteDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const m = median(values);
  return median(values.map((v) => Math.abs(v - m)));
}

/**
 * Outlier test based on MAD rather than standard deviation, for the same
 * robustness reason. The 1.4826 factor makes MAD comparable to sigma for
 * normally distributed data; 3.5 is a conventional threshold.
 */
export function isOutlier(value: number, values: number[], threshold = 3.5): boolean {
  const mad = medianAbsoluteDeviation(values);
  if (mad === 0) return false;
  const score = Math.abs(value - median(values)) / (1.4826 * mad);
  return score > threshold;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Days between two ISO dates. Positive when `to` is later. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** Months between an ISO month ("2021-03") and an ISO date. */
export function monthsBetween(fromMonth: string, toDate: string): number {
  const [fy, fm] = fromMonth.split("-").map(Number);
  const [ty, tm] = toDate.split("-").map(Number);
  if (!fy || !fm || !ty || !tm) return 0;
  return (ty - fy) * 12 + (tm - fm);
}
