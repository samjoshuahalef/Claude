"use client";

import { useMemo } from "react";
import { Catalogue } from "@/lib/catalogue/catalogue";
import type { CatalogueData } from "@/lib/catalogue/catalogue";
import type { Generation, Variant } from "@/lib/catalogue/types";
import { kwToPs } from "@/lib/catalogue/normalise";

/**
 * Choosing the car.
 *
 * Four dependent selects, because value lives at variant level: two X3s of the
 * same year differ by CHF 25'000 on engine alone, so "BMW X3" is not enough
 * information to price anything. The cascade also guarantees the result is a
 * catalogue vehicle with a stable id — which is what every comparable, every
 * stored recommendation and every future outcome joins on.
 *
 * Generations are labelled with their years and manufacturer code, because that
 * is how the trade actually talks about them ("the G01") and because it lets a
 * dealer confirm at a glance that they picked the right one.
 */

export interface VehicleSelection {
  makeId: string;
  modelId: string;
  generationId: string;
  variantId: string;
}

interface Props {
  data: CatalogueData;
  value: VehicleSelection;
  onChange: (next: VehicleSelection) => void;
}

export function VehiclePicker({ data, value, onChange }: Props) {
  const catalogue = useMemo(() => new Catalogue(data), [data]);

  const models = catalogue.modelsFor(value.makeId);
  const generations = catalogue.generationsFor(value.modelId);
  const variants = catalogue.variantsFor(value.generationId);

  function selectMake(makeId: string) {
    const model = catalogue.modelsFor(makeId)[0];
    const generation = model ? catalogue.generationsFor(model.id)[0] : undefined;
    const variant = generation ? catalogue.variantsFor(generation.id)[0] : undefined;
    onChange({
      makeId,
      modelId: model?.id ?? "",
      generationId: generation?.id ?? "",
      variantId: variant?.id ?? "",
    });
  }

  function selectModel(modelId: string) {
    const generation = catalogue.generationsFor(modelId)[0];
    const variant = generation ? catalogue.variantsFor(generation.id)[0] : undefined;
    onChange({ ...value, modelId, generationId: generation?.id ?? "", variantId: variant?.id ?? "" });
  }

  function selectGeneration(generationId: string) {
    const variant = catalogue.variantsFor(generationId)[0];
    onChange({ ...value, generationId, variantId: variant?.id ?? "" });
  }

  return (
    <div className="stack-3">
      <div className="field-row">
        <label className="field">
          <span className="field__label">Make</span>
          <select className="select" value={value.makeId} onChange={(e) => selectMake(e.target.value)}>
            {catalogue.makes.map((make) => (
              <option key={make.id} value={make.id}>
                {make.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Model</span>
          <select className="select" value={value.modelId} onChange={(e) => selectModel(e.target.value)}>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field__label">Generation</span>
        <select
          className="select"
          value={value.generationId}
          onChange={(e) => selectGeneration(e.target.value)}
        >
          {generations.map((generation) => (
            <option key={generation.id} value={generation.id}>
              {generationLabel(generation)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Version</span>
        <select
          className="select"
          value={value.variantId}
          onChange={(e) => onChange({ ...value, variantId: e.target.value })}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variantLabel(variant)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function generationLabel(generation: Generation): string {
  const to = generation.to ? generation.to.slice(0, 4) : "now";
  return `${generation.name} · ${generation.from.slice(0, 4)}–${to}`;
}

/** Power in both units: papers say kW, listings say PS, dealers say both. */
function variantLabel(variant: Variant): string {
  const fuel = FUEL_LABEL[variant.fuel] ?? variant.fuel;
  return `${variant.name} · ${variant.powerKw} kW / ${kwToPs(variant.powerKw)} PS · ${fuel}`;
}

const FUEL_LABEL: Record<string, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  hybrid: "Hybrid",
  plugin_hybrid: "Plug-in hybrid",
  electric: "Electric",
  cng: "CNG",
  lpg: "LPG",
};
