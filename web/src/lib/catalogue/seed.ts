/**
 * A seed catalogue.
 *
 * Hand-built and small — five models, their current generations, and the
 * variants a Swiss dealer actually stocks. It exists so the identity layer can
 * be built and tested now, and so the demonstration has real structure behind
 * its dropdowns rather than five hardcoded strings.
 *
 * It is not the catalogue. A production build needs full European coverage with
 * stable supplier IDs, and that is a licensing decision, not a data-entry one.
 * Everything above `Catalogue` is written so that swap costs nothing.
 *
 * Deliberately included: variants that are easy to confuse. The X3 xDrive30e
 * and M40i share a generation and most of their words; the Octavia RS exists as
 * both petrol and diesel with different power. If the resolver cannot keep those
 * apart it will quietly contaminate comparable sets, so they are in the seed to
 * make sure it can.
 */

import type { CatalogueData } from "./catalogue";

export const SEED_CATALOGUE: CatalogueData = {
  revision: "seed-2026-08",

  makes: [
    { id: "bmw", name: "BMW", aliases: ["bayerische motoren werke"], country: "DE" },
    { id: "audi", name: "Audi", aliases: ["audi ag"], country: "DE" },
    {
      id: "mercedes-benz",
      name: "Mercedes-Benz",
      aliases: ["mercedes", "mb", "mercedes benz"],
      country: "DE",
    },
    { id: "volkswagen", name: "Volkswagen", aliases: ["vw"], country: "DE" },
    { id: "skoda", name: "Skoda", aliases: ["škoda"], country: "CZ" },
  ],

  models: [
    { id: "bmw-x3", makeId: "bmw", name: "X3", aliases: [], bodyStyle: "suv" },
    { id: "audi-q5", makeId: "audi", name: "Q5", aliases: [], bodyStyle: "suv" },
    { id: "mb-glc", makeId: "mercedes-benz", name: "GLC", aliases: [], bodyStyle: "suv" },
    { id: "vw-golf", makeId: "volkswagen", name: "Golf", aliases: [], bodyStyle: "hatchback" },
    { id: "skoda-octavia", makeId: "skoda", name: "Octavia", aliases: [], bodyStyle: "estate" },
  ],

  generations: [
    { id: "bmw-x3-g01", modelId: "bmw-x3", code: "G01", name: "G01", from: "2017-11", to: "2024-06", facelift: false },
    { id: "audi-q5-fy", modelId: "audi-q5", code: "FY", name: "FY", from: "2017-01", to: null, facelift: false },
    { id: "mb-glc-x253", modelId: "mb-glc", code: "X253", name: "X253", from: "2015-09", to: "2022-06", facelift: false },
    { id: "vw-golf-mk8", modelId: "vw-golf", code: "MK8", name: "Mk8", from: "2019-12", to: null, facelift: false },
    { id: "skoda-octavia-mk4", modelId: "skoda-octavia", code: "NX", name: "Mk4", from: "2020-01", to: null, facelift: false },
  ],

  variants: [
    // BMW X3 G01 — the M40i and the 30e are the confusable pair.
    v("bmw-x3-g01-20i", "bmw-x3-g01", "xDrive20i", ["20i"], 135, "petrol", "automatic", "awd", 1998, 62_900),
    v("bmw-x3-g01-20d", "bmw-x3-g01", "xDrive20d", ["20d"], 140, "diesel", "automatic", "awd", 1995, 64_500),
    v("bmw-x3-g01-30d", "bmw-x3-g01", "xDrive30d", ["30d"], 195, "diesel", "automatic", "awd", 2993, 76_200),
    v("bmw-x3-g01-30e", "bmw-x3-g01", "xDrive30e", ["30e"], 215, "plugin_hybrid", "automatic", "awd", 1998, 74_800),
    v("bmw-x3-g01-m40i", "bmw-x3-g01", "M40i xDrive", ["m40i"], 265, "petrol", "automatic", "awd", 2998, 89_900),
    v("bmw-x3-g01-m40d", "bmw-x3-g01", "M40d xDrive", ["m40d"], 240, "diesel", "automatic", "awd", 2993, 91_400),

    // Audi Q5 FY
    v("audi-q5-fy-40tdi", "audi-q5-fy", "40 TDI quattro", ["40tdi"], 150, "diesel", "automatic", "awd", 1968, 66_700),
    v("audi-q5-fy-45tfsi", "audi-q5-fy", "45 TFSI quattro", ["45tfsi"], 195, "petrol", "automatic", "awd", 1984, 69_900),
    v("audi-q5-fy-50tdi", "audi-q5-fy", "50 TDI quattro", ["50tdi"], 210, "diesel", "automatic", "awd", 2967, 82_500),
    v("audi-q5-fy-55tfsie", "audi-q5-fy", "55 TFSI e quattro", ["55tfsie"], 270, "plugin_hybrid", "automatic", "awd", 1984, 84_300),

    // Mercedes-Benz GLC X253 — 300 de and 300 e differ only by fuel.
    v("mb-glc-x253-200d", "mb-glc-x253", "200 d 4MATIC", ["200d"], 120, "diesel", "automatic", "awd", 1950, 61_400),
    v("mb-glc-x253-220d", "mb-glc-x253", "220 d 4MATIC", ["220d"], 143, "diesel", "automatic", "awd", 1950, 65_800),
    v("mb-glc-x253-300de", "mb-glc-x253", "300 de 4MATIC", ["300de"], 225, "plugin_hybrid", "automatic", "awd", 1950, 76_900),
    v("mb-glc-x253-300e", "mb-glc-x253", "300 e 4MATIC", ["300e"], 235, "plugin_hybrid", "automatic", "awd", 1991, 75_200),
    v("mb-glc-x253-amg43", "mb-glc-x253", "AMG 43 4MATIC", ["amg43", "43 amg"], 287, "petrol", "automatic", "awd", 2996, 96_500),

    // Volkswagen Golf Mk8
    v("vw-golf-mk8-15tsi", "vw-golf-mk8", "1.5 TSI", ["15tsi"], 110, "petrol", "manual", "fwd", 1498, 34_900),
    v("vw-golf-mk8-20tdi", "vw-golf-mk8", "2.0 TDI", ["20tdi"], 110, "diesel", "automatic", "fwd", 1968, 38_600),
    v("vw-golf-mk8-gti", "vw-golf-mk8", "2.0 TSI GTI", ["gti"], 180, "petrol", "automatic", "fwd", 1984, 49_800),
    v("vw-golf-mk8-gte", "vw-golf-mk8", "1.4 eHybrid GTE", ["gte"], 180, "plugin_hybrid", "automatic", "fwd", 1395, 51_200),
    v("vw-golf-mk8-r", "vw-golf-mk8", "2.0 TSI R 4MOTION", ["golf r"], 235, "petrol", "automatic", "awd", 1984, 63_400),

    // Skoda Octavia Mk4 — RS exists as both petrol and diesel.
    v("skoda-octavia-mk4-15tsi", "skoda-octavia-mk4", "1.5 TSI", ["15tsi"], 110, "petrol", "manual", "fwd", 1498, 31_200),
    v("skoda-octavia-mk4-20tdi", "skoda-octavia-mk4", "2.0 TDI", ["20tdi"], 110, "diesel", "automatic", "fwd", 1968, 35_400),
    v("skoda-octavia-mk4-rs-tsi", "skoda-octavia-mk4", "2.0 TSI RS", ["rs tsi"], 180, "petrol", "automatic", "fwd", 1984, 44_900),
    v("skoda-octavia-mk4-rs-tdi", "skoda-octavia-mk4", "2.0 TDI RS 4x4", ["rs tdi", "rs 4x4"], 147, "diesel", "automatic", "awd", 1968, 46_700),
  ],
};

function v(
  id: string,
  generationId: string,
  name: string,
  aliases: string[],
  powerKw: number,
  fuel: "petrol" | "diesel" | "plugin_hybrid" | "hybrid" | "electric",
  transmission: "manual" | "automatic",
  drivetrain: "fwd" | "rwd" | "awd",
  displacementCcm: number,
  listPriceNewFrancs: number,
) {
  return {
    id,
    generationId,
    name,
    aliases,
    powerKw,
    fuel,
    transmission,
    drivetrain,
    displacementCcm,
    doors: 5,
    listPriceNew: listPriceNewFrancs * 100,
    from: "2019-01",
    to: null,
  };
}
