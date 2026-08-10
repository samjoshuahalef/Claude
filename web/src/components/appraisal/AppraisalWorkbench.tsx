"use client";

import { useMemo, useState } from "react";
import { appraise } from "@/lib/engine/appraise";
import { ECONOMICS_PRESETS } from "@/lib/engine/defaults";
import { francs, toFrancs } from "@/lib/engine/money";
import type { Comparable, DealerEconomics, Vehicle } from "@/lib/engine/types";
import { formatAge, formatMoney, formatSignedMoney } from "@/lib/format";
import { monthsBetween } from "@/lib/engine/stats";
import { VehiclePicker, type VehicleSelection } from "./VehiclePicker";
import { ConditionPanel } from "./ConditionPanel";
import { Catalogue, type CatalogueData } from "@/lib/catalogue/catalogue";
import { DEFAULT_CONDITION, type VehicleCondition } from "@/lib/engine/condition";
import { DecisionHeadline } from "./DecisionHeadline";
import { BridgeWaterfall } from "./BridgeWaterfall";
import { PriceSpeedChart } from "./PriceSpeedChart";
import { ConfidencePanel } from "./ConfidencePanel";
import { EvidenceTable } from "./EvidenceTable";

/**
 * The appraisal workbench.
 *
 * Data arrives from the server already fetched; every recomputation after that
 * is synchronous and local, so moving the target-days slider redraws the whole
 * decision with no spinner and no round trip. That immediacy is the difference
 * between a tool a dealer opens during a negotiation and one they don't.
 */

export interface MarketBundle {
  label: string;
  /** Catalogue model this market covers, so a picked variant finds its market. */
  modelId: string;
  vehicle: Vehicle;
  comparables: Comparable[];
  supplyChange?: { current: number; previous: number };
}

interface Props {
  bundles: MarketBundle[];
  catalogue: CatalogueData;
  asOf: string;
}

export function AppraisalWorkbench({ bundles, catalogue: catalogueData, asOf }: Props) {
  const catalogue = useMemo(() => new Catalogue(catalogueData), [catalogueData]);

  const [presetId, setPresetId] = useState("standard");
  const [targetDays, setTargetDays] = useState(45);
  const [offeredFrancs, setOfferedFrancs] = useState("");
  const [condition, setCondition] = useState<VehicleCondition>(DEFAULT_CONDITION);

  const [selection, setSelection] = useState<VehicleSelection>(() => {
    const make = catalogueData.makes[0];
    const model = catalogueData.models.find((m) => m.makeId === make.id)!;
    const generation = catalogueData.generations.find((g) => g.modelId === model.id)!;
    const variant = catalogueData.variants.find((v) => v.generationId === generation.id)!;
    return { makeId: make.id, modelId: model.id, generationId: generation.id, variantId: variant.id };
  });

  const indexed = catalogue.get(selection.variantId);

  // The market for the chosen model. Comparables follow the catalogue selection
  // rather than a separate dropdown, so the two can never disagree about which
  // car is being priced.
  const bundle =
    bundles.find((item) => item.modelId === selection.modelId) ?? bundles[0];

  const [mileageKm, setMileageKm] = useState(62_000);
  const [registration, setRegistration] = useState("2022-04");

  const preset = ECONOMICS_PRESETS.find((p) => p.id === presetId) ?? ECONOMICS_PRESETS[1];
  const [targetGross, setTargetGross] = useState(toFrancs(preset.economics.targetGrossProfit));

  const economics: DealerEconomics = useMemo(
    () => ({
      ...preset.economics,
      targetGrossProfit: francs(targetGross),
      minimumGrossProfit: Math.min(
        preset.economics.minimumGrossProfit,
        Math.round(francs(targetGross) * 0.45),
      ),
      targetDaysToSale: targetDays,
    }),
    [preset, targetGross, targetDays],
  );

  /**
   * The subject is built from the catalogue variant, not from free text. Fuel,
   * transmission, drivetrain and power come from the chosen version, so they
   * can never contradict it — which is exactly how comparable sets get quietly
   * contaminated when the specification is typed by hand.
   */
  const subject: Vehicle = useMemo(() => {
    if (!indexed) return { ...bundle.vehicle, mileageKm, firstRegistration: registration };
    return {
      make: indexed.make.name,
      model: indexed.model.name,
      derivative: indexed.variant.name,
      firstRegistration: registration,
      mileageKm,
      fuel: indexed.variant.fuel as Vehicle["fuel"],
      transmission: indexed.variant.transmission,
      drivetrain: indexed.variant.drivetrain,
      powerKw: indexed.variant.powerKw,
      options: bundle.vehicle.options,
    };
  }, [indexed, bundle.vehicle, mileageKm, registration]);

  const result = useMemo(
    () =>
      appraise(
        { subject, economics, asOf, targetDaysToSale: targetDays, condition },
        bundle.comparables,
        { supplyChange: bundle.supplyChange },
      ),
    [subject, economics, asOf, targetDays, bundle, condition],
  );

  const offeredPrice = offeredFrancs.trim() === "" ? null : francs(Number(offeredFrancs) || 0);

  function selectPreset(id: string) {
    setPresetId(id);
    const next = ECONOMICS_PRESETS.find((p) => p.id === id);
    if (next) {
      setTargetGross(toFrancs(next.economics.targetGrossProfit));
      setTargetDays(next.economics.targetDaysToSale);
    }
  }

  return (
    <div className="workbench">
      <div className="workbench__col sticky-col">
        <section className="panel wb-vehicle">
          <header className="panel__head">
            <h2 className="t-h2">Vehicle</h2>
            <span className="t-xs num">
              {formatAge(monthsBetween(registration, asOf))}
            </span>
          </header>
          <div className="panel__body stack-4">
            <VehiclePicker data={catalogueData} value={selection} onChange={setSelection} />

            <div className="field-row">
              <label className="field">
                <span className="field__label">Mileage</span>
                <input
                  className="input num"
                  type="number"
                  step={500}
                  min={0}
                  value={mileageKm}
                  onChange={(event) => setMileageKm(Number(event.target.value))}
                />
              </label>
              <label className="field">
                <span className="field__label">First reg.</span>
                <input
                  className="input num"
                  type="month"
                  value={registration}
                  onChange={(event) => setRegistration(event.target.value)}
                />
              </label>
            </div>

            <label className="field">
              <span className="field__label">Asking price (optional)</span>
              <input
                className="input num"
                type="number"
                step={100}
                min={0}
                placeholder="What they want for it"
                value={offeredFrancs}
                onChange={(event) => setOfferedFrancs(event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="panel wb-condition">
          <header className="panel__head">
            <h2 className="t-h2">Condition and history</h2>
            <span className="t-xs">Biggest effect first</span>
          </header>
          <div className="panel__body">
            <ConditionPanel value={condition} onChange={setCondition} />
          </div>
        </section>

        <section className="panel wb-economics">
          <header className="panel__head">
            <h2 className="t-h2">Your economics</h2>
          </header>
          <div className="panel__body stack-6">
            <div className="field">
              <span className="field__label">Profile</span>
              <div className="segmented">
                {ECONOMICS_PRESETS.map((option) => (
                  <button
                    key={option.id}
                    className="segmented__item"
                    aria-pressed={option.id === presetId}
                    onClick={() => selectPreset(option.id)}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <div className="row row--between">
                <span className="field__label">Target gross profit</span>
                <span className="t-sm num t-strong">
                  {formatMoney(francs(targetGross))}
                </span>
              </div>
              <input
                className="slider"
                type="range"
                min={500}
                max={9000}
                step={100}
                value={targetGross}
                onChange={(event) => setTargetGross(Number(event.target.value))}
                aria-label="Target gross profit in francs"
              />
            </div>

            <div className="field">
              <div className="row row--between">
                <span className="field__label">Sell within</span>
                <span className="t-sm num t-strong">{targetDays} days</span>
              </div>
              <input
                className="slider"
                type="range"
                min={14}
                max={120}
                step={1}
                value={targetDays}
                onChange={(event) => setTargetDays(Number(event.target.value))}
                aria-label="Target days to sale"
              />
            </div>

            <hr className="divider" />

            <dl className="stack-2" style={{ margin: 0 }}>
              <CostRow label="Preparation" value={economics.reconCost} />
              <CostRow label="Warranty" value={economics.warrantyCost} />
              <CostRow label="Transport & registration" value={economics.logisticsCost} />
              <CostRow label="Holding per day" value={economics.holdingCostPerDay} />
            </dl>
          </div>
        </section>
      </div>

      <div className="workbench__col">
        {result.status === "insufficient" ? (
          <section className="panel refusal">
            <span className="refusal__mark" aria-hidden>
              !
            </span>
            <h2 className="t-h1">Not enough evidence to price this car</h2>
            <p className="t-body" style={{ maxWidth: "56ch" }}>
              {result.comparablesFound} usable comparables were found. AutoFlair will not
              produce a buying ceiling it cannot stand behind — a confident wrong number costs
              more than no number.
            </p>
            <ul className="list">
              {result.remedies.map((remedy) => (
                <li key={remedy}>{remedy}</li>
              ))}
            </ul>
          </section>
        ) : (
          <>
            <DecisionHeadline
              appraisal={result}
              offeredPrice={offeredPrice}
              targetDays={targetDays}
            />

            <section className="panel">
              <header className="panel__head">
                <h2 className="t-h2">How we get there</h2>
                <span className="t-xs">Retail → ceiling</span>
              </header>
              <div className="panel__body panel__body--flush">
                <BridgeWaterfall bridge={result.bridge} currency={result.currency} />
              </div>
            </section>

            {result.conditionLines.length > 0 && (
              <section className="panel">
                <header className="panel__head">
                  <h2 className="t-h2">What this car's history costs</h2>
                  <span className="t-xs num">
                    {formatMoney(result.baseRetailPrice)} → {formatMoney(result.expectedRetailPrice)}
                  </span>
                </header>
                <div className="panel__body stack-2">
                  {result.conditionLines.map((line) => (
                    <div className="row row--between" key={line.key}>
                      <span className="t-sm">{line.label}</span>
                      <span className="row" style={{ gap: "var(--s3)" }}>
                        <span className="t-xs num">
                          {(line.fraction * 100).toFixed(1)}%
                        </span>
                        <span
                          className={`t-sm num t-strong ${line.amount < 0 ? "t-neg" : "t-pos"}`}
                          style={{ minWidth: 92, textAlign: "right" }}
                        >
                          {formatSignedMoney(line.amount)}
                        </span>
                      </span>
                    </div>
                  ))}
                  {result.conditionHasUnknowns && (
                    <p className="t-xs" style={{ marginTop: "var(--s2)" }}>
                      Unanswered questions are priced as the worse case, because that is how the
                      buyer will price them. Confirming them moves the ceiling up.
                    </p>
                  )}
                </div>
              </section>
            )}

            <section className="panel">
              <header className="panel__head">
                <h2 className="t-h2">Price against selling speed</h2>
                <span className="t-xs num">
                  +1% price ≈ +{result.evidence.speedModel.daysPerPricePercent} days
                </span>
              </header>
              <div className="panel__body">
                <PriceSpeedChart
                  curve={result.priceSpeedCurve}
                  currency={result.currency}
                  recommendedPrice={result.expectedRetailPrice}
                />
              </div>
            </section>

            <section className="panel">
              <header className="panel__head">
                <h2 className="t-h2">Confidence</h2>
              </header>
              <div className="panel__body">
                <ConfidencePanel confidence={result.confidence} risks={result.risks} />
              </div>
            </section>

            <section className="panel">
              <header className="panel__head">
                <h2 className="t-h2">Evidence</h2>
                <span className="t-xs num">
                  Median {formatMoney(result.evidence.medianAdjustedPrice, result.currency)}
                </span>
              </header>
              <div className="panel__body panel__body--flush">
                <EvidenceTable evidence={result.evidence} currency={result.currency} />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="row row--between">
      <dt className="t-sm">{label}</dt>
      <dd className="t-sm num t-strong" style={{ margin: 0 }}>
        {formatMoney(value)}
      </dd>
    </div>
  );
}
