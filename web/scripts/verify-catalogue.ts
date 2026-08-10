/**
 * Verification for the vehicle identity layer.
 *
 * Matching is the join every other number depends on, and its failures are
 * silent: a wrong variant does not throw, it just quietly moves a ceiling. So
 * the tests are mostly about what the resolver must REFUSE to do.
 */

import { Catalogue } from "../src/lib/catalogue/catalogue";
import { SEED_CATALOGUE } from "../src/lib/catalogue/seed";
import { resolveVehicle } from "../src/lib/catalogue/match";
import { isEvidenceGrade } from "../src/lib/catalogue/types";
import type { RawVehicleDescription } from "../src/lib/catalogue/types";

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail = ""): void {
  checks++;
  if (condition) console.log(`  \x1b[32m✓\x1b[0m ${label}${detail ? `  ${detail}` : ""}`);
  else {
    failures++;
    console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? `  ${detail}` : ""}`);
  }
}

const catalogue = new Catalogue(SEED_CATALOGUE);

function resolve(raw: RawVehicleDescription) {
  return resolveVehicle(raw, catalogue, {
    typeApproval: {
      swiss: new Map([["1AB234", "bmw-x3-g01-m40i"]]),
      german: new Map([["0005/BGX", "bmw-x3-g01-30d"]]),
    },
  });
}

console.log(`\n\x1b[1mCatalogue\x1b[0m  ${catalogue.size} variants, revision ${catalogue.revision}`);

console.log("\n\x1b[1mResolution\x1b[0m");

// Messy real-world spellings of one car.
for (const text of [
  "M40i xDrive",
  "M 40 i xDrive",
  "M40I X-DRIVE Steptronic",
  "m40i xdrive (G01) ab MFK, unfallfrei",
]) {
  const ref = resolve({ make: "BMW", model: "X3", variant: text, powerKw: 265, fuel: "Benzin" });
  check(
    `"${text}" resolves to the M40i`,
    ref?.variantId === "bmw-x3-g01-m40i",
    ref ? `${ref.method} ${ref.confidence.toFixed(2)}` : "null",
  );
}

const ps = resolve({ make: "BMW", model: "X3", variant: "M40i", powerPs: 360, fuel: "Benzin" });
check("power quoted in PS is converted and matched", ps?.variantId === "bmw-x3-g01-m40i");

const tg = resolve({ typeApproval: "1AB234" });
check(
  "a Swiss type approval number resolves exactly",
  tg?.variantId === "bmw-x3-g01-m40i" && tg.method === "type_approval",
);

const kba = resolve({ hsn: "0005", tsn: "BGX" });
check("German HSN/TSN resolves exactly", kba?.variantId === "bmw-x3-g01-30d");

const vin = resolve({ vin: "WBAXXXXXXXXXXXXXX", model: "X3", variant: "xDrive30d", fuel: "Diesel", powerKw: 195 });
check("a VIN narrows the make and the rest is constrained", vin?.variantId === "bmw-x3-g01-30d");

console.log("\n\x1b[1mRefusal\x1b[0m");

// Fuel alone separates two otherwise identical Mercedes variants.
const de = resolve({ make: "Mercedes-Benz", model: "GLC", variant: "300 de 4MATIC", fuel: "Diesel Plug-in" });
const e = resolve({ make: "Mercedes-Benz", model: "GLC", variant: "300 e 4MATIC", powerKw: 235 });
check("GLC 300 de and 300 e are kept apart", de?.variantId !== e?.variantId, `${de?.variantId} vs ${e?.variantId}`);

const rs = resolve({ make: "Skoda", model: "Octavia", variant: "RS", powerKw: 147, fuel: "Diesel" });
check(
  "an Octavia RS is disambiguated by fuel and power",
  rs?.variantId === "skoda-octavia-mk4-rs-tdi",
  rs ? rs.method : "null",
);

const bare = resolve({ make: "Skoda", model: "Octavia", variant: "RS" });
check(
  "an Octavia RS with no specification is refused, not guessed",
  bare !== null && !isEvidenceGrade(bare),
  bare ? `${bare.method}` : "null",
);

const contradicted = resolve({
  make: "BMW",
  model: "X3",
  variant: "M40i",
  powerKw: 110,
  fuel: "Diesel",
});
check(
  "a listing contradicted by its own specification is unresolved",
  contradicted?.method === "unresolved",
  contradicted?.evidence[0],
);

const wrongYear = resolve({
  make: "BMW",
  model: "X3",
  variant: "M40i xDrive",
  powerKw: 265,
  firstRegistration: "2012-05",
});
check(
  "a registration before the generation existed is rejected",
  wrongYear?.method === "unresolved",
  wrongYear?.evidence[0],
);

const nonsense = resolve({ make: "BMW", model: "X3", variant: "Zzzz Qqqq" });
check("unrecognisable text is refused", nonsense !== null && !isEvidenceGrade(nonsense));

const unknownMake = resolve({ make: "Lancia", model: "Delta", variant: "HF Integrale" });
check("a make outside the catalogue does not resolve", unknownMake === null || !isEvidenceGrade(unknownMake));

console.log("\n\x1b[1mEvidence grading\x1b[0m");
check("type approval is evidence grade", isEvidenceGrade(tg));
check("a confident constrained match is evidence grade", isEvidenceGrade(rs));
check("an ambiguous match is never evidence grade", !isEvidenceGrade(bare));

console.log("\n\x1b[1mNavigation\x1b[0m");
check("every make has models", catalogue.makes.every((m) => catalogue.modelsFor(m.id).length > 0));
check(
  "every model has a generation with variants",
  catalogue.models.every((m) =>
    catalogue.generationsFor(m.id).some((g) => catalogue.variantsFor(g.id).length > 0),
  ),
);
check(
  "variants are listed most powerful first",
  catalogue.generationsFor("bmw-x3").every((g) => {
    const list = catalogue.variantsFor(g.id);
    return list.every((v, i) => i === 0 || list[i - 1].powerKw >= v.powerKw);
  }),
);

console.log(
  `\n${failures === 0 ? "\x1b[32m" : "\x1b[31m"}${checks - failures}/${checks} checks passed\x1b[0m\n`,
);
if (failures > 0) process.exit(1);
