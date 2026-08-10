/**
 * The appraisal orchestrator.
 *
 * Pure: same inputs, same output, no clock, no network, no randomness. That is
 * what makes a recommendation reproducible six months later when a dealer asks
 * why we told them to pay CHF 48'200 for a car that lost money — we can replay
 * it exactly, which is the foundation of the outcome loop.
 */

import type {
  AppraisalRequest,
  AppraisalResult,
  Comparable,
  PriceSpeedPoint,
  SufficientAppraisal,
} from "./types";
import { buildComparableSet, marketMedianPrice } from "./comparables";
import {
  dispersionOf,
  expectedDaysAt,
  fitSpeedModel,
  marketPositionOf,
  priceForTargetDays,
} from "./valuation";
import { grossProfitAt, solveCeiling } from "./ceiling";
import { assessConfidence, insufficiencyReasons, remediesFor } from "./confidence";
import { assessRisks } from "./risks";
import { roundToAskingPrice } from "./money";
import { assessCondition } from "./condition";
import { median } from "./stats";

export interface AppraiseOptions {
  /** Live supply now vs. 30 days ago, when the data source can provide it. */
  supplyChange?: { current: number; previous: number };
}

export function appraise(
  request: AppraisalRequest,
  candidates: Comparable[],
  options: AppraiseOptions = {},
): AppraisalResult {
  const { subject, economics, asOf } = request;
  const targetDays = request.targetDaysToSale ?? economics.targetDaysToSale;

  const { used, excluded, adjustments } = buildComparableSet(subject, candidates, asOf);

  const blocking = insufficiencyReasons(used, asOf);
  if (blocking.length > 0) {
    return {
      status: "insufficient",
      reasons: blocking,
      remedies: remediesFor(blocking),
      comparablesFound: used.length,
      asOf,
    };
  }

  const marketMedian = marketMedianPrice(used);
  const speed = fitSpeedModel(used, marketMedian);

  // Retail is the price that clears within the dealer's own sale window, not a
  // generic "market value". A dealer targeting 30 days and one targeting 90
  // should not be handed the same figure.
  const baseRetailPrice = roundToAskingPrice(
    priceForTargetDays(targetDays, marketMedian, speed),
  );

  /**
   * Condition adjusts the comparable-derived price, not the other way round.
   * The comparables describe an average car of this specification; this car is
   * a specific one, and its history is what separates the two.
   */
  const condition = request.condition
    ? assessCondition(baseRetailPrice, request.condition)
    : { lines: [], total: 0, adjustedRetail: baseRetailPrice, hasUnknowns: false };

  const expectedRetailPrice = roundToAskingPrice(condition.adjustedRetail);
  const expectedDaysToSale = expectedDaysAt(expectedRetailPrice, marketMedian, speed);

  const target = solveCeiling({
    expectedRetailPrice,
    expectedDays: expectedDaysToSale,
    economics,
    requiredGrossProfit: economics.targetGrossProfit,
  });

  const walkAway = solveCeiling({
    expectedRetailPrice,
    expectedDays: expectedDaysToSale,
    economics,
    requiredGrossProfit: economics.minimumGrossProfit,
  });

  const confidence = assessConfidence(used, speed, asOf);
  const risks = assessRisks({ subject, set: used, speed, asOf, supplyChange: options.supplyChange });

  const result: SufficientAppraisal = {
    status: "ok",
    asOf,
    currency: economics.currency,
    maxBuyPrice: target.maxBuyPrice,
    walkAwayPrice: walkAway.maxBuyPrice,
    expectedRetailPrice,
    baseRetailPrice,
    conditionLines: condition.lines,
    conditionHasUnknowns: condition.hasUnknowns,
    expectedDaysToSale,
    priceSpeedCurve: buildPriceSpeedCurve({
      marketMedian,
      speed,
      used,
      purchasePrice: target.maxBuyPrice,
      economics,
    }),
    bridge: target.bridge,
    confidence,
    evidence: {
      comparables: used,
      excluded,
      adjustments,
      speedModel: speed,
      sampleSize: used.length,
      medianAdjustedPrice: marketMedian,
      interquartileRange: Math.round(dispersionOf(used) * marketMedian),
    },
    risks,
  };

  return result;
}

/**
 * The trade-off view: what each asking price costs in margin and buys in speed.
 *
 * Deliberately sampled around the market median rather than around the dealer's
 * current price, so the curve shows the market's shape rather than flattering
 * a decision already made.
 */
function buildPriceSpeedCurve(args: {
  marketMedian: number;
  speed: ReturnType<typeof fitSpeedModel>;
  used: ReturnType<typeof buildComparableSet>["used"];
  purchasePrice: number;
  economics: AppraisalRequest["economics"];
}): PriceSpeedPoint[] {
  const { marketMedian, speed, used, purchasePrice, economics } = args;
  const offsets = [-0.08, -0.05, -0.025, 0, 0.025, 0.05, 0.08];

  return offsets.map((offset) => {
    const retailPrice = roundToAskingPrice(Math.round(marketMedian * (1 + offset)));
    const expectedDays = expectedDaysAt(retailPrice, marketMedian, speed);
    return {
      retailPrice,
      expectedDays,
      marketPercentile: marketPositionOf(retailPrice, used),
      grossProfitAtMaxBuy: grossProfitAt({
        salePrice: retailPrice,
        purchasePrice,
        days: expectedDays,
        economics,
      }),
    };
  });
}

/** Median observed days on market, for display alongside the fitted model. */
export function observedMedianDays(result: SufficientAppraisal): number | null {
  const observed = result.evidence.comparables
    .map((item) => item.daysOnMarket)
    .filter((days): days is number => days !== null);
  return observed.length >= 3 ? Math.round(median(observed)) : null;
}
