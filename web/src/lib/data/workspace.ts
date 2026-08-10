/**
 * The workspace: everything a page needs, assembled once per request.
 *
 * Pages do not reach for data sources directly. They ask for the workspace and
 * get a consistent picture — the same market, the same valuation date, the same
 * stock reviews — so two screens can never disagree about how many cars need
 * attention, which is the fastest way to lose a dealer's trust in a product
 * that exists to be believed.
 */

import { cache } from "react";
import { reviewStock, stockSummary, type StockRecommendation } from "../engine/stock";
import { findOpportunities, type Opportunity } from "../engine/sourcing";
import { DEFAULT_ECONOMICS } from "../engine/defaults";
import { buildComparableSet, marketMedianPrice } from "../engine/comparables";
import { fitSpeedModel } from "../engine/valuation";
import type { Comparable, DealerEconomics, Vehicle } from "../engine/types";
import { SyntheticSwissMarketSource, DEMO_VEHICLES } from "./fixtures";
import { buildStock } from "./stock-fixtures";

/**
 * Fixed valuation date.
 *
 * The engine never reads a clock — that is what makes a recommendation
 * replayable months later against what the car actually sold for. In production
 * this becomes the request timestamp; here it is pinned so the demonstration is
 * identical every time it is opened.
 */
export const AS_OF = "2026-08-10";

export interface ModelMarketView {
  key: string;
  label: string;
  vehicle: Vehicle;
  comparables: Comparable[];
  acquisitionLots: Comparable[];
  supplyChange?: { current: number; previous: number };
  /** Median retail price for the reference specification. */
  medianPrice: number;
  medianDays: number;
  /** Median relative price movement across live listings. Negative is falling. */
  priceDrift: number | null;
  liveListings: number;
  observedSales: number;
  /**
   * Live listing count for each of the last 30 days, derived from when listings
   * appeared and disappeared. A real series, not a decorative curve — if the
   * data could not support it the sparkline would not be drawn.
   */
  supplySeries: number[];
}

export interface Workspace {
  asOf: string;
  economics: DealerEconomics;
  markets: ModelMarketView[];
  stock: StockRecommendation[];
  summary: ReturnType<typeof stockSummary>;
  opportunities: Opportunity[];
}

/**
 * `cache` deduplicates this across a single render pass, so the layout and the
 * page it wraps share one computation rather than each doing the work.
 */
export const getWorkspace = cache(async (): Promise<Workspace> => {
  const source = new SyntheticSwissMarketSource();
  const economics = DEFAULT_ECONOMICS;

  const markets: ModelMarketView[] = await Promise.all(
    DEMO_VEHICLES.map(async ({ label, vehicle }) => {
      const [retail, acquisition] = await Promise.all([
        source.fetchComparables({ subject: vehicle, market: "CH", asOf: AS_OF, lookbackDays: 120 }),
        source.fetchAcquisitionCandidates({
          subject: vehicle,
          market: "CH",
          asOf: AS_OF,
          lookbackDays: 30,
        }),
      ]);

      const { used } = buildComparableSet(vehicle, retail.comparables, AS_OF);
      const medianPrice = marketMedianPrice(used);
      const speed = fitSpeedModel(used, medianPrice);

      return {
        key: `${vehicle.make}|${vehicle.model}`,
        label,
        vehicle,
        comparables: retail.comparables,
        acquisitionLots: acquisition.comparables,
        supplyChange: retail.supplyChange,
        medianPrice,
        medianDays: speed.medianDays,
        priceDrift: driftOf(retail.comparables),
        liveListings: retail.comparables.filter((c) => c.delistedAt === null).length,
        observedSales: retail.comparables.filter((c) => c.delistedAt !== null).length,
        supplySeries: supplyOverTime(retail.comparables, AS_OF, 30),
      };
    }),
  );

  const byKey = new Map(markets.map((market) => [market.key, market]));
  const stockItems = buildStock(AS_OF);
  const comparablesFor = (item: { vehicle: Vehicle }) =>
    byKey.get(`${item.vehicle.make}|${item.vehicle.model}`)?.comparables ?? [];

  const stock = reviewStock(stockItems, comparablesFor, economics, AS_OF);

  const opportunities = markets
    .flatMap((market) =>
      findOpportunities(market.acquisitionLots, market.comparables, economics, AS_OF),
    )
    .sort((a, b) => b.annualisedReturn - a.annualisedReturn);

  return {
    asOf: AS_OF,
    economics,
    markets,
    stock,
    summary: stockSummary(stock),
    opportunities,
  };
});

/**
 * How many listings were live on each of the last `days` days.
 *
 * Counted from the listings themselves rather than stored, so the series can
 * never drift out of agreement with the figure beside it.
 */
function supplyOverTime(comparables: Comparable[], asOf: string, days: number): number[] {
  const end = Date.parse(`${asOf}T00:00:00Z`);
  const series: number[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const day = end - offset * 86_400_000;
    let live = 0;
    for (const listing of comparables) {
      const listed = Date.parse(`${listing.listedAt}T00:00:00Z`);
      const delisted = listing.delistedAt
        ? Date.parse(`${listing.delistedAt}T00:00:00Z`)
        : Infinity;
      if (listed <= day && day < delisted) live++;
    }
    series.push(live);
  }

  return series;
}

/** Median relative price change across listings that actually moved their price. */
function driftOf(comparables: Comparable[]): number | null {
  const changes = comparables
    .filter((c) => c.priceHistory.length >= 2 && c.priceHistory[0].price > 0)
    .map((c) => {
      const first = c.priceHistory[0].price;
      const last = c.priceHistory[c.priceHistory.length - 1].price;
      return (last - first) / first;
    })
    .sort((a, b) => a - b);

  if (changes.length < 3) return null;
  return changes[Math.floor(changes.length / 2)];
}
