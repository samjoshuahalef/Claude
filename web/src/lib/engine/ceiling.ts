/**
 * The buying ceiling — the number the whole product exists to produce.
 *
 * Stated plainly: given what this car will realistically retail for, what it
 * costs this specific dealership to prepare, warrant and hold it, and what
 * margin they need, what is the most they can pay and still be right?
 *
 * Two dealers looking at the same car get different answers here, and that is
 * the point. A valuation book cannot do this because it does not know the
 * dealer.
 */

import type {
  BridgeLine,
  DealerEconomics,
  SpeedModel,
  VatTreatment,
} from "./types";
import { roundCeilingDown, roundToFranc, vatFraction } from "./money";

export interface CeilingInputs {
  /** Expected retail (VAT-inclusive) at the target sale window. */
  expectedRetailPrice: number;
  /** Days the dealer is underwriting to. */
  expectedDays: number;
  economics: DealerEconomics;
  /** Gross profit being solved for. Target for the ceiling, minimum for walk-away. */
  requiredGrossProfit: number;
}

export interface CeilingResult {
  maxBuyPrice: number;
  vatPayable: number;
  totalCosts: number;
  bridge: BridgeLine[];
}

/**
 * Solve for the purchase price.
 *
 * With margin-equivalent VAT the tax depends on the purchase price, so this is
 * an equation rather than a subtraction. Let k = r/(1+r), S = sale, C = costs,
 * G = required gross, P = purchase:
 *
 *   G = S − (S − P)·k − P − C
 *     = S(1 − k) − P(1 − k) − C
 *   ⇒ P = S − (C + G) / (1 − k)
 *
 * Where no deduction is available the tax is on the full sale price and the
 * relationship collapses to a straight subtraction.
 */
export function solveCeiling(inputs: CeilingInputs): CeilingResult {
  const { expectedRetailPrice: sale, expectedDays, economics, requiredGrossProfit } = inputs;
  const k = vatFraction();

  const holdingCost = Math.round(economics.holdingCostPerDay * expectedDays);
  const totalCosts =
    economics.reconCost + economics.warrantyCost + economics.logisticsCost + holdingCost;

  const rawCeiling = solveForPurchase({
    sale,
    costs: totalCosts,
    requiredGross: requiredGrossProfit,
    k,
    treatment: economics.vatTreatment,
  });

  // Round down to the nearest 100 francs. Rounding a *limit* upward would hand
  // the dealer permission we did not calculate.
  const maxBuyPrice = Math.max(0, roundCeilingDown(rawCeiling));
  const vatPayable = vatOn(sale, maxBuyPrice, k, economics.vatTreatment);

  return {
    maxBuyPrice,
    vatPayable,
    totalCosts,
    bridge: buildBridge({
      sale,
      vatPayable,
      economics,
      holdingCost,
      requiredGrossProfit,
      maxBuyPrice,
      expectedDays,
    }),
  };
}

function solveForPurchase(args: {
  sale: number;
  costs: number;
  requiredGross: number;
  k: number;
  treatment: VatTreatment;
}): number {
  const { sale, costs, requiredGross, k, treatment } = args;

  if (treatment === "none") {
    // VAT is charged on the whole sale price with nothing to offset it.
    return sale * (1 - k) - costs - requiredGross;
  }

  // Notional deduction and ordinary input deduction are economically identical:
  // both leave the dealer taxed on the margin.
  return sale - (costs + requiredGross) / (1 - k);
}

/**
 * Rounded to whole francs so every line of the bridge is stated at the same
 * precision. A single figure carrying rappen among whole francs reads as a
 * rounding artefact and invites doubt about the rest of the arithmetic; the
 * closing line absorbs the difference, so the bridge still reconciles exactly.
 */
function vatOn(sale: number, purchase: number, k: number, treatment: VatTreatment): number {
  if (treatment === "none") return roundToFranc(sale * k);
  return roundToFranc(Math.max(0, sale - purchase) * k);
}

/**
 * The retail-to-ceiling walk-down.
 *
 * This is the explanation. Not prose about market conditions — eight signed
 * lines that sum to the ceiling, which a dealer can check against their own
 * arithmetic in about fifteen seconds. If they disagree with a line, they can
 * change the input that produced it.
 */
function buildBridge(args: {
  sale: number;
  vatPayable: number;
  economics: DealerEconomics;
  holdingCost: number;
  requiredGrossProfit: number;
  maxBuyPrice: number;
  expectedDays: number;
}): BridgeLine[] {
  const { sale, vatPayable, economics, holdingCost, requiredGrossProfit, maxBuyPrice } = args;

  const lines: Array<Omit<BridgeLine, "runningTotal">> = [
    { key: "expected_retail", label: "Expected retail price", amount: sale },
    { key: "vat", label: vatLabel(economics.vatTreatment), amount: -vatPayable },
    { key: "recon", label: "Preparation", amount: -economics.reconCost },
    { key: "warranty", label: "Warranty provision", amount: -economics.warrantyCost },
    { key: "logistics", label: "Transport & registration", amount: -economics.logisticsCost },
    {
      key: "holding",
      label: `Holding cost · ${args.expectedDays} days`,
      amount: -holdingCost,
    },
    { key: "target_margin", label: "Required gross profit", amount: -requiredGrossProfit },
  ];

  const bridge: BridgeLine[] = [];
  let running = 0;
  for (const line of lines) {
    running += line.amount;
    bridge.push({ ...line, runningTotal: running });
  }

  // The final line restates the rounded ceiling, so the displayed headline and
  // the displayed bridge can never disagree.
  bridge.push({
    key: "max_buy",
    label: "Maximum purchase price",
    amount: maxBuyPrice - running,
    runningTotal: maxBuyPrice,
  });

  return bridge;
}

function vatLabel(treatment: VatTreatment): string {
  switch (treatment) {
    case "notional_deduction":
      return "VAT on margin · notional input deduction";
    case "input_deduction":
      return "VAT on margin · input tax deducted";
    case "none":
      return "VAT on full sale price · no deduction";
  }
}

/**
 * Gross profit actually realised if the dealer pays `purchasePrice` and sells
 * at `salePrice` after `days`. Used for the price/speed trade-off view and,
 * later, for scoring recommendations against realised outcomes.
 */
export function grossProfitAt(args: {
  salePrice: number;
  purchasePrice: number;
  days: number;
  economics: DealerEconomics;
}): number {
  const { salePrice, purchasePrice, days, economics } = args;
  const k = vatFraction();
  const holdingCost = Math.round(economics.holdingCostPerDay * days);
  const costs =
    economics.reconCost + economics.warrantyCost + economics.logisticsCost + holdingCost;
  const vat = vatOn(salePrice, purchasePrice, k, economics.vatTreatment);
  return Math.round(salePrice - vat - purchasePrice - costs);
}

/**
 * Annualised return on the capital tied up in the car.
 *
 * Dealers under-weight this and it is where the product changes behaviour: a
 * CHF 2'000 margin in 30 days is a materially better business than CHF 3'500 in
 * 120 days, and almost nobody prices that instinctively.
 */
export function annualisedReturn(args: {
  grossProfit: number;
  capitalEmployed: number;
  days: number;
}): number {
  const { grossProfit, capitalEmployed, days } = args;
  if (capitalEmployed <= 0 || days <= 0) return 0;

  /**
   * Losses are not annualised.
   *
   * Annualising assumes the capital recycles at the same rate — sound for a
   * profit, nonsense for a loss, which is taken once and not repeated. Scaling
   * a loss by 365/days produces figures like −556%, which are arithmetically
   * derivable and completely meaningless, and a dealer who sees one correctly
   * concludes the software does not understand money.
   */
  if (grossProfit < 0) return grossProfit / capitalEmployed;

  return (grossProfit / capitalEmployed) * (365 / days);
}

export function speedModelSummary(model: SpeedModel): string {
  return `${model.medianDays} days at market median · +1% price ≈ +${model.daysPerPricePercent} days`;
}
