/**
 * Engine verification.
 *
 * Checks the appraisal engine against a synthetic market whose true parameters
 * are known, plus the algebraic identities the ceiling has to satisfy. Run with
 * `npm run verify`.
 *
 * This is the part that matters most: a pricing engine that is confidently
 * wrong is worse than no engine, so every headline number is checked against an
 * independent recomputation rather than a snapshot.
 */

import { appraise } from "../src/lib/engine/appraise";
import { DEFAULT_ECONOMICS } from "../src/lib/engine/defaults";
import { grossProfitAt } from "../src/lib/engine/ceiling";
import { formatMoney, francs, toFrancs } from "../src/lib/engine/money";
import type { AppraisalRequest, Vehicle } from "../src/lib/engine/types";
import { GROUND_TRUTH, SyntheticSwissMarketSource } from "../src/lib/data/fixtures";

const AS_OF = "2026-08-10";

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail = ""): void {
  checks++;
  if (condition) {
    console.log(`  [32m✓[0m ${label}${detail ? `  ${detail}` : ""}`);
  } else {
    failures++;
    console.log(`  [31m✗[0m ${label}${detail ? `  ${detail}` : ""}`);
  }
}

function near(actual: number, expected: number, tolerance: number): boolean {
  if (expected === 0) return Math.abs(actual) <= tolerance;
  return Math.abs(actual - expected) / Math.abs(expected) <= tolerance;
}

async function main(): Promise<void> {
  const source = new SyntheticSwissMarketSource();

  for (const truth of GROUND_TRUTH) {
    const subject: Vehicle = {
      make: truth.make,
      model: truth.model,
      derivative: truth.derivative,
      firstRegistration: monthsBefore(AS_OF, truth.referenceAgeMonths),
      mileageKm: truth.referenceMileageKm,
      fuel: truth.fuel,
      transmission: "automatic",
      drivetrain: "awd",
      powerKw: truth.powerKw,
      options: ["panoramic_roof", "adaptive_cruise", "leather", "navigation"],
    };

    const request: AppraisalRequest = { subject, economics: DEFAULT_ECONOMICS, asOf: AS_OF };
    const { comparables, supplyChange } = await source.fetchComparables({
      subject,
      market: "CH",
      asOf: AS_OF,
      lookbackDays: 120,
    });

    console.log(`\n[1m${truth.make} ${truth.model} ${truth.derivative}[0m`);
    console.log(
      `  market truth: ref ${formatMoney(truth.referencePrice)} · ` +
        `${toFrancs(truth.perThousandKm)}/1000km · ${truth.medianDays}d median · ` +
        `elasticity ${truth.elasticity}`,
    );

    const result = appraise(request, comparables, { supplyChange });

    if (result.status !== "ok") {
      check(`produces an appraisal`, false, `insufficient: ${result.reasons.join(", ")}`);
      continue;
    }

    console.log(
      `  engine:       retail ${formatMoney(result.expectedRetailPrice)} · ` +
        `ceiling ${formatMoney(result.maxBuyPrice)} · ` +
        `walk-away ${formatMoney(result.walkAwayPrice)} · ` +
        `${result.expectedDaysToSale}d · confidence ${result.confidence.score}`,
    );

    // ---- Recovery of the generating parameters -----------------------------
    check(
      "recovers the mileage coefficient",
      near(result.evidence.adjustments.perThousandKm, truth.perThousandKm, 0.45),
      `fitted ${toFrancs(result.evidence.adjustments.perThousandKm).toFixed(0)}/1000km ` +
        `vs true ${toFrancs(truth.perThousandKm).toFixed(0)}`,
    );

    check(
      "recovers the median time to sale",
      near(result.evidence.speedModel.medianDays, truth.medianDays, 0.5),
      `fitted ${result.evidence.speedModel.medianDays}d vs true ${truth.medianDays}d`,
    );

    check(
      "median adjusted price lands near the reference price",
      near(result.evidence.medianAdjustedPrice, truth.referencePrice, 0.12),
      `${formatMoney(result.evidence.medianAdjustedPrice)} vs ${formatMoney(truth.referencePrice)}`,
    );

    // ---- Algebraic identities the ceiling must satisfy ---------------------
    const realisedGross = grossProfitAt({
      salePrice: result.expectedRetailPrice,
      purchasePrice: result.maxBuyPrice,
      days: result.expectedDaysToSale,
      economics: DEFAULT_ECONOMICS,
    });
    check(
      "paying the ceiling yields at least the target margin",
      realisedGross >= DEFAULT_ECONOMICS.targetGrossProfit,
      `gross ${formatMoney(realisedGross)} vs target ${formatMoney(DEFAULT_ECONOMICS.targetGrossProfit)}`,
    );
    check(
      "ceiling is not needlessly conservative",
      realisedGross <= DEFAULT_ECONOMICS.targetGrossProfit + francs(120),
      `overshoot ${formatMoney(realisedGross - DEFAULT_ECONOMICS.targetGrossProfit)}`,
    );

    const walkAwayGross = grossProfitAt({
      salePrice: result.expectedRetailPrice,
      purchasePrice: result.walkAwayPrice,
      days: result.expectedDaysToSale,
      economics: DEFAULT_ECONOMICS,
    });
    check(
      "walk-away price yields at least the minimum margin",
      walkAwayGross >= DEFAULT_ECONOMICS.minimumGrossProfit,
      `gross ${formatMoney(walkAwayGross)}`,
    );
    check("walk-away sits above the target ceiling", result.walkAwayPrice > result.maxBuyPrice);

    // ---- The bridge must reconcile to the headline -------------------------
    const finalLine = result.bridge[result.bridge.length - 1];
    check(
      "bridge reconciles to the headline ceiling",
      finalLine.runningTotal === result.maxBuyPrice,
      `bridge ${formatMoney(finalLine.runningTotal)} vs headline ${formatMoney(result.maxBuyPrice)}`,
    );
    check(
      "bridge rounding line stays under CHF 100",
      Math.abs(finalLine.amount) < francs(100),
      `rounding ${formatMoney(finalLine.amount)}`,
    );

    // ---- The price/speed curve must be monotonic --------------------------
    const curve = result.priceSpeedCurve;
    const monotonic = curve.every(
      (point, i) => i === 0 || point.expectedDays >= curve[i - 1].expectedDays,
    );
    check("higher prices never sell faster", monotonic);

    const marginIncreasing = curve.every(
      (point, i) => i === 0 || point.grossProfitAtMaxBuy >= curve[i - 1].grossProfitAtMaxBuy,
    );
    check("higher prices never earn less at a fixed purchase price", marginIncreasing);

    // ---- Determinism ------------------------------------------------------
    const repeat = appraise(request, comparables, { supplyChange });
    check(
      "identical inputs produce an identical result",
      JSON.stringify(repeat) === JSON.stringify(result),
    );
  }

  // ---- Refusal behaviour --------------------------------------------------
  console.log(`\n[1mRefusal behaviour[0m`);
  const unknown: Vehicle = {
    make: "Lancia",
    model: "Delta",
    derivative: "HF Integrale",
    firstRegistration: "1992-06",
    mileageKm: 98_000,
    fuel: "petrol",
    transmission: "manual",
    drivetrain: "awd",
    powerKw: 158,
    options: [],
  };
  const empty = appraise(
    { subject: unknown, economics: DEFAULT_ECONOMICS, asOf: AS_OF },
    (await source.fetchComparables({ subject: unknown, market: "CH", asOf: AS_OF, lookbackDays: 120 }))
      .comparables,
  );
  check("refuses to price a vehicle with no comparables", empty.status === "insufficient");
  if (empty.status === "insufficient") {
    check("gives the dealer a reason", empty.reasons.length > 0, empty.reasons.join(", "));
    check("suggests a remedy", empty.remedies.length > 0);
  }

  console.log(
    `\n${failures === 0 ? "[32m" : "[31m"}${checks - failures}/${checks} checks passed[0m\n`,
  );
  if (failures > 0) process.exit(1);
}

function monthsBefore(date: string, months: number): string {
  const [year, month] = date.split("-").map(Number);
  const total = year * 12 + (month - 1) - months;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
