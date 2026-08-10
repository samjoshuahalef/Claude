/**
 * A deterministic synthetic Swiss market, implementing `MarketDataSource`.
 *
 * This exists so the engine can be developed, demonstrated and tested against a
 * market whose true parameters we know — if the fitted mileage coefficient does
 * not recover the one used to generate the data, the fit is broken and the test
 * says so. It is a stand-in for a real feed and is swapped out by implementing
 * the same interface; nothing above `MarketDataSource` changes.
 *
 * Every number here is seeded. No `Math.random`, no `Date.now`: the same query
 * returns the same market forever, which is what makes screenshots, tests and
 * replayed recommendations agree with each other.
 */

import type {
  Comparable,
  FuelType,
  IsoDate,
  MarketCode,
  PricePoint,
  SellerType,
  Vehicle,
} from "../engine/types";
import { francs } from "../engine/money";
import { SEED_CATALOGUE } from "../catalogue/seed";
import type {
  ComparableQuery,
  ComparableResponse,
  MarketDataSource,
  Provenance,
} from "./source";

/** mulberry32 — small, fast, and good enough for fixture generation. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller, so noise is normal rather than uniform. */
function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-9);
  const v = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The generating parameters of a model's market. The "ground truth". */
interface ModelMarket {
  make: string;
  model: string;
  /** Catalogue model, so the synthetic market spans the real variant list. */
  modelId: string;
  /** The variant the reference price describes; others scale off its list price. */
  referenceVariantId: string;
  derivative: string;
  fuel: FuelType;
  powerKw: number;
  /** Price of a reference car: this age, this mileage. */
  referencePrice: number;
  referenceAgeMonths: number;
  referenceMileageKm: number;
  /** True depreciation, in francs per 1,000 km and per month. */
  perThousandKm: number;
  perMonthAge: number;
  /** True median days to sale at the market median price. */
  medianDays: number;
  /** True price elasticity of selling time. */
  elasticity: number;
  /** How noisy this market is — dispersion as a fraction of price. */
  noise: number;
  /** Live listings typically standing in the Swiss market. */
  liveListings: number;
  soldListings: number;
  supplyTrend: number;
}

const MARKETS: ModelMarket[] = [
  {
    make: "BMW",
    model: "X3",
    modelId: "bmw-x3",
    referenceVariantId: "bmw-x3-g01-m40i",
    derivative: "M40i xDrive",
    fuel: "petrol",
    powerKw: 265,
    referencePrice: francs(58_500),
    referenceAgeMonths: 42,
    referenceMileageKm: 62_000,
    perThousandKm: francs(-235),
    perMonthAge: francs(-520),
    medianDays: 64,
    elasticity: 6.4,
    noise: 0.052,
    liveListings: 26,
    soldListings: 19,
    supplyTrend: 0.09,
  },
  {
    make: "Audi",
    model: "Q5",
    modelId: "audi-q5",
    referenceVariantId: "audi-q5-fy-45tfsi",
    derivative: "45 TFSI quattro S line",
    fuel: "petrol",
    powerKw: 195,
    referencePrice: francs(46_900),
    referenceAgeMonths: 48,
    referenceMileageKm: 71_000,
    perThousandKm: francs(-198),
    perMonthAge: francs(-430),
    medianDays: 78,
    elasticity: 5.8,
    noise: 0.058,
    liveListings: 31,
    soldListings: 16,
    supplyTrend: 0.21,
  },
  {
    make: "Mercedes-Benz",
    model: "GLC",
    modelId: "mb-glc",
    referenceVariantId: "mb-glc-x253-300de",
    derivative: "300 de 4MATIC",
    fuel: "plugin_hybrid",
    powerKw: 225,
    referencePrice: francs(52_400),
    referenceAgeMonths: 39,
    referenceMileageKm: 58_000,
    perThousandKm: francs(-244),
    perMonthAge: francs(-495),
    medianDays: 92,
    elasticity: 5.2,
    noise: 0.071,
    liveListings: 22,
    soldListings: 9,
    supplyTrend: 0.34,
  },
  {
    make: "Volkswagen",
    model: "Golf",
    modelId: "vw-golf",
    referenceVariantId: "vw-golf-mk8-gti",
    derivative: "2.0 TSI GTI",
    fuel: "petrol",
    powerKw: 180,
    referencePrice: francs(31_900),
    referenceAgeMonths: 45,
    referenceMileageKm: 64_000,
    perThousandKm: francs(-142),
    perMonthAge: francs(-285),
    medianDays: 51,
    elasticity: 7.1,
    noise: 0.046,
    liveListings: 38,
    soldListings: 27,
    supplyTrend: -0.04,
  },
  {
    make: "Skoda",
    model: "Octavia",
    modelId: "skoda-octavia",
    referenceVariantId: "skoda-octavia-mk4-rs-tdi",
    derivative: "2.0 TDI RS 4x4",
    fuel: "diesel",
    powerKw: 147,
    referencePrice: francs(28_400),
    referenceAgeMonths: 50,
    referenceMileageKm: 88_000,
    perThousandKm: francs(-118),
    perMonthAge: francs(-238),
    medianDays: 58,
    elasticity: 6.6,
    noise: 0.049,
    liveListings: 29,
    soldListings: 21,
    supplyTrend: 0.02,
  },
];

const REGIONS = ["ZH", "BE", "VD", "AG", "SG", "LU", "TI", "GE", "BS", "TG"];

const OPTION_POOL = [
  "panoramic_roof",
  "head_up_display",
  "adaptive_cruise",
  "towbar",
  "leather",
  "heated_seats",
  "led_matrix",
  "navigation",
  "sport_package",
  "winter_package",
];

export class SyntheticSwissMarketSource implements MarketDataSource {
  readonly id = "synthetic-ch";
  /**
   * Marked `derived` rather than `licensed` on purpose: this is generated data
   * and must never be presented to a dealer as observed market evidence.
   */
  readonly provenance: Provenance = "derived";

  supports(market: MarketCode): boolean {
    return market === "CH";
  }

  /**
   * Auction lots and trade offers.
   *
   * Priced around trade money rather than retail — roughly 78-84% of retail,
   * which is where a dealer can actually buy. Generated from the same underlying
   * fair price as the retail market so the gap between the two is the real
   * economic quantity sourcing is trying to measure, not an artefact.
   */
  async fetchAcquisitionCandidates(query: ComparableQuery): Promise<ComparableResponse> {
    const market = findMarket(query.subject);
    if (!market) {
      return { comparables: [], provenance: this.provenance, retrievedAt: query.asOf };
    }
    return {
      comparables: generateAcquisitionLots(market, query.asOf),
      provenance: this.provenance,
      retrievedAt: query.asOf,
    };
  }

  async fetchComparables(query: ComparableQuery): Promise<ComparableResponse> {
    const market = findMarket(query.subject);
    if (!market) {
      return {
        comparables: [],
        provenance: this.provenance,
        retrievedAt: query.asOf,
      };
    }

    const comparables = generateListings(market, query.asOf);
    const previous = Math.round(market.liveListings / (1 + market.supplyTrend));

    return {
      comparables,
      supplyChange: { current: market.liveListings, previous },
      provenance: this.provenance,
      retrievedAt: query.asOf,
    };
  }
}

function findMarket(subject: Vehicle): ModelMarket | undefined {
  return MARKETS.find(
    (m) =>
      m.make.toLowerCase() === subject.make.toLowerCase() &&
      m.model.toLowerCase() === subject.model.toLowerCase(),
  );
}

/**
 * Generate a market around the model's true parameters.
 *
 * Sold listings get a time on market drawn from the true price/speed
 * relationship, so a correct engine recovers the elasticity that produced them.
 */
function generateListings(market: ModelMarket, asOf: IsoDate): Comparable[] {
  const rng = seeded(hash(`${market.make}|${market.model}|${asOf}`));
  const listings: Comparable[] = [];

  /**
   * A real market carries every version of a model, not one.
   *
   * Generating only the reference variant made the market look plausible while
   * quietly guaranteeing that any other version the dealer picked had no
   * comparables at all — the engine would correctly refuse, and the refusal
   * would look like a bug rather than the fixture's fault.
   */
  const catalogueVariants = SEED_CATALOGUE.variants.filter((variant) =>
    SEED_CATALOGUE.generations.some(
      (generation) => generation.id === variant.generationId && generation.modelId === market.modelId,
    ),
  );
  const reference =
    catalogueVariants.find((variant) => variant.id === market.referenceVariantId) ??
    catalogueVariants[0];

  const perVariant = 11;
  const total = catalogueVariants.length * perVariant;
  const liveShare = market.liveListings / (market.liveListings + market.soldListings);

  for (let i = 0; i < total; i++) {
    const variant = catalogueVariants[i % catalogueVariants.length];
    const sold = i % perVariant >= Math.round(perVariant * liveShare);

    // Price scales with the variant's list price when new, which is what
    // separates a 20d from an M40i in the used market too.
    const variantFactor =
      reference?.listPriceNew && variant.listPriceNew
        ? variant.listPriceNew / reference.listPriceNew
        : 1;

    const ageMonths = Math.round(market.referenceAgeMonths + gaussian(rng) * 9);
    const mileageKm = Math.max(
      8_000,
      Math.round((market.referenceMileageKm + gaussian(rng) * 19_000) / 500) * 500,
    );

    const fairPrice =
      market.referencePrice * variantFactor +
      (market.perThousandKm * (mileageKm - market.referenceMileageKm)) / 1000 +
      market.perMonthAge * (ageMonths - market.referenceAgeMonths);

    // Sellers do not price perfectly. This noise is the dispersion the engine
    // has to see through, and it is why robust statistics are used throughout.
    const priceNoise = gaussian(rng) * market.noise;
    const sellerType: SellerType = rng() < 0.18 ? "private" : "dealer";
    const sellerDiscount = sellerType === "private" ? -0.075 : 0;

    const askingPrice =
      Math.round((fairPrice * (1 + priceNoise + sellerDiscount)) / francs(100)) * francs(100);

    const relative = (askingPrice - fairPrice) / fairPrice;
    const trueDays = Math.round(
      market.medianDays * Math.exp(market.elasticity * relative) * Math.exp(gaussian(rng) * 0.22),
    );
    const daysOnMarket = Math.max(4, Math.min(trueDays, 260));

    const delistedDaysAgo = sold ? Math.floor(rng() * 55) : 0;
    const listedAt = sold
      ? shiftDate(asOf, -(delistedDaysAgo + daysOnMarket))
      : shiftDate(asOf, -Math.floor(rng() * 70));
    const delistedAt = sold ? shiftDate(asOf, -delistedDaysAgo) : null;

    listings.push({
      id: `${market.make}-${market.model}-${i}`.toLowerCase(),
      vehicle: {
        make: market.make,
        model: market.model,
        derivative: variant.name,
        firstRegistration: monthsBefore(asOf, ageMonths),
        mileageKm,
        fuel: variant.fuel,
        transmission: variant.transmission,
        drivetrain: variant.drivetrain,
        powerKw: variant.powerKw + Math.round(gaussian(rng) * 2),
        options: pickOptions(rng),
      },
      askingPrice,
      currency: "CHF",
      market: "CH",
      sellerType,
      region: REGIONS[Math.floor(rng() * REGIONS.length)],
      listedAt,
      delistedAt,
      priceHistory: buildPriceHistory(askingPrice, listedAt, delistedAt ?? asOf, rng, market),
      soldSignal: sold ? (rng() < 0.72 ? "likely" : "confirmed") : "unsold",
    });
  }

  return listings;
}

/**
 * Listings that sit reprice downward. The size of that drift is what the
 * `price_falling` risk flag measures, so it has to be generated realistically
 * rather than as pure noise.
 */
function buildPriceHistory(
  askingPrice: number,
  listedAt: IsoDate,
  endsAt: IsoDate,
  rng: () => number,
  market: ModelMarket,
): PricePoint[] {
  const history: PricePoint[] = [{ at: listedAt, price: askingPrice }];
  const span = daysBetweenDates(listedAt, endsAt);
  if (span < 30 || rng() > 0.45) return history;

  const cuts = span > 75 ? 2 : 1;
  let current = askingPrice;
  for (let i = 1; i <= cuts; i++) {
    // Softer markets cut harder; the supply trend drives the size of the cut.
    const cut = (0.018 + rng() * 0.032) * (1 + Math.max(market.supplyTrend, 0));
    current = Math.round((current * (1 - cut)) / francs(100)) * francs(100);
    history.push({ at: shiftDate(listedAt, Math.round((span * i) / (cuts + 1))), price: current });
  }
  return history;
}

function pickOptions(rng: () => number): string[] {
  return OPTION_POOL.filter(() => rng() < 0.42);
}

function shiftDate(date: IsoDate, days: number): IsoDate {
  const ms = Date.parse(`${date}T00:00:00Z`) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

function monthsBefore(date: IsoDate, months: number): string {
  const [year, month] = date.split("-").map(Number);
  const total = year * 12 + (month - 1) - months;
  const targetYear = Math.floor(total / 12);
  const targetMonth = (total % 12) + 1;
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
}

function daysBetweenDates(from: IsoDate, to: IsoDate): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );
}

/** Trade money as a fraction of retail, by channel. */
const CHANNEL_LEVEL: Record<"auction" | "trade" | "private", number> = {
  auction: 0.785,
  trade: 0.825,
  private: 0.895,
};

/**
 * Cars offered on acquisition channels.
 *
 * Deliberately spread across the buying ceiling: some clear it comfortably, most
 * do not. A sourcing screen that surfaces every lot as a bargain is worthless —
 * the discipline of the feature is in what it rejects.
 */
function generateAcquisitionLots(market: ModelMarket, asOf: IsoDate): Comparable[] {
  const rng = seeded(hash(`acq|${market.make}|${market.model}|${asOf}`));
  const lots: Comparable[] = [];
  const channels: Array<"auction" | "trade" | "private"> = ["auction", "trade", "private"];
  const count = 14;

  for (let i = 0; i < count; i++) {
    const channel = channels[i % channels.length];
    const ageMonths = Math.round(market.referenceAgeMonths + gaussian(rng) * 10);
    const mileageKm = Math.max(
      8_000,
      Math.round((market.referenceMileageKm + gaussian(rng) * 21_000) / 500) * 500,
    );

    const fairRetail =
      market.referencePrice +
      (market.perThousandKm * (mileageKm - market.referenceMileageKm)) / 1000 +
      market.perMonthAge * (ageMonths - market.referenceAgeMonths);

    const level = CHANNEL_LEVEL[channel] * (1 + gaussian(rng) * 0.055);
    const askingPrice = Math.round((fairRetail * level) / francs(100)) * francs(100);
    const listedAt = shiftDate(asOf, -Math.floor(rng() * 21));

    lots.push({
      id: `acq-${market.make}-${market.model}-${i}`.toLowerCase(),
      vehicle: {
        make: market.make,
        model: market.model,
        derivative: market.derivative,
        firstRegistration: monthsBefore(asOf, ageMonths),
        mileageKm,
        fuel: market.fuel,
        transmission: "automatic",
        drivetrain: "awd",
        powerKw: market.powerKw + Math.round(gaussian(rng) * 4),
        options: pickOptions(rng),
      },
      askingPrice,
      currency: "CHF",
      market: "CH",
      sellerType: channel,
      region: REGIONS[Math.floor(rng() * REGIONS.length)],
      listedAt,
      delistedAt: null,
      priceHistory: [{ at: listedAt, price: askingPrice }],
      soldSignal: "unsold",
    });
  }

  return lots;
}

/** The vehicles the demo can appraise, exposed so the UI is never out of sync. */
export const DEMO_VEHICLES: Array<{ label: string; vehicle: Vehicle }> = MARKETS.map((m) => ({
  label: `${m.make} ${m.model} ${m.derivative}`,
  vehicle: {
    make: m.make,
    model: m.model,
    derivative: m.derivative,
    firstRegistration: "2022-04",
    mileageKm: m.referenceMileageKm,
    fuel: m.fuel,
    transmission: "automatic",
    drivetrain: "awd",
    powerKw: m.powerKw,
    options: ["panoramic_roof", "adaptive_cruise", "leather", "navigation"],
  },
}));

/** True generating parameters, for tests that check the fit recovers them. */
export const GROUND_TRUTH = MARKETS;
