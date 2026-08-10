/**
 * Risk flags.
 *
 * Each flag is a short, specific statement tied to a measured quantity. No
 * generated prose, no hedging language, no "market conditions may vary". If we
 * cannot point at the number that produced a flag, the flag does not exist.
 */

import type { RiskFlag, SpeedModel, Vehicle, WeightedComparable } from "./types";
import { daysBetween, median, monthsBetween } from "./stats";
import { dispersionOf } from "./valuation";

export interface RiskInputs {
  subject: Vehicle;
  set: WeightedComparable[];
  speed: SpeedModel;
  asOf: string;
  /** Live listings for this model now, vs. the same window 30 days ago. */
  supplyChange?: { current: number; previous: number };
}

export function assessRisks(inputs: RiskInputs): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const { subject, set, speed, asOf, supplyChange } = inputs;

  const liveCount = set.filter((item) => item.comparable.delistedAt === null).length;
  const soldCount = set.length - liveCount;

  // Thin liquidity: few observed sales relative to standing supply means the
  // car is slow to clear whatever the price says.
  if (soldCount > 0 && liveCount / Math.max(soldCount, 1) > 3) {
    flags.push({
      key: "thin_liquidity",
      severity: "warning",
      message: `${liveCount} live listings against ${soldCount} observed sales — slow-moving model`,
    });
  }

  if (speed.medianDays > 110) {
    flags.push({
      key: "thin_liquidity",
      severity: "warning",
      message: `Median time to sale is ${speed.medianDays} days at market price`,
    });
  }

  if (supplyChange && supplyChange.previous > 0) {
    const change = (supplyChange.current - supplyChange.previous) / supplyChange.previous;
    if (change > 0.15) {
      flags.push({
        key: "supply_rising",
        severity: change > 0.3 ? "critical" : "warning",
        message: `Supply up ${(change * 100).toFixed(0)}% in 30 days — buy more conservatively`,
      });
    }
  }

  // Falling asking prices across the comparable set: the market is repricing
  // beneath us, so today's retail estimate will be stale by the time we sell.
  const drift = priceDrift(set);
  if (drift !== null && drift < -0.02) {
    flags.push({
      key: "price_falling",
      severity: drift < -0.05 ? "critical" : "warning",
      message: `Asking prices down ${(Math.abs(drift) * 100).toFixed(1)}% across live listings`,
    });
  }

  const ageMonths = monthsBetween(subject.firstRegistration, asOf);
  const annualKm = ageMonths > 0 ? subject.mileageKm / (ageMonths / 12) : 0;
  if (annualKm > 25_000) {
    flags.push({
      key: "high_mileage",
      severity: "warning",
      message: `${Math.round(annualKm / 1000)}k km/year — above-average use narrows the buyer pool`,
    });
  }

  const dispersion = dispersionOf(set);
  if (dispersion > 0.22) {
    flags.push({
      key: "wide_dispersion",
      severity: "info",
      message: `Wide price spread (${(dispersion * 100).toFixed(0)}%) — condition and history will decide the sale`,
    });
  }

  if (set.length > 0) {
    const medianAge = median(
      set.map((item) => daysBetween(item.comparable.delistedAt ?? item.comparable.listedAt, asOf)),
    );
    if (medianAge > 55) {
      flags.push({
        key: "stale_comparables",
        severity: "info",
        message: `Comparables average ${Math.round(medianAge)} days old`,
      });
    }
  }

  return flags;
}

/**
 * Median relative price change across listings that have moved their price.
 * Listings that never repriced are excluded — including them would dilute the
 * signal toward zero and hide exactly the movement we are looking for.
 */
function priceDrift(set: WeightedComparable[]): number | null {
  const changes: number[] = [];
  for (const item of set) {
    const history = item.comparable.priceHistory;
    if (history.length < 2) continue;
    const first = history[0].price;
    const last = history[history.length - 1].price;
    if (first <= 0) continue;
    changes.push((last - first) / first);
  }
  if (changes.length < 3) return null;
  return median(changes);
}
