/**
 * AutoFlair domain model.
 *
 * Country is a field everywhere, not an afterthought: Switzerland is the only
 * launch market, but modelling it now means the Germany import lens is
 * additive columns later rather than a refactor through every surface.
 */

export type CountryCode = "CH" | "DE";
export type CurrencyCode = "CHF" | "EUR";

export const COUNTRY_CURRENCY: Record<CountryCode, CurrencyCode> = {
  CH: "CHF",
  DE: "EUR",
};

export type Amount = {
  value: number;
  currency: CurrencyCode;
};

export const chf = (value: number): Amount => ({ value, currency: "CHF" });

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  mileageKm: number;
  fuel: "Petrol" | "Diesel" | "Hybrid" | "Electric";
  gearbox: "Manual" | "Automatic";
  country: CountryCode;
};

/** A market segment — the unit trends and distributions are computed over. */
export type Segment = {
  id: string;
  label: string;
  country: CountryCode;
  medianPrice: Amount;
  /** Fractional change over the trailing window, e.g. -0.042 for -4.2%. */
  trend30d: number;
  listings: number;
  daysToSell: number;
};

/**
 * One line in a valuation. Retail value is the base; every mode is that base
 * plus a set of adjustments. Import duty and VAT are simply further entries
 * that are absent for a domestic car — which is what keeps the DE lens cheap.
 */
export type CostAdjustment = {
  label: string;
  amount: Amount;
  note?: string;
};

export type ValuationMode = "retail" | "trade-in" | "buy-target";

/**
 * Every mode is a basis plus a set of lines. Retail builds up from the
 * segment median; the other two build down from retail. Same shape, so the
 * breakdown panel is never empty and the import lens has somewhere obvious to
 * add duty, VAT and transport later.
 */
export type ValuationBreakdown = {
  basis: { label: string; amount: Amount };
  lines: CostAdjustment[];
};

export type Comparable = {
  id: string;
  title: string;
  year: number;
  mileageKm: number;
  price: Amount;
  daysListed: number;
  country: CountryCode;
  /** Fractional delta vs the computed market value. */
  deltaVsMarket: number;
};

export type Valuation = {
  vehicle: Vehicle;
  retail: Amount;
  /** 0..1 — surfaced everywhere the number is, never hidden. */
  confidence: number;
  sampleSize: number;
  daysToSell: number;
  reasons: string[];
  breakdown: Record<ValuationMode, ValuationBreakdown>;
  comparables: Comparable[];
  /** Price histogram buckets for the distribution chart. */
  distribution: Array<{ from: number; to: number; count: number }>;
};

export type AlertKind = "deal" | "price-drop" | "stock-aging" | "trend";

export type AlertItem = {
  id: string;
  kind: AlertKind;
  title: string;
  detail: string;
  /** Pre-formatted relative time — no Date.now() at render, so SSR is stable. */
  when: string;
  href: string;
};
