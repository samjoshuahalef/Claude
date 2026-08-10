/**
 * The vehicle catalogue: canonical identity for a car.
 *
 * Everything in Autoflair joins on this. A scraped listing, a car in the
 * dealer's stock, an auction lot and a customer's trade-in are the same vehicle
 * only if they resolve to the same `variantId` — never because two strings look
 * alike. "BMW X3 M40i", "BMW X3 xDrive M40i", "BMW X3 M 40 i (G01)" and
 * "BMW X3M 40i" are one car; "BMW X3 30e" is not, and no amount of string
 * similarity reliably tells you which is which.
 *
 * Four levels, because pricing needs all four:
 *   Make        BMW
 *   Model       X3
 *   Generation  G01 (2017–2024) — a facelift is a different market
 *   Variant     M40i xDrive, 265 kW petrol automatic — the priceable unit
 *
 * The variant is where value actually lives. Two X3s of the same generation and
 * year can differ by CHF 30'000 on engine alone, so a comparable set built at
 * model level is not a comparable set.
 */

export type MakeId = string;
export type ModelId = string;
export type GenerationId = string;
export type VariantId = string;

export interface Make {
  id: MakeId;
  name: string;
  /** Alternative spellings seen in listings: "VW", "Volkswagen", "MB". */
  aliases: string[];
  country: string;
}

export interface Model {
  id: ModelId;
  makeId: MakeId;
  name: string;
  aliases: string[];
  /** Estate, SUV, saloon — affects which cars a buyer cross-shops. */
  bodyStyle: BodyStyle;
}

export type BodyStyle =
  | "hatchback"
  | "saloon"
  | "estate"
  | "suv"
  | "coupe"
  | "convertible"
  | "mpv"
  | "pickup"
  | "van";

export interface Generation {
  id: GenerationId;
  modelId: ModelId;
  /** Manufacturer code where one exists — G01, B8, W205. The best join key. */
  code: string;
  name: string;
  /** Production window. A car registered outside it is a resolution error. */
  from: string;
  to: string | null;
  /** Facelifts price differently and must not be pooled. */
  facelift: boolean;
}

export interface Variant {
  id: VariantId;
  generationId: GenerationId;
  /** As the manufacturer writes it: "M40i xDrive". */
  name: string;
  aliases: string[];
  powerKw: number;
  fuel: FuelCode;
  transmission: "manual" | "automatic";
  drivetrain: "fwd" | "rwd" | "awd";
  displacementCcm: number | null;
  doors: number;
  /** List price when new, for the market it was sold in. Anchors depreciation. */
  listPriceNew: number | null;
  from: string;
  to: string | null;
}

export type FuelCode =
  | "petrol"
  | "diesel"
  | "hybrid"
  | "plugin_hybrid"
  | "electric"
  | "cng"
  | "lpg";

/**
 * A resolved reference to a catalogue vehicle, plus how we got there.
 *
 * `method` and `confidence` travel with every resolution because they decide
 * whether a listing may be used as valuation evidence. A fuzzy string match is
 * good enough to show a dealer a suggestion; it is not good enough to move a
 * buying ceiling by CHF 2'000.
 */
export interface VehicleRef {
  variantId: VariantId;
  generationId: GenerationId;
  modelId: ModelId;
  makeId: MakeId;
  method: MatchMethod;
  /** 0..1. */
  confidence: number;
  /** What the resolver keyed on, for audit. */
  evidence: string[];
}

export type MatchMethod =
  | "type_approval" // Swiss TG or German HSN/TSN — exact, unambiguous
  | "vin" // decoded WMI + VDS
  | "exact" // normalised catalogue string matched outright
  | "constrained" // string plus power/fuel/transmission/year narrowed to one
  | "fuzzy" // best token match, several candidates were plausible
  | "ambiguous" // more than one candidate survived; not usable as evidence
  | "unresolved"; // nothing matched

/** Methods trustworthy enough to price from. */
export const EVIDENCE_GRADE_METHODS: readonly MatchMethod[] = [
  "type_approval",
  "vin",
  "exact",
  "constrained",
];

export function isEvidenceGrade(ref: VehicleRef | null): boolean {
  return ref !== null && EVIDENCE_GRADE_METHODS.includes(ref.method) && ref.confidence >= 0.8;
}

/** What a listing gives us to resolve from. All of it optional but the text. */
export interface RawVehicleDescription {
  make?: string;
  model?: string;
  /** The free-text trim/version line, which is where most of the signal is. */
  variant?: string;
  title?: string;
  powerKw?: number;
  powerPs?: number;
  fuel?: string;
  transmission?: string;
  firstRegistration?: string;
  displacementCcm?: number;
  doors?: number;
  vin?: string;
  /** Swiss type approval number from the Fahrzeugausweis, e.g. "1AB234". */
  typeApproval?: string;
  /** German KBA codes, when the car was imported from Germany. */
  hsn?: string;
  tsn?: string;
}
