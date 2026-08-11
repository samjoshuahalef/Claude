import { chf, type AlertItem, type Segment, type Valuation } from "./types";

/**
 * Placeholder data shaped like the real thing, so the surfaces can be judged
 * before the market feed exists. Every value is static — nothing derived from
 * Date.now() or Math.random(), which would break SSR hydration.
 */

export const SEGMENTS: Segment[] = [
  { id: "bmw-320d-2019", label: "BMW 320d Touring · 2019–2022", country: "CH", medianPrice: chf(34900), trend30d: -0.042, listings: 412, daysToSell: 47 },
  { id: "vw-golf-gti-2020", label: "VW Golf GTI · 2020–2023", country: "CH", medianPrice: chf(38500), trend30d: 0.028, listings: 268, daysToSell: 31 },
  { id: "tesla-m3-lr", label: "Tesla Model 3 Long Range · 2021+", country: "CH", medianPrice: chf(31200), trend30d: -0.091, listings: 534, daysToSell: 62 },
  { id: "audi-q5-tdi", label: "Audi Q5 40 TDI quattro · 2019+", country: "CH", medianPrice: chf(46800), trend30d: 0.015, listings: 197, daysToSell: 38 },
  { id: "skoda-octavia", label: "Škoda Octavia Combi · 2020+", country: "CH", medianPrice: chf(27400), trend30d: 0.006, listings: 341, daysToSell: 29 },
  { id: "porsche-macan", label: "Porsche Macan S · 2019+", country: "CH", medianPrice: chf(62900), trend30d: -0.033, listings: 88, daysToSell: 54 },
];

export const ALERTS: AlertItem[] = [
  { id: "a1", kind: "deal", title: "3 new listings under your buy target", detail: "BMW 320d Touring · CHF 28,400–31,900 · 12% below market", when: "20m ago", href: "/sourcing" },
  { id: "a2", kind: "price-drop", title: "Tesla Model 3 LR dropped 9.1% in 30 days", detail: "Fastest decline in your watchlist — 534 active listings", when: "2h ago", href: "/market" },
  { id: "a3", kind: "stock-aging", title: "2 units passed 60 days on lot", detail: "Golf GTI (72d) and Q5 40 TDI (64d) — both above market", when: "Today", href: "/inventory" },
  { id: "a4", kind: "trend", title: "Macan S supply tightened 18%", detail: "88 listings, down from 107 — median holding firm", when: "Yesterday", href: "/market" },
];

export const SAMPLE_VALUATION: Valuation = {
  vehicle: {
    id: "v1",
    make: "BMW",
    model: "320d",
    variant: "Touring xDrive M Sport",
    year: 2020,
    mileageKm: 78400,
    fuel: "Diesel",
    gearbox: "Automatic",
    country: "CH",
  },
  retail: chf(34900),
  confidence: 0.86,
  sampleSize: 412,
  daysToSell: 47,
  reasons: [
    "412 comparable listings in Switzerland over the last 90 days",
    "Mileage is 6% below the segment average for this model year",
    "xDrive and M Sport both carry a measurable premium in this segment",
    "Segment median has softened 4.2% over 30 days — priced against current, not trailing, comps",
  ],
  breakdown: {
    retail: {
      basis: { label: "Segment median", amount: chf(33200) },
      lines: [
        { label: "Mileage", amount: chf(1400), note: "78,400 km vs 84,100 segment average" },
        { label: "Equipment", amount: chf(1100), note: "xDrive, M Sport package" },
        { label: "Condition", amount: chf(-800), note: "Grade 3 — minor cosmetic" },
      ],
    },
    "trade-in": {
      basis: { label: "Retail value", amount: chf(34900) },
      lines: [
        { label: "Reconditioning", amount: chf(-1800), note: "Tyres, service, cosmetic" },
        { label: "Target margin", amount: chf(-3200), note: "12% on retail" },
        { label: "Days-to-sell risk", amount: chf(-900), note: "47 days vs 35 segment average" },
      ],
    },
    "buy-target": {
      basis: { label: "Retail value", amount: chf(34900) },
      lines: [
        { label: "Reconditioning", amount: chf(-1800) },
        { label: "Target margin", amount: chf(-3200), note: "12% on retail" },
      ],
    },
  },
  comparables: [
    { id: "c1", title: "BMW 320d Touring xDrive M Sport", year: 2020, mileageKm: 71200, price: chf(36900), daysListed: 22, country: "CH", deltaVsMarket: 0.057 },
    { id: "c2", title: "BMW 320d Touring xDrive M Sport", year: 2020, mileageKm: 84500, price: chf(33400), daysListed: 61, country: "CH", deltaVsMarket: -0.043 },
    { id: "c3", title: "BMW 320d Touring xDrive Luxury", year: 2019, mileageKm: 79800, price: chf(31900), daysListed: 48, country: "CH", deltaVsMarket: -0.086 },
    { id: "c4", title: "BMW 320d Touring M Sport", year: 2021, mileageKm: 62100, price: chf(38200), daysListed: 15, country: "CH", deltaVsMarket: 0.095 },
    { id: "c5", title: "BMW 320d Touring xDrive M Sport", year: 2020, mileageKm: 88300, price: chf(32600), daysListed: 73, country: "CH", deltaVsMarket: -0.066 },
  ],
  distribution: [
    { from: 28000, to: 30000, count: 18 },
    { from: 30000, to: 32000, count: 44 },
    { from: 32000, to: 34000, count: 89 },
    { from: 34000, to: 36000, count: 112 },
    { from: 36000, to: 38000, count: 76 },
    { from: 38000, to: 40000, count: 47 },
    { from: 40000, to: 42000, count: 26 },
  ],
};
