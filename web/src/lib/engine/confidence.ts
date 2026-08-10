/**
 * Confidence.
 *
 * The rule this file enforces: confidence is computed from the evidence, and
 * when the evidence is thin the product says so rather than producing a
 * decisive-looking number. A dealer who is confidently misled once stops using
 * the software, permanently — so a visible "we don't know" is cheaper than a
 * plausible wrong answer.
 */

import type {
  Confidence,
  ConfidenceBand,
  ConfidenceDriver,
  InsufficiencyReason,
  SpeedModel,
  WeightedComparable,
} from "./types";
import { clamp, daysBetween, median } from "./stats";
import { dispersionOf } from "./valuation";

/** Below this we refuse to produce a ceiling at all. */
export const MIN_COMPARABLES = 5;
/** Above this dispersion the "market price" is not a meaningful concept. */
export const MAX_DISPERSION = 0.35;
/** Median comparable older than this and we are describing a market that moved. */
export const MAX_MEDIAN_STALENESS_DAYS = 75;

interface DriverSpec {
  driver: ConfidenceDriver;
  weight: number;
}

export function assessConfidence(
  set: WeightedComparable[],
  speed: SpeedModel,
  asOf: string,
): Confidence {
  const specs: DriverSpec[] = [
    sampleSizeDriver(set),
    dispersionDriver(set),
    recencyDriver(set, asOf),
    matchQualityDriver(set),
    saleObservationDriver(speed),
  ];

  const totalWeight = specs.reduce((sum, s) => sum + s.weight, 0);
  const weighted = specs.reduce((sum, s) => sum + s.driver.score * s.weight, 0) / totalWeight;
  const score = Math.round(clamp(weighted, 0, 1) * 100);

  return {
    score,
    band: bandFor(score),
    drivers: specs.map((s) => s.driver),
  };
}

function bandFor(score: number): ConfidenceBand {
  if (score >= 72) return "high";
  if (score >= 48) return "moderate";
  return "low";
}

/**
 * Sample size saturates rather than growing linearly: going from 6 to 15
 * comparables changes the answer a great deal, 40 to 60 changes almost nothing.
 */
function sampleSizeDriver(set: WeightedComparable[]): DriverSpec {
  const n = set.length;
  const score = clamp(1 - Math.exp(-n / 12), 0, 1);
  return {
    weight: 0.3,
    driver: {
      key: "sample_size",
      label: "Comparable depth",
      score,
      detail: `${n} comparable ${n === 1 ? "listing" : "listings"} after filtering`,
    },
  };
}

/** Tight clusters mean a real market price exists. Wide ones mean it does not. */
function dispersionDriver(set: WeightedComparable[]): DriverSpec {
  const dispersion = dispersionOf(set);
  const score = clamp(1 - dispersion / MAX_DISPERSION, 0, 1);
  return {
    weight: 0.25,
    driver: {
      key: "dispersion",
      label: "Price agreement",
      score,
      detail: `Middle half of the market spans ${(dispersion * 100).toFixed(0)}% of the median`,
    },
  };
}

function recencyDriver(set: WeightedComparable[], asOf: string): DriverSpec {
  if (set.length === 0) {
    return {
      weight: 0.2,
      driver: { key: "recency", label: "Freshness", score: 0, detail: "No comparables" },
    };
  }
  const ages = set.map((item) =>
    daysBetween(item.comparable.delistedAt ?? item.comparable.listedAt, asOf),
  );
  const medianAge = median(ages);
  const score = clamp(1 - medianAge / MAX_MEDIAN_STALENESS_DAYS, 0, 1);
  return {
    weight: 0.2,
    driver: {
      key: "recency",
      label: "Freshness",
      score,
      detail: `Median comparable is ${Math.round(medianAge)} days old`,
    },
  };
}

/**
 * How much adjustment the comparables needed. A set that required large
 * mileage and age corrections is a weaker basis than one that barely moved,
 * even if both contain the same number of cars.
 */
function matchQualityDriver(set: WeightedComparable[]): DriverSpec {
  if (set.length === 0) {
    return {
      weight: 0.15,
      driver: { key: "match_quality", label: "Match quality", score: 0, detail: "No comparables" },
    };
  }
  const relativeAdjustments = set.map((item) => {
    const total = item.adjustmentBreakdown.reduce((sum, line) => sum + Math.abs(line.amount), 0);
    return item.comparable.askingPrice > 0 ? total / item.comparable.askingPrice : 1;
  });
  const medianAdjustment = median(relativeAdjustments);
  const score = clamp(1 - medianAdjustment / 0.18, 0, 1);
  return {
    weight: 0.15,
    driver: {
      key: "match_quality",
      label: "Match quality",
      score,
      detail: `Typical comparable needed ${(medianAdjustment * 100).toFixed(0)}% adjustment`,
    },
  };
}

/** Time-to-sale claims are only as good as the number of sales behind them. */
function saleObservationDriver(speed: SpeedModel): DriverSpec {
  const score = speed.usedPriors ? 0.25 : clamp(1 - Math.exp(-speed.fittedOn / 10), 0, 1);
  return {
    weight: 0.1,
    driver: {
      key: "sale_observations",
      label: "Sale evidence",
      score,
      detail: speed.usedPriors
        ? "Too few observed sales — segment defaults used for timing"
        : `${speed.fittedOn} observed sales behind the timing estimate`,
    },
  };
}

/**
 * Hard gate. Returns the reasons we will not answer, or an empty array.
 * Separate from the confidence score on purpose: a low score means "be careful",
 * a non-empty result here means "we are not going to give you a number".
 */
export function insufficiencyReasons(
  set: WeightedComparable[],
  asOf: string,
): InsufficiencyReason[] {
  const reasons: InsufficiencyReason[] = [];

  if (set.length < MIN_COMPARABLES) reasons.push("too_few_comparables");
  if (set.length > 0 && dispersionOf(set) > MAX_DISPERSION) {
    reasons.push("comparables_too_dispersed");
  }
  if (set.length > 0) {
    const medianAge = median(
      set.map((item) => daysBetween(item.comparable.delistedAt ?? item.comparable.listedAt, asOf)),
    );
    if (medianAge > MAX_MEDIAN_STALENESS_DAYS) reasons.push("comparables_too_stale");
  }

  return reasons;
}

export function remediesFor(reasons: InsufficiencyReason[]): string[] {
  const remedies: string[] = [];
  for (const reason of reasons) {
    switch (reason) {
      case "too_few_comparables":
        remedies.push("Widen the mileage or age band, or include neighbouring markets");
        break;
      case "comparables_too_dispersed":
        remedies.push("Check the derivative and equipment — the set may contain two different cars");
        break;
      case "comparables_too_stale":
        remedies.push("Recent listings are missing for this model; treat any figure as indicative");
        break;
      case "no_sale_observations":
        remedies.push("No completed sales observed yet for this model in this market");
        break;
    }
  }
  return remedies;
}
