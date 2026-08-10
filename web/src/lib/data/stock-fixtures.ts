/**
 * A demonstration inventory.
 *
 * Deliberately mixed: cars performing well, cars quietly bleeding, and one that
 * should never have been bought. A stock screen that only ever shows healthy
 * inventory demonstrates nothing — the product's value is entirely in surfacing
 * the ones a dealer has stopped looking at.
 *
 * Seeded and fixed, like the market fixtures. Replaced by a DMS integration or
 * a stock feed; nothing above this file assumes where inventory came from.
 */

import type { StockVehicle } from "../engine/stock";
import type { Vehicle } from "../engine/types";
import { francs } from "../engine/money";

interface StockSeed {
  id: string;
  make: string;
  model: string;
  derivative: string;
  fuel: Vehicle["fuel"];
  powerKw: number;
  mileageKm: number;
  registration: string;
  acquisitionFrancs: number;
  reconFrancs: number;
  askingFrancs: number;
  /** Days before the valuation date the car was bought / listed. */
  acquiredDaysAgo: number;
  listedDaysAgo: number;
  options: string[];
}

const SEEDS: StockSeed[] = [
  {
    id: "stk-001",
    make: "BMW",
    model: "X3",
    derivative: "M40i xDrive",
    fuel: "petrol",
    powerKw: 265,
    mileageKm: 58_500,
    registration: "2022-06",
    acquisitionFrancs: 44_800,
    reconFrancs: 1_620,
    askingFrancs: 56_900,
    acquiredDaysAgo: 104,
    listedDaysAgo: 96,
    options: ["panoramic_roof", "head_up_display", "leather", "adaptive_cruise"],
  },
  {
    id: "stk-002",
    make: "Audi",
    model: "Q5",
    derivative: "45 TFSI quattro S line",
    fuel: "petrol",
    powerKw: 195,
    mileageKm: 74_000,
    registration: "2021-09",
    acquisitionFrancs: 34_200,
    reconFrancs: 1_180,
    askingFrancs: 44_900,
    acquiredDaysAgo: 71,
    listedDaysAgo: 64,
    options: ["leather", "navigation", "towbar"],
  },
  {
    id: "stk-003",
    make: "Volkswagen",
    model: "Golf",
    derivative: "2.0 TSI GTI",
    fuel: "petrol",
    powerKw: 180,
    mileageKm: 61_000,
    registration: "2022-03",
    acquisitionFrancs: 23_400,
    reconFrancs: 890,
    askingFrancs: 30_900,
    acquiredDaysAgo: 22,
    listedDaysAgo: 16,
    options: ["sport_package", "led_matrix", "navigation"],
  },
  {
    id: "stk-004",
    make: "Mercedes-Benz",
    model: "GLC",
    derivative: "300 de 4MATIC",
    fuel: "plugin_hybrid",
    powerKw: 225,
    mileageKm: 63_500,
    registration: "2022-01",
    acquisitionFrancs: 41_900,
    reconFrancs: 2_340,
    askingFrancs: 53_900,
    acquiredDaysAgo: 138,
    listedDaysAgo: 129,
    options: ["panoramic_roof", "leather", "adaptive_cruise", "heated_seats"],
  },
  {
    id: "stk-005",
    make: "Skoda",
    model: "Octavia",
    derivative: "2.0 TDI RS 4x4",
    fuel: "diesel",
    powerKw: 147,
    mileageKm: 92_000,
    registration: "2021-11",
    acquisitionFrancs: 20_800,
    reconFrancs: 1_450,
    askingFrancs: 27_900,
    acquiredDaysAgo: 47,
    listedDaysAgo: 41,
    options: ["towbar", "navigation", "winter_package"],
  },
  {
    id: "stk-006",
    make: "BMW",
    model: "X3",
    derivative: "M40i xDrive",
    fuel: "petrol",
    powerKw: 265,
    mileageKm: 71_500,
    registration: "2021-08",
    acquisitionFrancs: 39_500,
    reconFrancs: 2_100,
    askingFrancs: 51_400,
    acquiredDaysAgo: 33,
    listedDaysAgo: 27,
    options: ["leather", "navigation", "adaptive_cruise"],
  },
  {
    id: "stk-007",
    make: "Audi",
    model: "Q5",
    derivative: "45 TFSI quattro S line",
    fuel: "petrol",
    powerKw: 195,
    mileageKm: 58_000,
    registration: "2022-05",
    acquisitionFrancs: 38_900,
    reconFrancs: 760,
    askingFrancs: 48_400,
    acquiredDaysAgo: 12,
    listedDaysAgo: 8,
    options: ["panoramic_roof", "leather", "head_up_display"],
  },
  {
    id: "stk-008",
    make: "Volkswagen",
    model: "Golf",
    derivative: "2.0 TSI GTI",
    fuel: "petrol",
    powerKw: 180,
    mileageKm: 79_500,
    registration: "2021-04",
    acquisitionFrancs: 21_900,
    reconFrancs: 1_920,
    askingFrancs: 28_400,
    acquiredDaysAgo: 118,
    listedDaysAgo: 111,
    options: ["navigation", "winter_package"],
  },
  {
    id: "stk-009",
    make: "Mercedes-Benz",
    model: "GLC",
    derivative: "300 de 4MATIC",
    fuel: "plugin_hybrid",
    powerKw: 225,
    mileageKm: 49_000,
    registration: "2023-02",
    acquisitionFrancs: 46_200,
    reconFrancs: 1_040,
    askingFrancs: 57_900,
    acquiredDaysAgo: 29,
    listedDaysAgo: 24,
    options: ["panoramic_roof", "led_matrix", "leather", "adaptive_cruise"],
  },
  {
    id: "stk-010",
    make: "Skoda",
    model: "Octavia",
    derivative: "2.0 TDI RS 4x4",
    fuel: "diesel",
    powerKw: 147,
    mileageKm: 104_000,
    registration: "2020-10",
    acquisitionFrancs: 19_400,
    reconFrancs: 2_680,
    askingFrancs: 26_900,
    acquiredDaysAgo: 156,
    listedDaysAgo: 148,
    options: ["towbar", "heated_seats"],
  },
  {
    id: "stk-011",
    make: "BMW",
    model: "X3",
    derivative: "M40i xDrive",
    fuel: "petrol",
    powerKw: 265,
    mileageKm: 44_000,
    registration: "2023-04",
    acquisitionFrancs: 51_200,
    reconFrancs: 980,
    askingFrancs: 63_900,
    acquiredDaysAgo: 18,
    listedDaysAgo: 14,
    options: ["panoramic_roof", "head_up_display", "leather", "sport_package"],
  },
  {
    id: "stk-012",
    make: "Audi",
    model: "Q5",
    derivative: "45 TFSI quattro S line",
    fuel: "petrol",
    powerKw: 195,
    mileageKm: 88_000,
    registration: "2020-07",
    acquisitionFrancs: 27_600,
    reconFrancs: 3_140,
    askingFrancs: 37_900,
    acquiredDaysAgo: 187,
    listedDaysAgo: 179,
    options: ["navigation", "towbar"],
  },
];

function shiftDate(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** Build the demonstration inventory relative to a valuation date. */
export function buildStock(asOf: string): StockVehicle[] {
  return SEEDS.map((seed) => ({
    id: seed.id,
    vehicle: {
      make: seed.make,
      model: seed.model,
      derivative: seed.derivative,
      firstRegistration: seed.registration,
      mileageKm: seed.mileageKm,
      fuel: seed.fuel,
      transmission: "automatic",
      drivetrain: "awd",
      powerKw: seed.powerKw,
      options: seed.options,
    },
    acquisitionPrice: francs(seed.acquisitionFrancs),
    acquiredAt: shiftDate(asOf, -seed.acquiredDaysAgo),
    reconSpent: francs(seed.reconFrancs),
    currentAskingPrice: francs(seed.askingFrancs),
    listedAt: shiftDate(asOf, -seed.listedDaysAgo),
  }));
}
