/**
 * Condition and history.
 *
 * Two cars of the same variant, year and mileage are not the same car, and in
 * Switzerland the gap between them is larger than most valuation tools admit.
 * A direct import with no Swiss service history and an expired MFK is a
 * materially different asset from a Swiss-delivered, accident-free car with a
 * fresh expertise — and the buyer knows it.
 *
 * Every factor below is a *signed adjustment to expected retail*, produced as a
 * line with a reason, so the walk-down stays auditable in exactly the same way
 * the cost bridge is.
 *
 * The coefficients are priors. They are the honest starting point and nothing
 * more: they are stated as fractions of value so they scale across segments,
 * and they are meant to be replaced, per dealership, by values fitted from that
 * dealer's own realised sales once enough outcomes exist. Until then the UI must
 * not present them as measured.
 */

import { roundToFranc } from "./money";

export interface VehicleCondition {
  /**
   * Swiss delivery or direct import.
   *
   * Swiss buyers discount imports — different equipment, no Swiss warranty
   * history, and the resale story is harder. It is one of the first questions a
   * Swiss buyer asks and one of the largest single adjustments here.
   */
  provenance: "swiss_delivery" | "direct_import" | "unknown";

  /**
   * Roadworthiness test. "Ab MFK" — sold with a fresh test — is a selling point
   * in Switzerland and shows up in the asking price.
   */
  mfk: "fresh" | "valid" | "due" | "expired" | "unknown";

  /** Documented accident damage, however well repaired. */
  accidents: "none" | "minor_repaired" | "major_repaired" | "unknown";

  /** Complete stamped service book, partial, or nothing. */
  serviceHistory: "complete" | "partial" | "none" | "unknown";

  previousOwners: number | null;

  /** Months of manufacturer or dealer warranty still to run. */
  warrantyMonthsRemaining: number;

  /** A second set of wheels is worth real money in a country with winter law. */
  secondWheelSet: boolean;

  /** Paint and interior, as the dealer would grade it on arrival. */
  cosmetic: "excellent" | "good" | "fair" | "poor" | "unknown";

  /** Smoked-in cars are harder to sell and often need an interior deep clean. */
  nonSmoker: boolean;
}

export const DEFAULT_CONDITION: VehicleCondition = {
  provenance: "swiss_delivery",
  mfk: "valid",
  accidents: "none",
  serviceHistory: "complete",
  previousOwners: 1,
  warrantyMonthsRemaining: 0,
  secondWheelSet: false,
  cosmetic: "good",
  nonSmoker: true,
};

export interface ConditionLine {
  key: string;
  label: string;
  /** Signed fraction of retail value. */
  fraction: number;
  /** Signed amount in Rappen, once applied to a base price. */
  amount: number;
}

export interface ConditionResult {
  lines: ConditionLine[];
  /** Total signed adjustment in Rappen. */
  total: number;
  /** Base retail after adjustment. */
  adjustedRetail: number;
  /**
   * True when the dealer left material questions unanswered. An unknown history
   * is not a neutral history — it is a discount, because the buyer will price it
   * as the worse case.
   */
  hasUnknowns: boolean;
}

/**
 * Priors, as fractions of retail value.
 *
 * Signs are all from the perspective of the car being worth more or less than
 * the market median for its specification.
 */
const PRIORS = {
  direct_import: -0.05,
  provenance_unknown: -0.025,

  mfk_fresh: 0.015,
  mfk_due: -0.012,
  mfk_expired: -0.028,
  mfk_unknown: -0.012,

  accident_minor: -0.07,
  accident_major: -0.16,
  accident_unknown: -0.04,

  service_partial: -0.025,
  service_none: -0.055,
  service_unknown: -0.03,

  owner_penalty_each: -0.012,
  owner_penalty_cap: -0.05,

  warranty_per_month: 0.0018,
  warranty_cap: 0.025,

  second_wheel_set: 0.012,

  cosmetic_excellent: 0.02,
  cosmetic_fair: -0.035,
  cosmetic_poor: -0.09,
  cosmetic_unknown: -0.02,

  smoker: -0.02,
} as const;

export function assessCondition(
  baseRetail: number,
  condition: VehicleCondition,
): ConditionResult {
  const lines: ConditionLine[] = [];
  const add = (key: string, label: string, fraction: number) => {
    if (fraction === 0) return;
    lines.push({ key, label, fraction, amount: roundToFranc(baseRetail * fraction) });
  };

  if (condition.provenance === "direct_import") {
    add("provenance", "Direct import — Swiss buyers discount it", PRIORS.direct_import);
  } else if (condition.provenance === "unknown") {
    add("provenance", "Provenance unconfirmed", PRIORS.provenance_unknown);
  }

  if (condition.mfk === "fresh") add("mfk", "Fresh MFK", PRIORS.mfk_fresh);
  else if (condition.mfk === "due") add("mfk", "MFK due", PRIORS.mfk_due);
  else if (condition.mfk === "expired") add("mfk", "MFK expired", PRIORS.mfk_expired);
  else if (condition.mfk === "unknown") add("mfk", "MFK status unconfirmed", PRIORS.mfk_unknown);

  if (condition.accidents === "minor_repaired") {
    add("accidents", "Repaired minor damage", PRIORS.accident_minor);
  } else if (condition.accidents === "major_repaired") {
    add("accidents", "Repaired structural damage", PRIORS.accident_major);
  } else if (condition.accidents === "unknown") {
    add("accidents", "Accident history unconfirmed", PRIORS.accident_unknown);
  }

  if (condition.serviceHistory === "partial") {
    add("service", "Partial service history", PRIORS.service_partial);
  } else if (condition.serviceHistory === "none") {
    add("service", "No service history", PRIORS.service_none);
  } else if (condition.serviceHistory === "unknown") {
    add("service", "Service history unconfirmed", PRIORS.service_unknown);
  }

  if (condition.previousOwners !== null && condition.previousOwners > 1) {
    const extra = condition.previousOwners - 1;
    const fraction = Math.max(PRIORS.owner_penalty_each * extra, PRIORS.owner_penalty_cap);
    add("owners", `${condition.previousOwners} previous owners`, fraction);
  }

  if (condition.warrantyMonthsRemaining > 0) {
    const fraction = Math.min(
      PRIORS.warranty_per_month * condition.warrantyMonthsRemaining,
      PRIORS.warranty_cap,
    );
    add("warranty", `${condition.warrantyMonthsRemaining} months warranty remaining`, fraction);
  }

  if (condition.secondWheelSet) add("wheels", "Second wheel set included", PRIORS.second_wheel_set);

  if (condition.cosmetic === "excellent") add("cosmetic", "Excellent cosmetic condition", PRIORS.cosmetic_excellent);
  else if (condition.cosmetic === "fair") add("cosmetic", "Fair cosmetic condition", PRIORS.cosmetic_fair);
  else if (condition.cosmetic === "poor") add("cosmetic", "Poor cosmetic condition", PRIORS.cosmetic_poor);
  else if (condition.cosmetic === "unknown") add("cosmetic", "Condition not inspected", PRIORS.cosmetic_unknown);

  if (!condition.nonSmoker) add("smoker", "Smoked in", PRIORS.smoker);

  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  const hasUnknowns =
    condition.provenance === "unknown" ||
    condition.mfk === "unknown" ||
    condition.accidents === "unknown" ||
    condition.serviceHistory === "unknown" ||
    condition.cosmetic === "unknown";

  return {
    lines,
    total,
    adjustedRetail: Math.max(0, roundToFranc(baseRetail + total)),
    hasUnknowns,
  };
}

/**
 * The questions worth asking, in the order they change the answer most.
 *
 * A trade-in happens with a customer waiting, so the sequence matters: ask the
 * two questions that move the number by five per cent before the one that moves
 * it by one.
 */
export const CONDITION_QUESTIONS = [
  { key: "accidents", question: "Any accident damage?", weight: PRIORS.accident_major },
  { key: "provenance", question: "Swiss delivery or import?", weight: PRIORS.direct_import },
  { key: "serviceHistory", question: "Full service history?", weight: PRIORS.service_none },
  { key: "cosmetic", question: "Paint and interior?", weight: PRIORS.cosmetic_poor },
  { key: "mfk", question: "MFK status?", weight: PRIORS.mfk_expired },
  { key: "owners", question: "How many owners?", weight: PRIORS.owner_penalty_cap },
  { key: "warranty", question: "Warranty remaining?", weight: PRIORS.warranty_cap },
  { key: "wheels", question: "Second wheel set?", weight: PRIORS.second_wheel_set },
] as const;
