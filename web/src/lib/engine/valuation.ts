/**
 * Retail valuation and the price/speed relationship.
 *
 * The central insight the product is built on: a used car does not have "a
 * price". It has a curve. Every asking price implies a selling speed, and the
 * dealer's real decision is where on that curve they want to sit given their
 * cost of capital. Everything downstream — the buying ceiling, repricing,
 * capital allocation — is a consequence of this curve.
 */

import type { SpeedModel, WeightedComparable } from "./types";
import { clamp, median, percentileOf, theilSen } from "./stats";

/**
 * Priors used when the sample has too few observed sales to fit.
 * Swiss used-car median time to sale sits in the 60–90 day band; 72 is the
 * middle of it and errs slightly optimistic, which the holding cost punishes.
 */
const PRIOR_MEDIAN_DAYS = 72;
/**
 * Prior elasticity. exp(6.0 * 0.10) ≈ 1.82, i.e. pricing 10% above the market
 * median roughly doubles time to sale — consistent with published listing
 * studies and with what dealers describe anecdotally.
 */
const PRIOR_ELASTICITY = 6.0;
const MIN_SALES_FOR_SPEED_FIT = 6;

/** Sales below this many days are almost always pre-sold cars, not market sales. */
const MIN_PLAUSIBLE_DAYS = 3;
const MAX_PLAUSIBLE_DAYS = 400;

/**
 * Fit the price/speed relationship from comparables that actually ended.
 *
 * Only listings we believe sold are used. A listing that was withdrawn tells us
 * nothing about how long a sale takes, and including it biases every estimate
 * toward optimism — which is exactly the direction that costs a dealer money.
 */
export function fitSpeedModel(
  set: WeightedComparable[],
  marketMedian: number,
): SpeedModel {
  const observations = set.filter(
    (item) =>
      item.daysOnMarket !== null &&
      item.daysOnMarket >= MIN_PLAUSIBLE_DAYS &&
      item.daysOnMarket <= MAX_PLAUSIBLE_DAYS &&
      (item.comparable.soldSignal === "confirmed" || item.comparable.soldSignal === "likely"),
  );

  if (observations.length < MIN_SALES_FOR_SPEED_FIT || marketMedian <= 0) {
    return {
      medianDays: PRIOR_MEDIAN_DAYS,
      elasticity: PRIOR_ELASTICITY,
      daysPerPricePercent: round1(PRIOR_MEDIAN_DAYS * (Math.exp(PRIOR_ELASTICITY * 0.01) - 1)),
      fittedOn: observations.length,
      usedPriors: true,
    };
  }

  // x: price relative to the market median, as a fraction (+0.05 = 5% above).
  // y: log days, so the fitted relationship is multiplicative — the shape that
  //    matches how listing data actually behaves.
  const fit = theilSen(
    observations.map((item) => ({
      x: (item.adjustedPrice - marketMedian) / marketMedian,
      y: Math.log(item.daysOnMarket as number),
    })),
  );

  // A non-positive slope would say expensive cars sell faster. That happens in
  // noisy samples and is never true causally, so we fall back.
  const elasticity = fit.slope > 0 ? clamp(fit.slope, 1.5, 14) : PRIOR_ELASTICITY;
  const usedPriors = fit.slope <= 0;

  const medianDays = clamp(
    Math.round(Math.exp(fit.intercept)),
    MIN_PLAUSIBLE_DAYS,
    MAX_PLAUSIBLE_DAYS,
  );

  return {
    medianDays,
    elasticity,
    daysPerPricePercent: round1(medianDays * (Math.exp(elasticity * 0.01) - 1)),
    fittedOn: observations.length,
    usedPriors,
  };
}

/** Expected days on market for a given asking price. */
export function expectedDaysAt(
  retailPrice: number,
  marketMedian: number,
  model: SpeedModel,
): number {
  if (marketMedian <= 0) return model.medianDays;
  const relative = (retailPrice - marketMedian) / marketMedian;
  const days = model.medianDays * Math.exp(model.elasticity * relative);
  return Math.round(clamp(days, MIN_PLAUSIBLE_DAYS, MAX_PLAUSIBLE_DAYS));
}

/**
 * Invert the curve: the asking price that should sell within `targetDays`.
 *
 * This is what makes the product answer the dealer's actual question — "what do
 * I need to price at to be gone in 45 days" — rather than the question a
 * valuation book answers, which is "what is it worth".
 */
export function priceForTargetDays(
  targetDays: number,
  marketMedian: number,
  model: SpeedModel,
): number {
  if (marketMedian <= 0 || model.elasticity <= 0) return marketMedian;
  const clampedDays = clamp(targetDays, MIN_PLAUSIBLE_DAYS, MAX_PLAUSIBLE_DAYS);
  const relative = Math.log(clampedDays / model.medianDays) / model.elasticity;
  // Never let the inverted curve wander more than 25% from the market median:
  // beyond that we are extrapolating past any comparable we hold.
  return Math.round(marketMedian * (1 + clamp(relative, -0.25, 0.25)));
}

/** Where a candidate price sits within the live market, 0..1. */
export function marketPositionOf(retailPrice: number, set: WeightedComparable[]): number {
  const live = set
    .filter((item) => item.comparable.delistedAt === null)
    .map((item) => item.adjustedPrice);
  const basis = live.length >= 4 ? live : set.map((item) => item.adjustedPrice);
  return percentileOf(basis, retailPrice);
}

/** Dispersion of the comparable set, as a fraction of the median. */
export function dispersionOf(set: WeightedComparable[]): number {
  const prices = set.map((item) => item.adjustedPrice);
  const m = median(prices);
  if (m <= 0 || prices.length < 4) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  return (q3 - q1) / m;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
