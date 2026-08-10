/**
 * Market data access.
 *
 * Every external feed enters the system through this interface and nothing
 * above it knows where listings came from. That is a deliberate structural
 * decision, not tidiness: AutoFlair's data supply will change — scraped today,
 * licensed tomorrow, dealer-consented at scale — and each of those transitions
 * has to be a new implementation of `MarketDataSource`, never a change to the
 * engine.
 *
 * The other half of that decision is `provenance`. Where a listing came from
 * determines whether we may show it, resell derived figures from it, or use it
 * in a customer-facing audit trail, so it travels with the data rather than
 * being inferred later.
 */

import type { Comparable, IsoDate, MarketCode, Vehicle } from "../engine/types";

export type Provenance =
  | "licensed" // contractual feed; usable everywhere including audit trails
  | "dealer_consented" // the dealer's own data, granted to us; fully usable
  | "public_observed" // observed from a public listing page
  | "derived"; // computed by us from any of the above

export interface ComparableQuery {
  subject: Vehicle;
  market: MarketCode;
  asOf: IsoDate;
  /** How far back to look. The engine filters again; this bounds the fetch. */
  lookbackDays: number;
  /** Widen when the first pass returns too few comparables. */
  mileageTolerance?: number;
  ageToleranceMonths?: number;
  /** Restrict to regions, when a dealer only competes locally. */
  regions?: string[];
}

export interface ComparableResponse {
  comparables: Comparable[];
  /** Live listing counts now and 30 days ago, for supply-trend risk flags. */
  supplyChange?: { current: number; previous: number };
  provenance: Provenance;
  /** When this data was last refreshed at source. */
  retrievedAt: IsoDate;
}

export interface MarketDataSource {
  readonly id: string;
  readonly provenance: Provenance;
  supports(market: MarketCode): boolean;
  fetchComparables(query: ComparableQuery): Promise<ComparableResponse>;
}

/**
 * Query several sources and merge.
 *
 * Ordering matters: higher-trust provenance wins on conflict, so a dealer's own
 * confirmed sale always beats an observed listing describing the same car.
 */
export class CompositeMarketDataSource implements MarketDataSource {
  readonly id = "composite";
  readonly provenance: Provenance = "derived";
  private readonly sources: MarketDataSource[];

  constructor(sources: MarketDataSource[]) {
    this.sources = sources;
  }

  supports(market: MarketCode): boolean {
    return this.sources.some((source) => source.supports(market));
  }

  async fetchComparables(query: ComparableQuery): Promise<ComparableResponse> {
    const applicable = this.sources.filter((source) => source.supports(query.market));
    const responses = await Promise.all(
      applicable.map((source) => source.fetchComparables(query)),
    );

    const byId = new Map<string, { comparable: Comparable; rank: number }>();
    for (const response of responses) {
      const rank = provenanceRank(response.provenance);
      for (const comparable of response.comparables) {
        const existing = byId.get(comparable.id);
        if (!existing || rank > existing.rank) {
          byId.set(comparable.id, { comparable, rank });
        }
      }
    }

    const supply = responses.find((response) => response.supplyChange)?.supplyChange;

    return {
      comparables: [...byId.values()].map((entry) => entry.comparable),
      supplyChange: supply,
      provenance: "derived",
      retrievedAt: query.asOf,
    };
  }
}

function provenanceRank(provenance: Provenance): number {
  switch (provenance) {
    case "dealer_consented":
      return 3;
    case "licensed":
      return 2;
    case "public_observed":
      return 1;
    case "derived":
      return 0;
  }
}
