/**
 * AutoFlair domain types.
 *
 * Design rules that hold across the whole engine:
 *  - Money is integer Rappen (CHF/100). Never floats. See `money.ts`.
 *  - Every number the dealer sees must be traceable to inputs via `Evidence`.
 *  - A result may be `insufficient`. Refusing to answer is a valid answer.
 */

/** ISO-4217 currency. Market expansion adds members here, not new code paths. */
export type Currency = "CHF" | "EUR";

/** A market is the unit of expansion: taxonomy, tax rules and comparables are scoped to it. */
export type MarketCode = "CH" | "DE" | "AT" | "FR";

export type FuelType =
  | "petrol"
  | "diesel"
  | "hybrid"
  | "plugin_hybrid"
  | "electric"
  | "other";

export type Transmission = "manual" | "automatic";

export type Drivetrain = "fwd" | "rwd" | "awd";

export type SellerType = "dealer" | "private";

/** The vehicle being appraised, or a comparable from the market. */
export interface Vehicle {
  make: string;
  model: string;
  /** Trim / engine variant, e.g. "xDrive30d M Sport". Drives comparable matching. */
  derivative: string;
  /** First registration. Age is derived from this, never stored denormalised. */
  firstRegistration: IsoMonth;
  mileageKm: number;
  fuel: FuelType;
  transmission: Transmission;
  drivetrain: Drivetrain;
  /** kW, the Swiss/EU convention. Displayed as PS where dealers expect it. */
  powerKw: number;
  /** Canonical equipment codes present on the car. Used for option adjustments. */
  options: string[];
}

/** "2021-03" — month granularity is all registration data reliably gives us. */
export type IsoMonth = string;

/** A market listing used as evidence. Sourced through `MarketDataSource`. */
export interface Comparable {
  id: string;
  vehicle: Vehicle;
  /** Current or final asking price, VAT-inclusive, in Rappen. */
  askingPrice: number;
  currency: Currency;
  market: MarketCode;
  sellerType: SellerType;
  /** Two-letter Swiss canton or equivalent regional code. */
  region: string;
  /** When the listing first appeared. */
  listedAt: IsoDate;
  /**
   * When the listing disappeared, if it has. Absence means still live.
   * Disappearance is a *proxy* for sale, not proof of one — `soldSignal` grades it.
   */
  delistedAt: IsoDate | null;
  /** Asking-price changes over the listing's life, oldest first. */
  priceHistory: PricePoint[];
  /** How confident we are that delisting meant a sale. */
  soldSignal: SoldSignal;
}

export type IsoDate = string; // "2026-08-10"

export interface PricePoint {
  at: IsoDate;
  price: number;
}

/**
 * Delisting is ambiguous: a car can vanish because it sold, because the dealer
 * gave up, or because the listing expired. We never treat these as equivalent.
 */
export type SoldSignal =
  | "confirmed" // dealer-reported sale through AutoFlair
  | "likely" // delisted without a price rise, within a plausible window
  | "ambiguous" // delisted but the pattern is unclear
  | "unsold"; // still live, or relisted

/**
 * A dealership's own economics. This is why the same car has a different
 * ceiling for two dealers, and it is the personalisation surface.
 */
export interface DealerEconomics {
  currency: Currency;
  market: MarketCode;
  /** Preparation/reconditioning. Either a flat figure or a per-segment table. */
  reconCost: number;
  /** Cost of the warranty the dealer supplies with the car. */
  warrantyCost: number;
  /** Transport / import / registration handling. */
  logisticsCost: number;
  /**
   * Cost of holding one car for one day: financing on the floorplan, insurance,
   * space, depreciation drag. Dealers underestimate this; it is what makes
   * ageing stock expensive and it belongs in every ceiling calculation.
   */
  holdingCostPerDay: number;
  /** Gross profit the dealer wants on this class of car. */
  targetGrossProfit: number;
  /** Below this, the deal is not worth doing at all. */
  minimumGrossProfit: number;
  /** The sale window the dealer is underwriting to. */
  targetDaysToSale: number;
  /** How purchase VAT is treated. Drives a materially different ceiling. */
  vatTreatment: VatTreatment;
}

/**
 * Swiss VAT on used vehicles.
 *
 * Since 2018 Switzerland replaced margin taxation with the notional input tax
 * deduction (fiktiver Vorsteuerabzug): buying from a non-VAT-registered seller
 * lets the dealer deduct notional input tax on the purchase price while
 * charging VAT on the full sale price. Economically this taxes the margin.
 *
 * `input_deduction` is the ordinary B2B case: a VAT invoice from the seller.
 * `none` is the punitive case — no deduction, VAT due on the whole sale price.
 */
export type VatTreatment = "notional_deduction" | "input_deduction" | "none";

/** Everything needed to appraise, gathered in one place. */
export interface AppraisalRequest {
  subject: Vehicle;
  economics: DealerEconomics;
  /** Optional override of the dealer's default sale window for this car. */
  targetDaysToSale?: number;
  /** Valuation date. Injected, never `new Date()` inside the engine. */
  asOf: IsoDate;
}

/**
 * The engine's answer.
 *
 * `status` gates everything: on "insufficient" the numeric fields are absent
 * and the UI must not invent a figure. This is the financial-trust contract.
 */
export type AppraisalResult = SufficientAppraisal | InsufficientAppraisal;

export interface InsufficientAppraisal {
  status: "insufficient";
  /** Why we will not answer, in machine-readable form. */
  reasons: InsufficiencyReason[];
  /** What would unlock an answer. */
  remedies: string[];
  comparablesFound: number;
  asOf: IsoDate;
}

export type InsufficiencyReason =
  | "too_few_comparables"
  | "comparables_too_dispersed"
  | "comparables_too_stale"
  | "no_sale_observations";

export interface SufficientAppraisal {
  status: "ok";
  asOf: IsoDate;
  currency: Currency;

  /** The headline: the most the dealer should pay to hit their target margin. */
  maxBuyPrice: number;
  /** The most they should pay to clear their *minimum* margin. Never exceed. */
  walkAwayPrice: number;

  /** What we expect the car to retail for, at the target sale window. */
  expectedRetailPrice: number;
  /** Retail price as a function of how fast the dealer wants to sell. */
  priceSpeedCurve: PriceSpeedPoint[];

  /** Expected days on market at `expectedRetailPrice`. */
  expectedDaysToSale: number;

  /** The full walk-down from retail to ceiling. This *is* the explanation. */
  bridge: BridgeLine[];

  confidence: Confidence;
  evidence: Evidence;
  /** Machine-readable risk flags, rendered as short phrases — never paragraphs. */
  risks: RiskFlag[];
}

export interface PriceSpeedPoint {
  retailPrice: number;
  expectedDays: number;
  /** Where this price sits in the live comparable set, 0..1. */
  marketPercentile: number;
  /** Gross profit at this price, given the ceiling actually paid. */
  grossProfitAtMaxBuy: number;
}

/**
 * One line of the retail-to-ceiling bridge. Signed amounts, so the UI can
 * render a waterfall without knowing the semantics of each line.
 */
export interface BridgeLine {
  key: BridgeKey;
  label: string;
  amount: number;
  /** Running total after this line is applied. */
  runningTotal: number;
}

export type BridgeKey =
  | "expected_retail"
  | "vat"
  | "recon"
  | "warranty"
  | "logistics"
  | "holding"
  | "target_margin"
  | "max_buy";

export interface Confidence {
  /** 0..100. Composite, never a vibe. */
  score: number;
  band: ConfidenceBand;
  /** The individual drivers, so the dealer can see *why* confidence is low. */
  drivers: ConfidenceDriver[];
}

export type ConfidenceBand = "high" | "moderate" | "low";

export interface ConfidenceDriver {
  key: "sample_size" | "dispersion" | "recency" | "match_quality" | "sale_observations";
  label: string;
  /** 0..1 contribution before weighting. */
  score: number;
  detail: string;
}

/** The audit trail. Every headline number must be reconstructible from this. */
export interface Evidence {
  /** Comparables actually used, with the weight each carried. */
  comparables: WeightedComparable[];
  /** Comparables found but excluded, and why. Transparency about what we ignored. */
  excluded: ExcludedComparable[];
  /** Adjustments applied to normalise comparables onto the subject vehicle. */
  adjustments: AdjustmentModel;
  /** The fitted price/speed relationship. */
  speedModel: SpeedModel;
  sampleSize: number;
  medianAdjustedPrice: number;
  interquartileRange: number;
}

export interface WeightedComparable {
  comparable: Comparable;
  /** Price after normalising to the subject vehicle. */
  adjustedPrice: number;
  /** Each adjustment applied, in Rappen, so the dealer sees the arithmetic. */
  adjustmentBreakdown: AdjustmentLine[];
  /** 0..1 similarity-and-recency weight in the weighted median. */
  weight: number;
  /** Observed days on market, when the listing has ended. */
  daysOnMarket: number | null;
}

export interface AdjustmentLine {
  key: "mileage" | "age" | "options" | "seller_type" | "region";
  label: string;
  amount: number;
}

export interface ExcludedComparable {
  id: string;
  reason: "wrong_derivative" | "outlier_price" | "too_stale" | "mileage_out_of_range";
}

/** Coefficients fitted from the comparable set, not hardcoded guesses. */
export interface AdjustmentModel {
  /** Rappen per 1,000 km. Negative: more mileage, less money. */
  perThousandKm: number;
  /** Rappen per month of age. Negative. */
  perMonthAge: number;
  /** Private-seller listings sit below dealer listings; this closes the gap. */
  sellerTypeSpread: number;
  /** Sample the coefficients were fitted on. Below ~8 we fall back to priors. */
  fittedOn: number;
  /** True when the market sample was too thin and segment priors were used. */
  usedPriors: boolean;
}

export interface SpeedModel {
  /** Days to sale at the market median price. */
  medianDays: number;
  /**
   * Raw elasticity from the fit of log(days) on relative price position:
   * days = medianDays * exp(elasticity * relativePrice).
   */
  elasticity: number;
  /** Human-facing form of the same thing: extra days per +1% of price. */
  daysPerPricePercent: number;
  /** Observations the fit used. */
  fittedOn: number;
  usedPriors: boolean;
}

export interface RiskFlag {
  key:
    | "thin_liquidity"
    | "supply_rising"
    | "price_falling"
    | "high_mileage"
    | "seasonal"
    | "wide_dispersion"
    | "stale_comparables";
  severity: "info" | "warning" | "critical";
  /** One short line. Never a paragraph. */
  message: string;
}
