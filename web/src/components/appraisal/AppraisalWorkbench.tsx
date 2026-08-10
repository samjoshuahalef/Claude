"use client";

import { useMemo, useState } from "react";
import { appraise } from "@/lib/engine/appraise";
import { ECONOMICS_PRESETS } from "@/lib/engine/defaults";
import { francs, toFrancs } from "@/lib/engine/money";
import type { Comparable, DealerEconomics, Vehicle } from "@/lib/engine/types";
import { formatAge, formatMoney } from "@/lib/format";
import { monthsBetween } from "@/lib/engine/stats";
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
  vehicle: Vehicle;
  comparables: Comparable[];
  supplyChange?: { current: number; previous: number };
}

interface Props {
  bundles: MarketBundle[];
  asOf: string;
}

export function AppraisalWorkbench({ bundles, asOf }: Props) {
  const [bundleIndex, setBundleIndex] = useState(0);
  const [presetId, setPresetId] = useState("standard");
  const [targetDays, setTargetDays] = useState(45);
  const [offeredFrancs, setOfferedFrancs] = useState("");

  const bundle = bundles[bundleIndex];
  const [mileageKm, setMileageKm] = useState(bundle.vehicle.mileageKm);
  const [registration, setRegistration] = useState(bundle.vehicle.firstRegistration);

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

  const subject: Vehicle = useMemo(
    () => ({ ...bundle.vehicle, mileageKm, firstRegistration: registration }),
    [bundle.vehicle, mileageKm, registration],
  );

  const result = useMemo(
    () =>
      appraise(
        { subject, economics, asOf, targetDaysToSale: targetDays },
        bundle.comparables,
        { supplyChange: bundle.supplyChange },
      ),
    [subject, economics, asOf, targetDays, bundle],
  );

  const offeredPrice = offeredFrancs.trim() === "" ? null : francs(Number(offeredFrancs) || 0);

  function selectBundle(index: number) {
    setBundleIndex(index);
    setMileageKm(bundles[index].vehicle.mileageKm);
    setRegistration(bundles[index].vehicle.firstRegistration);
  }

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
        <section className="panel">
          <header className="panel__head">
            <h2 className="t-h2">Vehicle</h2>
            <span className="t-xs num">
              {formatAge(monthsBetween(registration, asOf))}
            </span>
          </header>
          <div className="panel__body stack-4">
            <label className="field">
              <span className="field__label">Model</span>
              <select
                className="select"
                value={bundleIndex}
                onChange={(event) => selectBundle(Number(event.target.value))}
              >
                {bundles.map((item, index) => (
                  <option key={item.label} value={index}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

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

        <section className="panel">
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
