/**
 * Starting economics for a new dealership.
 *
 * These are opening positions, not the product. The moment a dealer confirms a
 * real purchase, preparation invoice or sale, their own figures replace these —
 * that replacement is the personalisation loop, and it is the reason the same
 * car ends up with a different ceiling at two garages on the same street.
 *
 * Figures reflect a Swiss independent dealer in the CHF 30–60k segment.
 */

import type { DealerEconomics } from "./types";
import { francs } from "./money";

export const DEFAULT_ECONOMICS: DealerEconomics = {
  currency: "CHF",
  market: "CH",
  reconCost: francs(1_450),
  warrantyCost: francs(620),
  logisticsCost: francs(280),
  /**
   * Floorplan financing, insurance, space and depreciation drag. Around CHF 28
   * a day on a CHF 45k car — roughly 8% annualised on capital plus fixed costs.
   * Dealers consistently guess low here, which is precisely why a car sitting
   * for 120 days costs far more than it feels like it does.
   */
  holdingCostPerDay: francs(28),
  targetGrossProfit: francs(3_200),
  minimumGrossProfit: francs(1_400),
  targetDaysToSale: 45,
  vatTreatment: "notional_deduction",
};

/** Presets a dealer can start from before their own data accumulates. */
export const ECONOMICS_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  economics: DealerEconomics;
}> = [
  {
    id: "volume",
    label: "Volume",
    description: "Thinner margins, faster turn, lower preparation spend",
    economics: {
      ...DEFAULT_ECONOMICS,
      reconCost: francs(950),
      warrantyCost: francs(420),
      targetGrossProfit: francs(2_100),
      minimumGrossProfit: francs(900),
      targetDaysToSale: 30,
    },
  },
  {
    id: "standard",
    label: "Standard",
    description: "Typical Swiss independent in the CHF 30–60k segment",
    economics: DEFAULT_ECONOMICS,
  },
  {
    id: "premium",
    label: "Premium",
    description: "Heavier preparation, longer warranty, higher margin per unit",
    economics: {
      ...DEFAULT_ECONOMICS,
      reconCost: francs(2_400),
      warrantyCost: francs(1_150),
      logisticsCost: francs(420),
      holdingCostPerDay: francs(38),
      targetGrossProfit: francs(5_400),
      minimumGrossProfit: francs(2_600),
      targetDaysToSale: 60,
    },
  },
];
