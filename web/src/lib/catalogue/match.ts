/**
 * Resolving a listing to a catalogue vehicle.
 *
 * The resolver's most important behaviour is refusing. When two variants are
 * both plausible it returns `ambiguous` rather than picking the likelier one,
 * because a wrong variant is not a small error: an X3 M40i and an X3 20d are
 * CHF 25'000 apart, and a comparable set silently contaminated with the wrong
 * engine produces a confident, wrong ceiling. A listing we cannot place is
 * simply not evidence, and that is a cheaper outcome than a plausible guess.
 *
 * Methods are tried strongest first. Each one that succeeds records what it
 * keyed on, so any valuation can be audited back to why a given car was
 * considered comparable.
 */

import type { RawVehicleDescription, VehicleRef } from "./types";
import type { Catalogue, IndexedVariant } from "./catalogue";
import {
  normaliseFuel,
  normaliseTransmission,
  psToKw,
  tokens,
  weightedSimilarity,
} from "./normalise";

/** Power tolerance when checking a candidate against a listing's stated output. */
const POWER_TOLERANCE = 0.06;
/** Below this similarity nothing is proposed at all. */
const MIN_SIMILARITY = 0.42;
/** Two candidates within this of each other are not distinguishable. */
const AMBIGUITY_MARGIN = 0.06;

export interface TypeApprovalIndex {
  /** Swiss Typengenehmigung number → variant. */
  swiss: Map<string, string>;
  /** German KBA "hsn/tsn" → variant. */
  german: Map<string, string>;
}

export interface MatchOptions {
  typeApproval?: TypeApprovalIndex;
}

export function resolveVehicle(
  raw: RawVehicleDescription,
  catalogue: Catalogue,
  options: MatchOptions = {},
): VehicleRef | null {
  /**
   * 1. Type approval.
   *
   * The Swiss Fahrzeugausweis carries a Typengenehmigung number and German
   * papers carry HSN/TSN. Both identify a homologated type exactly. When the
   * dealer has the papers in hand — which, at a trade-in desk, they do — this
   * is the only method that needs no interpretation at all.
   */
  const approval = matchByTypeApproval(raw, options.typeApproval);
  if (approval) return finish(catalogue, approval, "type_approval", 1, ["type approval number"]);

  // 2. VIN. Positions 1-3 give the manufacturer; 4-8 are manufacturer-defined
  //    and only sometimes reach engine level, so this narrows rather than
  //    resolves, and we hand what it found to the constrained matcher.
  const vinMake = raw.vin ? makeFromVin(raw.vin, catalogue) : undefined;

  const powerKw = raw.powerKw ?? (raw.powerPs ? psToKw(raw.powerPs) : undefined);
  const fuel = normaliseFuel(raw.fuel);
  const transmission = normaliseTransmission(raw.transmission);

  // Narrow by make and model when the listing states them; otherwise search all.
  const make = raw.make ? catalogue.findMake(raw.make) : vinMake;
  const model = make && raw.model ? catalogue.findModel(make.id, raw.model) : undefined;

  let pool = model
    ? catalogue.candidates(model.id)
    : make
      ? catalogue.all().filter((indexed) => indexed.make.id === make.id)
      : catalogue.all();

  if (pool.length === 0) return null;

  // Hard constraints. A candidate contradicted by the listing's own facts is
  // not a weaker match, it is not a match.
  const before = pool.length;
  pool = pool.filter((indexed) => satisfiesConstraints(indexed, { powerKw, fuel, transmission, raw }));
  if (pool.length === 0) {
    return {
      variantId: "",
      generationId: "",
      modelId: model?.id ?? "",
      makeId: make?.id ?? "",
      method: "unresolved",
      confidence: 0,
      evidence: [`${before} candidates, all contradicted by stated specification`],
    };
  }

  const query = tokens(
    [raw.variant, raw.title, raw.model, raw.make].filter(Boolean).join(" "),
  );

  const scored = pool
    .map((indexed) => ({
      indexed,
      score: weightedSimilarity(indexed.tokens, query, catalogue.frequencies, catalogue.size),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const runnerUp = scored[1];

  // A single survivor after hard constraints is a resolution in itself, even if
  // the text is unhelpful: nothing else in the catalogue can be this car.
  if (pool.length === 1) {
    return finish(catalogue, pool[0].variant.id, "constrained", 0.9, [
      "only candidate consistent with power, fuel and transmission",
    ]);
  }

  if (!best || best.score < MIN_SIMILARITY) {
    return {
      variantId: "",
      generationId: "",
      modelId: model?.id ?? "",
      makeId: make?.id ?? "",
      method: "unresolved",
      confidence: 0,
      evidence: [`best similarity ${best ? best.score.toFixed(2) : "0"} below threshold`],
    };
  }

  if (runnerUp && best.score - runnerUp.score < AMBIGUITY_MARGIN) {
    return {
      variantId: "",
      generationId: "",
      modelId: model?.id ?? "",
      makeId: make?.id ?? "",
      method: "ambiguous",
      confidence: best.score,
      evidence: [
        `${best.indexed.variant.name} and ${runnerUp.indexed.variant.name} are equally plausible`,
      ],
    };
  }

  const exact = best.indexed.tokens.every((token) => query.includes(token));
  const method = exact ? "exact" : powerKw || fuel ? "constrained" : "fuzzy";
  const confidence = Math.min(0.99, exact ? 0.95 : 0.6 + best.score * 0.35);

  return finish(catalogue, best.indexed.variant.id, method, confidence, [
    `matched "${best.indexed.variant.name}" at ${best.score.toFixed(2)}`,
    ...(powerKw ? [`power ${powerKw} kW consistent`] : []),
    ...(fuel ? [`fuel ${fuel} consistent`] : []),
  ]);
}

function satisfiesConstraints(
  indexed: IndexedVariant,
  facts: {
    powerKw?: number;
    fuel: string | null;
    transmission: "manual" | "automatic" | null;
    raw: RawVehicleDescription;
  },
): boolean {
  const { variant, generation } = indexed;

  if (facts.powerKw && variant.powerKw > 0) {
    const gap = Math.abs(variant.powerKw - facts.powerKw) / variant.powerKw;
    if (gap > POWER_TOLERANCE) return false;
  }

  if (facts.fuel && variant.fuel !== facts.fuel) return false;
  if (facts.transmission && variant.transmission !== facts.transmission) return false;

  // A registration date outside the generation's production window means the
  // generation is wrong, whatever the text says.
  if (facts.raw.firstRegistration) {
    const registered = facts.raw.firstRegistration.slice(0, 7);
    if (registered < generation.from.slice(0, 7)) return false;
    if (generation.to && registered > addMonths(generation.to.slice(0, 7), 9)) return false;
  }

  return true;
}

/** Registrations trail production by up to a few months of stock in transit. */
function addMonths(isoMonth: string, months: number): string {
  const [year, month] = isoMonth.split("-").map(Number);
  const total = year * 12 + (month - 1) + months;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function matchByTypeApproval(
  raw: RawVehicleDescription,
  index: TypeApprovalIndex | undefined,
): string | undefined {
  if (!index) return undefined;
  if (raw.typeApproval) {
    const hit = index.swiss.get(raw.typeApproval.toUpperCase().replace(/\s/g, ""));
    if (hit) return hit;
  }
  if (raw.hsn && raw.tsn) {
    const hit = index.german.get(`${raw.hsn.trim()}/${raw.tsn.trim().toUpperCase()}`);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * World Manufacturer Identifier — the first three characters of a VIN.
 *
 * Enough to fix the make, never enough to fix the trim on European cars: the
 * descriptor section is manufacturer-defined and not published, so anyone
 * claiming VIN-to-trim accuracy in Europe is either licensing a manufacturer
 * feed or guessing.
 */
const WMI: Record<string, string> = {
  WBA: "bmw",
  WBS: "bmw",
  WBY: "bmw",
  "4US": "bmw",
  WAU: "audi",
  WA1: "audi",
  TRU: "audi",
  WDD: "mercedes-benz",
  W1K: "mercedes-benz",
  WDC: "mercedes-benz",
  WVW: "volkswagen",
  WVG: "volkswagen",
  WV1: "volkswagen",
  TMB: "skoda",
};

function makeFromVin(vin: string, catalogue: Catalogue) {
  const wmi = vin.trim().toUpperCase().slice(0, 3);
  const makeId = WMI[wmi];
  if (!makeId) return undefined;
  return catalogue.makes.find((make) => make.id === makeId);
}

function finish(
  catalogue: Catalogue,
  variantId: string,
  method: VehicleRef["method"],
  confidence: number,
  evidence: string[],
): VehicleRef | null {
  const indexed = catalogue.get(variantId);
  if (!indexed) return null;
  return {
    variantId: indexed.variant.id,
    generationId: indexed.generation.id,
    modelId: indexed.model.id,
    makeId: indexed.make.id,
    method,
    confidence,
    evidence,
  };
}
