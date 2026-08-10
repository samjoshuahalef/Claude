/**
 * String normalisation for vehicle matching.
 *
 * Listing text is written by hand by thousands of people. The same car appears
 * as "M40i xDrive", "M 40 i xDrive", "M40I X-DRIVE", "M40i 4x4" and
 * "M40i (Steptronic)". Normalisation collapses that noise before any comparison
 * happens, so the matcher compares meaning rather than typing.
 *
 * Deliberately conservative: it removes noise, it never guesses. Anything that
 * would require interpretation is left for the constrained matcher, which has
 * power, fuel and registration date to check itself against.
 */

/** Marketing and drivetrain noise that carries no identity on its own. */
const NOISE = new Set([
  "ab",
  "mfk",
  "neu",
  "occasion",
  "jahreswagen",
  "vorfuhrwagen",
  "garantie",
  "voll",
  "vollausstattung",
  "top",
  "gepflegt",
  "unfallfrei",
  "steptronic",
  "tiptronic",
  "dsg",
  "s-tronic",
  "stronic",
  "g-tronic",
  "edition",
  "swiss",
  "ch",
  "fahrzeug",
  "auto",
]);

/**
 * Umlaut and accent folding.
 *
 * German transliteration rules, not accent-stripping: "ö" becomes "oe", not "o",
 * because Swiss and German listings mix both spellings of the same word and
 * only the transliteration makes them equal.
 */
const FOLD: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
  à: "a",
  á: "a",
  â: "a",
  è: "e",
  é: "e",
  ê: "e",
  ì: "i",
  í: "i",
  î: "i",
  ò: "o",
  ó: "o",
  ô: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ç: "c",
};

export function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüßàáâèéêìíîòóôùúûç]/g, (character) => FOLD[character] ?? character);
}

/**
 * Canonical form of a free-text vehicle string.
 *
 * "BMW X3 M 40 i xDrive (G01) Steptronic" → "bmw x3 m40i xdrive g01"
 */
export function normalise(text: string): string {
  let value = fold(text);

  // Join split engine designations: "M 40 i" → "m40i", "320 d" → "320d".
  value = value.replace(/\b([a-z])\s+(\d{2,3})\s*([a-z])?\b/g, (_, a, n, b) => `${a}${n}${b ?? ""}`);
  value = value.replace(/\b(\d{2,3})\s+([a-z])\b/g, "$1$2");

  // Drivetrain spellings are one thing.
  value = value
    .replace(/x[-\s]?drive/g, "xdrive")
    .replace(/4[-\s]?matic/g, "4matic")
    .replace(/\b4x4\b/g, "awd")
    .replace(/\bquattro\b/g, "quattro");

  value = value
    .replace(/[^\da-z\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return value;
}

export function tokens(text: string): string[] {
  return normalise(text)
    .split(" ")
    .filter((token) => token.length > 0 && !NOISE.has(token));
}

/**
 * Jaccard similarity over token sets, with rarer tokens weighted higher.
 *
 * "xdrive" appears on half the BMWs in the market and carries little identity;
 * "m40i" appears on very few and carries almost all of it. Weighting by inverse
 * document frequency stops a pile of common words outvoting the one token that
 * actually names the car.
 */
export function weightedSimilarity(
  candidate: string[],
  query: string[],
  documentFrequency: Map<string, number>,
  corpusSize: number,
): number {
  if (candidate.length === 0 || query.length === 0) return 0;

  const weight = (token: string) => {
    const df = documentFrequency.get(token) ?? 1;
    return Math.log(1 + corpusSize / df);
  };

  const candidateSet = new Set(candidate);
  const querySet = new Set(query);

  let intersection = 0;
  let union = 0;

  for (const token of new Set([...candidateSet, ...querySet])) {
    const w = weight(token);
    union += w;
    if (candidateSet.has(token) && querySet.has(token)) intersection += w;
  }

  return union === 0 ? 0 : intersection / union;
}

/** Power is quoted as kW in registration papers and PS in listings. */
export function psToKw(ps: number): number {
  return Math.round(ps * 0.7355);
}

export function kwToPs(kw: number): number {
  return Math.round(kw / 0.7355);
}

const FUEL_ALIASES: Record<string, string> = {
  benzin: "petrol",
  benzina: "petrol",
  essence: "petrol",
  petrol: "petrol",
  gasoline: "petrol",
  diesel: "diesel",
  dieselmotor: "diesel",
  dyzelinas: "diesel",
  hybrid: "hybrid",
  vollhybrid: "hybrid",
  "mild-hybrid": "hybrid",
  mildhybrid: "hybrid",
  plugin: "plugin_hybrid",
  "plug-in": "plugin_hybrid",
  pluginhybrid: "plugin_hybrid",
  phev: "plugin_hybrid",
  elektro: "electric",
  electric: "electric",
  elektrisch: "electric",
  bev: "electric",
  erdgas: "cng",
  cng: "cng",
  lpg: "lpg",
  gas: "lpg",
};

export function normaliseFuel(text: string | undefined): string | null {
  if (!text) return null;
  const key = fold(text).replace(/[^a-z-]/g, "");
  return FUEL_ALIASES[key] ?? null;
}

export function normaliseTransmission(text: string | undefined): "manual" | "automatic" | null {
  if (!text) return null;
  const value = fold(text);
  if (/(automat|dsg|s-?tronic|steptronic|tiptronic|pdk|edc|cvt|dct)/.test(value)) return "automatic";
  if (/(manuell|manual|schalt|handschalt|boite manuelle)/.test(value)) return "manual";
  return null;
}
