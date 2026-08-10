/**
 * Opportunity detection.
 *
 * Not "cheaper than average". A car priced below the market average is usually
 * priced there for a reason — higher mileage, worse specification, a weaker
 * month. A real opportunity is a car whose asking price sits below what *this
 * dealership* could pay and still hit its own target, after preparation,
 * warranty, VAT and the cost of the days it will take to sell.
 *
 * That means every candidate is a full appraisal, and the ranking is by return
 * on capital rather than by headroom in francs — because a CHF 2'000 margin
 * that turns in five weeks beats CHF 3'000 that takes five months.
 */

import type { Comparable, DealerEconomics, IsoDate, RiskFlag } from "./types";
import { appraise } from "./appraise";
import { annualisedReturn, grossProfitAt } from "./ceiling";

export interface Opportunity {
  listing: Comparable;
  /** The most this dealership should pay, from the full appraisal. */
  ceiling: number;
  askingPrice: number;
  /** Ceiling minus asking price. Positive means room to negotiate or just buy. */
  headroom: number;
  expectedRetailPrice: number;
  expectedDaysToSale: number;
  /** Gross profit if bought at the asking price and sold at expected retail. */
  projectedGross: number;
  /** Annualised return on the capital this purchase would tie up. */
  annualisedReturn: number;
  confidence: number;
  risks: RiskFlag[];
}

/** Below this we do not surface it: the margin is inside the model's error. */
const MIN_HEADROOM_FRACTION = 0.015;

/**
 * Scan acquisition channels for cars worth investigating.
 *
 * `candidates` are auction lots, trade offers and private sales — where stock is
 * actually bought. `retailMarket` is what those cars will sell for afterwards.
 * Keeping the two apart is the whole basis of the calculation: the margin being
 * measured *is* the gap between them.
 */
export function findOpportunities(
  candidates: Comparable[],
  retailMarket: Comparable[],
  economics: DealerEconomics,
  asOf: IsoDate,
  options: { limit?: number } = {},
): Opportunity[] {
  const live = candidates.filter((listing) => listing.delistedAt === null);
  const opportunities: Opportunity[] = [];

  for (const listing of live) {
    // Valued against the retail market, because the ceiling depends on what the
    // car will sell for to the public. Comparable selection drops non-retail
    // channels itself, so an auction lot can never become evidence for its own
    // valuation even if it appears in both feeds.
    const evidence = retailMarket.filter((candidate) => candidate.id !== listing.id);

    const result = appraise(
      { subject: listing.vehicle, economics, asOf },
      evidence,
    );
    if (result.status !== "ok") continue;

    // Private sellers are a different transaction: no VAT invoice, more
    // negotiation, more risk. They are still worth surfacing, but the ceiling
    // already accounts for the treatment the dealer configured.
    const headroom = result.maxBuyPrice - listing.askingPrice;
    if (headroom < result.maxBuyPrice * MIN_HEADROOM_FRACTION) continue;

    const projectedGross = grossProfitAt({
      salePrice: result.expectedRetailPrice,
      purchasePrice: listing.askingPrice,
      days: result.expectedDaysToSale,
      economics,
    });

    const capitalEmployed =
      listing.askingPrice + economics.reconCost + economics.logisticsCost;

    opportunities.push({
      listing,
      ceiling: result.maxBuyPrice,
      askingPrice: listing.askingPrice,
      headroom,
      expectedRetailPrice: result.expectedRetailPrice,
      expectedDaysToSale: result.expectedDaysToSale,
      projectedGross,
      annualisedReturn: annualisedReturn({
        grossProfit: projectedGross,
        capitalEmployed,
        days: result.expectedDaysToSale,
      }),
      confidence: result.confidence.score,
      risks: result.risks,
    });
  }

  opportunities.sort((a, b) => b.annualisedReturn - a.annualisedReturn);
  return options.limit ? opportunities.slice(0, options.limit) : opportunities;
}

/**
 * Allocate a capital budget across opportunities.
 *
 * Greedy by return on capital, which is the correct ordering when the objective
 * is return per franc deployed and purchases are indivisible. Answers the
 * dealer's question directly: "I have CHF 150'000 — where does it go?"
 */
export function allocateCapital(
  opportunities: Opportunity[],
  budget: number,
  economics: DealerEconomics,
): { chosen: Opportunity[]; spent: number; projectedGross: number; unspent: number } {
  const chosen: Opportunity[] = [];
  let spent = 0;

  for (const opportunity of opportunities) {
    const cost =
      opportunity.askingPrice + economics.reconCost + economics.logisticsCost;
    if (spent + cost > budget) continue;
    chosen.push(opportunity);
    spent += cost;
  }

  return {
    chosen,
    spent,
    projectedGross: chosen.reduce((sum, o) => sum + o.projectedGross, 0),
    unspent: budget - spent,
  };
}
