/**
 * Stock decisions: what to do with cars the dealer already owns.
 *
 * The question is not "what is this car worth" — the dealer already owns it and
 * the purchase price is sunk. The question is where the *remaining* capital is
 * best deployed, and that is answered by return on capital per unit of time,
 * not by absolute margin.
 *
 * This is the part dealers most consistently get wrong. CHF 2'000 in 30 days is
 * a better business than CHF 3'500 in 120 days, and almost nobody prices that
 * instinctively. Making the comparison visible is most of the value here.
 */

import type {
  Comparable,
  DealerEconomics,
  IsoDate,
  RiskFlag,
  Vehicle,
} from "./types";
import { buildComparableSet, marketMedianPrice } from "./comparables";
import { expectedDaysAt, fitSpeedModel } from "./valuation";
import { annualisedReturn, grossProfitAt } from "./ceiling";
import { assessConfidence, insufficiencyReasons } from "./confidence";
import { assessRisks } from "./risks";
import { roundToAskingPrice, roundToFranc } from "./money";
import { clamp, daysBetween } from "./stats";

/** A vehicle in the dealer's inventory. */
export interface StockVehicle {
  id: string;
  vehicle: Vehicle;
  /** What the dealer actually paid. Sunk — informs profit, never the decision. */
  acquisitionPrice: number;
  acquiredAt: IsoDate;
  /** Preparation actually spent on this car, which may differ from the default. */
  reconSpent: number;
  /** Current advertised price. */
  currentAskingPrice: number;
  /** When it went on sale. Days listed drives the holding cost already incurred. */
  listedAt: IsoDate;
}

export type StockAction = "hold" | "reprice" | "reduce" | "exit" | "investigate";

export interface PriceOption {
  price: number;
  /**
   * Whether comparables actually exist around this price.
   *
   * Outside the band the price/speed curve is extrapolation, and a time-to-sale
   * derived from it is a guess dressed as a forecast.
   */
  withinEvidence: boolean;
  /** Days from today until sale, if priced here from today. */
  daysToSale: number;
  /** Gross profit at that price, after all costs including holding. */
  grossProfit: number;
  /** Return on the capital tied up in this car, annualised. */
  annualisedReturn: number;
}

export interface StockRecommendation {
  item: StockVehicle;
  action: StockAction;
  daysInStock: number;
  daysListed: number;
  /** Capital currently tied up: purchase plus preparation plus logistics. */
  capitalEmployed: number;

  /** What happens if the dealer changes nothing, at the current asking price. */
  holding: PriceOption;
  /**
   * The same car held until it reaches a price the market has actually paid.
   *
   * When the current asking price sits above every comparable, `holding` is a
   * projection with no evidence under it — the arithmetic will happily claim a
   * sale at that price within a year because the curve was extrapolated there.
   * This is the honest alternative to acting, and it is what an exit is
   * measured against.
   */
  realisticHold: PriceOption;
  /** The best price found, by return on capital. */
  recommended: PriceOption;

  /**
   * Difference in annualised return between acting and not. This is the number
   * the recommendation is ranked on across the whole stock list.
   */
  returnUplift: number;
  /**
   * Franc consequence of acting, measured over the holding option's horizon so
   * the two are compared over the same period rather than over different ones.
   */
  valueOfActing: number;

  confidence: number;
  risks: RiskFlag[];
  /** Machine-readable grounds for the action. Rendered as short phrases. */
  grounds: StockGround[];
}

export interface StockGround {
  key:
    | "aged"
    | "priced_above_market"
    | "capital_underperforming"
    | "market_falling"
    | "below_minimum_margin"
    | "performing";
  message: string;
}

/** Ageing thresholds. Beyond 90 days a car is a problem, not an asset. */
const AGED_DAYS = 60;
const SEVERELY_AGED_DAYS = 90;
/** Annualised return below this means the capital belongs somewhere else. */
const WEAK_RETURN = 0.35;
/** Don't recommend a reprice for a trivial gain — dealers stop listening. */
const MIN_UPLIFT_TO_ACT = 0.08;

export function reviewStockItem(
  item: StockVehicle,
  candidates: Comparable[],
  economics: DealerEconomics,
  asOf: IsoDate,
): StockRecommendation | null {
  const { used } = buildComparableSet(item.vehicle, candidates, asOf);
  if (insufficiencyReasons(used, asOf).length > 0) return null;

  const marketMedian = marketMedianPrice(used);
  const speed = fitSpeedModel(used, marketMedian);

  const daysInStock = daysBetween(item.acquiredAt, asOf);
  const daysListed = daysBetween(item.listedAt, asOf);
  const capitalEmployed = item.acquisitionPrice + item.reconSpent + economics.logisticsCost;

  /**
   * The band comparables actually cover. Beyond it we are extrapolating a curve
   * fitted on cars that all sold for less.
   */
  const evidenceCeiling = Math.round(marketMedian * 1.15);
  const evidenceFloor = Math.round(marketMedian * 0.85);

  const evaluate = (price: number, alreadyListedFor: number, delayDays = 0): PriceOption => {
    /**
     * Remaining time to sale, given the car has already survived unsold.
     *
     * The naive reading — subtract days already listed from the expected total —
     * is not merely wrong, it inverts the signal. It makes a car that has sat
     * for 96 days against a 60-day expectation look like it sells next week, so
     * the worst stock in the fleet scores the highest return on capital.
     *
     * Surviving past the expected sell time is evidence the price is wrong, not
     * evidence a sale is due. We take the memoryless reading — days already
     * spent are sunk and earn no credit — and then, once a listing has outlived
     * its own expectation, we let the observed duration speak instead. The model
     * never promises the market is about to relent.
     */
    const expected = expectedDaysAt(price, marketMedian, speed);
    const daysToSale = Math.max(expected, alreadyListedFor) + delayDays;

    // Holding cost counts the whole time the car will have been owned, because
    // that is the money the dealership actually spends.
    const grossProfit = grossProfitAt({
      salePrice: price,
      purchasePrice: item.acquisitionPrice,
      days: daysInStock + daysToSale,
      economics: { ...economics, reconCost: item.reconSpent },
    });

    return {
      price,
      withinEvidence: price <= evidenceCeiling && price >= evidenceFloor,
      daysToSale,
      grossProfit,
      annualisedReturn: annualisedReturn({ grossProfit, capitalEmployed, days: daysToSale }),
    };
  };

  const holding = evaluate(item.currentAskingPrice, daysListed);

  // Search the price band the comparables actually cover. Extrapolating beyond
  // it would be inventing a market we have no evidence for.
  const options: PriceOption[] = [];
  for (let offset = -0.14; offset <= 0.06; offset += 0.01) {
    const price = roundToAskingPrice(Math.round(marketMedian * (1 + offset)));
    if (price >= item.currentAskingPrice) continue; // never recommend a rise on aged stock
    options.push(evaluate(price, 0));
  }
  options.push(holding);

  const byReturn = options.reduce((best, option) =>
    option.annualisedReturn > best.annualisedReturn ? option : best,
  );

  /**
   * When nothing clears the minimum margin, the objective changes.
   *
   * It does not become "sell fastest" — dumping a car at the bottom of the band
   * destroys more value than the holding cost of being patient, and an engine
   * that recommends panic is worse than no engine. It becomes "lose least":
   * maximise the final outcome across prices the market has actually paid.
   * Because holding cost is already inside every gross figure, that single
   * objective balances price against time by itself.
   */
  const evidenced = options.filter((option) => option.withinEvidence);
  const bestEvidenced =
    evidenced.length > 0
      ? evidenced.reduce((best, option) =>
          option.grossProfit > best.grossProfit ? option : best,
        )
      : byReturn;

  const cannotClearMinimum = bestEvidenced.grossProfit < economics.minimumGrossProfit;
  const recommended = cannotClearMinimum && daysInStock >= AGED_DAYS ? bestEvidenced : byReturn;

  /**
   * The honest baseline for a car priced above every comparable.
   *
   * Leaving it alone does not produce a sale at the asking price — no listing in
   * the evidence sold anywhere near it. The realistic outcome is another stretch
   * of nothing happening, followed by the same price cut later, having paid the
   * holding cost in between. That wasted stretch is the real cost of inaction,
   * and it is what an exit is measured against.
   */
  const DELAY_BEFORE_CAPITULATION = 90;
  const realisticHold = holding.withinEvidence
    ? holding
    : evaluate(bestEvidenced.price, 0, DELAY_BEFORE_CAPITULATION);

  const returnUplift = recommended.annualisedReturn - holding.annualisedReturn;

  const grounds: StockGround[] = [];
  const abovemarket = (item.currentAskingPrice - marketMedian) / marketMedian;

  if (daysInStock >= SEVERELY_AGED_DAYS) {
    grounds.push({ key: "aged", message: `${daysInStock} days in stock` });
  } else if (daysInStock >= AGED_DAYS) {
    grounds.push({ key: "aged", message: `${daysInStock} days in stock` });
  }
  if (!holding.withinEvidence && item.currentAskingPrice > evidenceCeiling) {
    grounds.push({
      key: "priced_above_market",
      message: `No comparable has sold anywhere near ${Math.round(abovemarket * 100)}% above the market middle`,
    });
  } else if (abovemarket > 0.03) {
    grounds.push({
      key: "priced_above_market",
      message: `Priced ${(abovemarket * 100).toFixed(0)}% above the market middle`,
    });
  }
  if (holding.annualisedReturn < WEAK_RETURN) {
    const percentage = (holding.annualisedReturn * 100).toFixed(0);
    grounds.push({
      key: "capital_underperforming",
      message:
        holding.annualisedReturn < 0
          ? `Losing ${percentage}% of the capital tied up in it`
          : `Capital returning ${percentage}% annualised where it stands`,
    });
  }
  if (recommended.grossProfit < economics.minimumGrossProfit) {
    grounds.push({
      key: "below_minimum_margin",
      message: "No price clears your minimum margin — this one is about recovering capital",
    });
  }

  const action = decideAction({
    holding,
    recommended,
    returnUplift,
    daysInStock,
    economics,
  });

  /**
   * What acting is worth, in francs.
   *
   * Repricing and exiting optimise different things, so the measure differs —
   * but both answer the same question: how much better off is the dealership if
   * it acts today rather than leaving the car alone.
   *
   * For a reprice, the gain is capital productivity: the car sells sooner, and
   * the freed capital earns again. For an exit there is no productivity to
   * gain, only a loss to stop growing — every further day accrues holding cost
   * against a car that will not clear its minimum at any price, so the value of
   * acting is simply the difference in the final outcome.
   */
  const valueOfActing =
    action === "hold"
      ? 0
      : action === "exit"
        ? roundToFranc(recommended.grossProfit - realisticHold.grossProfit)
        : roundToFranc(
            (recommended.annualisedReturn - holding.annualisedReturn) *
              capitalEmployed *
              (holding.daysToSale / 365),
          );

  if (action === "hold" && grounds.length === 0) {
    grounds.push({
      key: "performing",
      message: `On track at ${(holding.annualisedReturn * 100).toFixed(0)}% annualised return`,
    });
  }

  const confidence = assessConfidence(used, speed, asOf).score;
  const risks = assessRisks({ subject: item.vehicle, set: used, speed, asOf });

  return {
    item,
    action,
    daysInStock,
    daysListed,
    capitalEmployed,
    holding,
    realisticHold,
    // "Hold" must mean hold. Reporting a better theoretical price alongside a
    // hold verdict is the kind of quiet contradiction that makes a dealer stop
    // believing the verdict.
    recommended: action === "hold" ? holding : recommended,
    returnUplift: action === "hold" ? 0 : returnUplift,
    valueOfActing,
    confidence,
    risks,
    grounds,
  };
}

function decideAction(args: {
  holding: PriceOption;
  recommended: PriceOption;
  returnUplift: number;
  daysInStock: number;
  economics: DealerEconomics;
}): StockAction {
  const { holding, recommended, returnUplift, daysInStock, economics } = args;

  // Nothing at any price clears the minimum: the decision is no longer about
  // margin, it is about getting the capital back out.
  if (recommended.grossProfit < economics.minimumGrossProfit && daysInStock >= AGED_DAYS) {
    return "exit";
  }

  if (returnUplift < MIN_UPLIFT_TO_ACT) return "hold";

  // A large cut on a long-held car is a different instruction to a small
  // adjustment, and dealers treat them differently, so we name them differently.
  const cut = (holding.price - recommended.price) / holding.price;
  if (cut > 0.05 || daysInStock >= SEVERELY_AGED_DAYS) return "reduce";
  return "reprice";
}

/** Review the whole inventory, ranked by how much acting is worth. */
export function reviewStock(
  items: StockVehicle[],
  comparablesFor: (item: StockVehicle) => Comparable[],
  economics: DealerEconomics,
  asOf: IsoDate,
): StockRecommendation[] {
  return items
    .map((item) => reviewStockItem(item, comparablesFor(item), economics, asOf))
    .filter((review): review is StockRecommendation => review !== null)
    .sort((a, b) => b.valueOfActing - a.valueOfActing);
}

/** Total capital tied up, and how much of it is in cars needing action. */
export function stockSummary(reviews: StockRecommendation[]) {
  const capital = reviews.reduce((sum, r) => sum + r.capitalEmployed, 0);
  const needingAction = reviews.filter((r) => r.action !== "hold");
  const atRisk = needingAction.reduce((sum, r) => sum + r.capitalEmployed, 0);
  const opportunity = needingAction.reduce((sum, r) => sum + Math.max(r.valueOfActing, 0), 0);
  const aged = reviews.filter((r) => r.daysInStock >= AGED_DAYS).length;

  return {
    vehicles: reviews.length,
    capital,
    atRisk,
    opportunity,
    aged,
    needingAction: needingAction.length,
    averageReturn:
      reviews.length === 0
        ? 0
        : reviews.reduce((sum, r) => sum + r.holding.annualisedReturn, 0) / reviews.length,
    averageDaysInStock:
      reviews.length === 0
        ? 0
        : Math.round(reviews.reduce((sum, r) => sum + r.daysInStock, 0) / reviews.length),
  };
}

export { AGED_DAYS, SEVERELY_AGED_DAYS, WEAK_RETURN, clamp };
