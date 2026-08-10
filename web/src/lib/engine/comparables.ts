/**
 * Comparable selection and normalisation.
 *
 * The job here is to turn "37 listings that look a bit like this car" into a
 * defensible set of prices that all describe *the subject vehicle*, plus the
 * arithmetic that got there. A dealer will accept a number they disagree with
 * if they can see the comparables behind it. They will never accept one they
 * cannot inspect.
 */

import { RETAIL_CHANNELS } from "./types";
import type {
  AdjustmentLine,
  AdjustmentModel,
  Comparable,
  ExcludedComparable,
  IsoDate,
  Vehicle,
  WeightedComparable,
} from "./types";
import { formatNumber, roundToFranc } from "./money";
import {
  clamp,
  daysBetween,
  isOutlier,
  median,
  monthsBetween,
  theilSen,
  weightedMedian,
} from "./stats";

/** Listings older than this contribute nothing: the market has moved. */
const MAX_COMPARABLE_AGE_DAYS = 120;
/** Half-life of a listing's evidential value, in days. */
const RECENCY_HALF_LIFE_DAYS = 45;
/** Mileage band around the subject, as a fraction, before a comparable is dropped. */
const MILEAGE_TOLERANCE = 0.45;
/** Age band around the subject, in months. */
const AGE_TOLERANCE_MONTHS = 30;
/** Below this many comparables we stop fitting coefficients and use priors. */
const MIN_SAMPLE_FOR_FIT = 8;

/**
 * Segment priors, expressed as fractions of the segment's median price so they
 * scale correctly from a CHF 12k Golf to a CHF 180k Porsche. Derived from
 * published European residual-value curves; they are a fallback, not a model.
 */
const PRIOR_DEPRECIATION_PER_1000KM = 0.0042; // 0.42% of value per 1,000 km
const PRIOR_DEPRECIATION_PER_MONTH = 0.0095; // 0.95% of value per month
/** Private sellers list below dealers: no warranty, no guarantee, no recourse. */
const PRIOR_SELLER_SPREAD = 0.08;

export interface ComparableSet {
  used: WeightedComparable[];
  excluded: ExcludedComparable[];
  adjustments: AdjustmentModel;
}

/**
 * Select, adjust and weight comparables for a subject vehicle.
 *
 * Order matters: we filter on hard criteria, fit the adjustment model on what
 * survives, normalise every listing onto the subject, and only then remove
 * price outliers — because a car that looks mispriced before mileage adjustment
 * is often correctly priced after it.
 */
export function buildComparableSet(
  subject: Vehicle,
  candidates: Comparable[],
  asOf: IsoDate,
): ComparableSet {
  const excluded: ExcludedComparable[] = [];
  const eligible: Comparable[] = [];

  for (const candidate of candidates) {
    const reason = hardExclusion(subject, candidate, asOf);
    if (reason) {
      excluded.push({ id: candidate.id, reason });
      continue;
    }
    eligible.push(candidate);
  }

  const adjustments = fitAdjustmentModel(subject, eligible, asOf);
  const normalised = eligible.map((candidate) =>
    normalise(subject, candidate, adjustments, asOf),
  );

  // Outlier removal happens on adjusted prices, once every car is on the same
  // basis. Weight is preserved so a heavily-weighted outlier still gets cut.
  const adjustedPrices = normalised.map((n) => n.adjustedPrice);
  const used: WeightedComparable[] = [];
  for (const item of normalised) {
    if (normalised.length >= 5 && isOutlier(item.adjustedPrice, adjustedPrices)) {
      excluded.push({ id: item.comparable.id, reason: "outlier_price" });
      continue;
    }
    used.push(item);
  }

  return { used, excluded, adjustments };
}

function hardExclusion(
  subject: Vehicle,
  candidate: Comparable,
  asOf: IsoDate,
): ExcludedComparable["reason"] | null {
  const v = candidate.vehicle;

  // Auction and trade prices are what dealers pay, not what the public pays.
  // Letting them into a retail comparable set understates retail by roughly the
  // whole gross margin, which would quietly halve every ceiling we produce.
  if (!RETAIL_CHANNELS.includes(candidate.sellerType)) return "not_retail_channel";

  if (
    v.make.toLowerCase() !== subject.make.toLowerCase() ||
    v.model.toLowerCase() !== subject.model.toLowerCase() ||
    v.fuel !== subject.fuel ||
    v.transmission !== subject.transmission
  ) {
    return "wrong_derivative";
  }

  // Power is the cheapest proxy for "same engine". A 20% gap is a different car
  // to a buyer, whatever the derivative string says.
  if (subject.powerKw > 0 && Math.abs(v.powerKw - subject.powerKw) / subject.powerKw > 0.2) {
    return "wrong_derivative";
  }

  const referenceDate = candidate.delistedAt ?? asOf;
  if (daysBetween(candidate.listedAt, asOf) > MAX_COMPARABLE_AGE_DAYS && !candidate.delistedAt) {
    return "too_stale";
  }
  if (daysBetween(referenceDate, asOf) > MAX_COMPARABLE_AGE_DAYS) {
    return "too_stale";
  }

  const mileageGap = Math.abs(v.mileageKm - subject.mileageKm);
  if (subject.mileageKm > 0 && mileageGap / Math.max(subject.mileageKm, 20_000) > MILEAGE_TOLERANCE) {
    return "mileage_out_of_range";
  }

  const ageGap = Math.abs(
    monthsBetween(v.firstRegistration, asOf) - monthsBetween(subject.firstRegistration, asOf),
  );
  if (ageGap > AGE_TOLERANCE_MONTHS) {
    return "wrong_derivative";
  }

  return null;
}

/**
 * Fit mileage and age coefficients from the comparable set itself.
 *
 * Fitting per-request rather than per-model means the coefficients reflect what
 * *this* market is doing right now, which is the whole point — a model whose
 * residuals are collapsing this quarter should produce a steeper curve today
 * than it did last quarter.
 */
function fitAdjustmentModel(
  subject: Vehicle,
  comparables: Comparable[],
  asOf: IsoDate,
): AdjustmentModel {
  const prices = comparables.map((c) => c.askingPrice);
  const medianPrice = median(prices);

  const priors: AdjustmentModel = {
    perThousandKm: -Math.round(medianPrice * PRIOR_DEPRECIATION_PER_1000KM),
    perMonthAge: -Math.round(medianPrice * PRIOR_DEPRECIATION_PER_MONTH),
    sellerTypeSpread: Math.round(medianPrice * PRIOR_SELLER_SPREAD),
    fittedOn: comparables.length,
    usedPriors: true,
  };

  if (comparables.length < MIN_SAMPLE_FOR_FIT) return priors;

  // Mileage first: it is the dominant term and the least confounded.
  const mileageFit = theilSen(
    comparables.map((c) => ({ x: c.vehicle.mileageKm / 1000, y: c.askingPrice })),
  );

  // Age is fitted on the mileage residual, so the two coefficients do not both
  // try to explain the same variance (older cars have more kilometres).
  const ageFit = theilSen(
    comparables.map((c) => ({
      x: monthsBetween(c.vehicle.firstRegistration, asOf),
      y: c.askingPrice - mileageFit.slope * (c.vehicle.mileageKm / 1000),
    })),
  );

  const dealerPrices = comparables.filter((c) => c.sellerType === "dealer").map((c) => c.askingPrice);
  const privatePrices = comparables
    .filter((c) => c.sellerType === "private")
    .map((c) => c.askingPrice);
  const spread =
    dealerPrices.length >= 3 && privatePrices.length >= 3
      ? median(dealerPrices) - median(privatePrices)
      : priors.sellerTypeSpread;

  // Guard against fits that are directionally absurd. A positive mileage
  // coefficient means the sample is too noisy to trust, not that mileage adds
  // value, so we fall back rather than propagate nonsense into a ceiling.
  const mileageSlope =
    mileageFit.slope < 0 ? mileageFit.slope : priors.perThousandKm;
  const ageSlope = ageFit.slope < 0 ? ageFit.slope : priors.perMonthAge;

  return {
    perThousandKm: Math.round(mileageSlope),
    perMonthAge: Math.round(ageSlope),
    sellerTypeSpread: Math.round(clamp(spread, 0, medianPrice * 0.2)),
    fittedOn: comparables.length,
    usedPriors: mileageFit.slope >= 0 || ageFit.slope >= 0,
  };
}

/** Move one comparable's price onto the subject vehicle's basis. */
function normalise(
  subject: Vehicle,
  comparable: Comparable,
  model: AdjustmentModel,
  asOf: IsoDate,
): WeightedComparable {
  const v = comparable.vehicle;
  const breakdown: AdjustmentLine[] = [];

  // Subject has more kilometres than the comparable => subject is worth less
  // => we adjust the comparable *down* to represent the subject.
  // Adjustments are rounded to whole francs: a comparable stated to the rappen
  // implies a precision the underlying regression does not have, and dealers
  // read spurious decimals as a sign the number was not thought about.
  const mileageDeltaThousands = (subject.mileageKm - v.mileageKm) / 1000;
  const mileageAdjustment = roundToFranc(model.perThousandKm * mileageDeltaThousands);
  if (mileageAdjustment !== 0) {
    breakdown.push({
      key: "mileage",
      label: `${formatKmDelta(subject.mileageKm - v.mileageKm)} vs. comparable`,
      amount: mileageAdjustment,
    });
  }

  const ageDelta =
    monthsBetween(subject.firstRegistration, asOf) - monthsBetween(v.firstRegistration, asOf);
  const ageAdjustment = roundToFranc(model.perMonthAge * ageDelta);
  if (ageAdjustment !== 0) {
    breakdown.push({
      key: "age",
      label: `${ageDelta > 0 ? "+" : ""}${ageDelta} months age`,
      amount: ageAdjustment,
    });
  }

  const optionsAdjustment = optionsDelta(subject, v, comparable.askingPrice);
  if (optionsAdjustment !== 0) {
    breakdown.push({
      key: "options",
      label: "Equipment difference",
      amount: optionsAdjustment,
    });
  }

  // Every comparable is expressed on a dealer basis, because that is what the
  // subject will be sold on.
  const sellerAdjustment =
    comparable.sellerType === "private" ? roundToFranc(model.sellerTypeSpread) : 0;
  if (sellerAdjustment !== 0) {
    breakdown.push({
      key: "seller_type",
      label: "Private listing → dealer basis",
      amount: sellerAdjustment,
    });
  }

  const adjustedPrice =
    comparable.askingPrice + breakdown.reduce((sum, line) => sum + line.amount, 0);

  return {
    comparable,
    adjustedPrice,
    adjustmentBreakdown: breakdown,
    weight: weightFor(subject, comparable, asOf),
    daysOnMarket: comparable.delistedAt
      ? daysBetween(comparable.listedAt, comparable.delistedAt)
      : null,
  };
}

/**
 * Equipment adjustment.
 *
 * Options are valued as a fraction of the car's price rather than at list
 * price, because a CHF 3'000 option contributes almost nothing to a five-year-old
 * car's value — a fact new dealers routinely get wrong when appraising.
 */
const OPTION_VALUE_FRACTION: Record<string, number> = {
  panoramic_roof: 0.012,
  head_up_display: 0.008,
  adaptive_cruise: 0.009,
  towbar: 0.010,
  air_suspension: 0.014,
  leather: 0.011,
  heated_seats: 0.004,
  premium_audio: 0.006,
  led_matrix: 0.007,
  winter_package: 0.005,
  sport_package: 0.013,
  navigation: 0.004,
};

function optionsDelta(subject: Vehicle, comparable: Vehicle, basePrice: number): number {
  const subjectSet = new Set(subject.options);
  const comparableSet = new Set(comparable.options);
  let fraction = 0;

  for (const option of subjectSet) {
    if (!comparableSet.has(option)) fraction += OPTION_VALUE_FRACTION[option] ?? 0.003;
  }
  for (const option of comparableSet) {
    if (!subjectSet.has(option)) fraction -= OPTION_VALUE_FRACTION[option] ?? 0.003;
  }

  // Equipment cannot swing a valuation by more than 6% either way. Beyond that
  // the cars are not comparable and the derivative match is the real problem.
  return roundToFranc(basePrice * clamp(fraction, -0.06, 0.06));
}

/**
 * How much this comparable counts. Product of three independent factors, each
 * in 0..1, so any one of them being poor pulls the weight down hard.
 */
function weightFor(subject: Vehicle, comparable: Comparable, asOf: IsoDate): number {
  const v = comparable.vehicle;

  const mileageGap = Math.abs(v.mileageKm - subject.mileageKm);
  const mileageScore = Math.exp(-mileageGap / Math.max(subject.mileageKm * 0.5, 25_000));

  const ageGap = Math.abs(
    monthsBetween(v.firstRegistration, asOf) - monthsBetween(subject.firstRegistration, asOf),
  );
  const ageScore = Math.exp(-ageGap / 18);

  const daysOld = daysBetween(comparable.delistedAt ?? comparable.listedAt, asOf);
  const recencyScore = Math.pow(0.5, Math.max(daysOld, 0) / RECENCY_HALF_LIFE_DAYS);

  // A confirmed sale is worth far more than a live asking price: one is a
  // transaction, the other is an opinion.
  const signalScore =
    comparable.soldSignal === "confirmed"
      ? 1
      : comparable.soldSignal === "likely"
        ? 0.85
        : comparable.soldSignal === "unsold"
          ? 0.6
          : 0.45;

  const derivativeScore =
    v.derivative.toLowerCase() === subject.derivative.toLowerCase() ? 1 : 0.75;

  return clamp(mileageScore * ageScore * recencyScore * signalScore * derivativeScore, 0.001, 1);
}

function formatKmDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${formatNumber(Math.abs(delta))} km`;
}

/** The market's central price for the subject vehicle, on a dealer basis. */
export function marketMedianPrice(set: WeightedComparable[]): number {
  return roundToFranc(
    weightedMedian(set.map((item) => ({ value: item.adjustedPrice, weight: item.weight }))),
  );
}
