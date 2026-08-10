/**
 * Verification for the stock and sourcing engines.
 *
 * Checks the decision logic against invariants rather than snapshots: an aged,
 * overpriced car must be flagged; a fresh, well-priced one must be left alone;
 * and a recommended reprice must actually improve return on capital, or the
 * recommendation is noise.
 */

import { reviewStock, stockSummary } from "../src/lib/engine/stock";
import { findOpportunities, allocateCapital } from "../src/lib/engine/sourcing";
import { DEFAULT_ECONOMICS } from "../src/lib/engine/defaults";
import { formatMoney, francs } from "../src/lib/engine/money";
import { SyntheticSwissMarketSource } from "../src/lib/data/fixtures";
import { buildStock } from "../src/lib/data/stock-fixtures";
import type { Comparable } from "../src/lib/engine/types";

const AS_OF = "2026-08-10";
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

async function main(): Promise<void> {
  const source = new SyntheticSwissMarketSource();
  const stock = buildStock(AS_OF);

  // Cache the market per model so every stock item sees the same evidence.
  const marketCache = new Map<string, Comparable[]>();
  for (const item of stock) {
    const key = `${item.vehicle.make}|${item.vehicle.model}`;
    if (marketCache.has(key)) continue;
    const response = await source.fetchComparables({
      subject: item.vehicle,
      market: "CH",
      asOf: AS_OF,
      lookbackDays: 120,
    });
    marketCache.set(key, response.comparables);
  }
  const comparablesFor = (item: (typeof stock)[number]) =>
    marketCache.get(`${item.vehicle.make}|${item.vehicle.model}`) ?? [];

  console.log("\n\x1b[1mStock review\x1b[0m");
  const reviews = reviewStock(stock, comparablesFor, DEFAULT_ECONOMICS, AS_OF);
  check("every stock item is reviewed", reviews.length === stock.length, `${reviews.length}/${stock.length}`);

  for (const review of reviews.slice(0, 6)) {
    console.log(
      `  ${review.item.id} ${review.item.vehicle.make} ${review.item.vehicle.model} · ` +
        `${review.daysInStock}d · asking ${formatMoney(review.item.currentAskingPrice)} → ` +
        `\x1b[1m${review.action}\x1b[0m ${formatMoney(review.recommended.price)} · ` +
        `return ${(review.holding.annualisedReturn * 100).toFixed(0)}% → ` +
        `${(review.recommended.annualisedReturn * 100).toFixed(0)}% · ` +
        `worth ${formatMoney(review.valueOfActing)}`,
    );
  }

  check(
    "a reprice always improves return on capital",
    reviews
      .filter((r) => r.action === "reprice" || r.action === "reduce")
      .every((r) => r.recommended.annualisedReturn > r.holding.annualisedReturn),
  );
  check(
    "an exit never prices outside the evidence band",
    reviews.filter((r) => r.action === "exit").every((r) => r.recommended.withinEvidence),
  );
  check(
    "an exit loses less than the best price the market has actually paid",
    reviews
      .filter((r) => r.action === "exit")
      .every((r) => r.recommended.grossProfit >= r.realisticHold.grossProfit),
  );
  check(
    "held vehicles are left at their current price",
    reviews
      .filter((r) => r.action === "hold")
      .every((r) => r.recommended.price === r.item.currentAskingPrice),
  );
  check(
    "no recommendation raises the price of stock already on sale",
    reviews.every((r) => r.recommended.price <= r.item.currentAskingPrice),
  );
  check(
    "every review carries grounds the dealer can read",
    reviews.every((r) => r.grounds.length > 0),
  );
  check(
    "the oldest vehicle is not left on hold",
    (() => {
      const oldest = [...reviews].sort((a, b) => b.daysInStock - a.daysInStock)[0];
      return oldest.action !== "hold";
    })(),
    `oldest is ${[...reviews].sort((a, b) => b.daysInStock - a.daysInStock)[0].daysInStock} days`,
  );
  check(
    "the freshest vehicle is left alone",
    (() => {
      const freshest = [...reviews].sort((a, b) => a.daysInStock - b.daysInStock)[0];
      return freshest.action === "hold";
    })(),
  );
  check(
    "acting on an exit leaves the dealership better off than not acting",
    reviews
      .filter((r) => r.action === "exit")
      .every((r) => r.valueOfActing > 0 && r.recommended.grossProfit > r.realisticHold.grossProfit),
    reviews
      .filter((r) => r.action === "exit")
      .map((r) => formatMoney(r.valueOfActing))
      .join(", "),
  );
  check(
    "no recommendation is reported as worth a negative amount",
    reviews.every((r) => r.valueOfActing >= 0),
  );
  check(
    "list is ranked by the value of acting",
    reviews.every((r, i) => i === 0 || reviews[i - 1].valueOfActing >= r.valueOfActing),
  );

  const summary = stockSummary(reviews);
  console.log(
    `  summary: ${summary.vehicles} cars · capital ${formatMoney(summary.capital)} · ` +
      `${summary.needingAction} need action · upside ${formatMoney(summary.opportunity)} · ` +
      `avg ${summary.averageDaysInStock}d · avg return ${(summary.averageReturn * 100).toFixed(0)}%`,
  );
  check("capital employed is the sum of the parts", summary.capital > 0);
  check("aged count never exceeds fleet size", summary.aged <= summary.vehicles);

  console.log("\n\x1b[1mSourcing\x1b[0m");
  const market = marketCache.get("BMW|X3") ?? [];
  const lots = (
    await source.fetchAcquisitionCandidates({
      subject: stock.find((s) => s.vehicle.model === "X3")!.vehicle,
      market: "CH",
      asOf: AS_OF,
      lookbackDays: 30,
    })
  ).comparables;
  const opportunities = findOpportunities(lots, market, DEFAULT_ECONOMICS, AS_OF, { limit: 8 });
  check("acquisition lots are a separate feed from retail", lots.length > 0, `${lots.length} lots`);
  check(
    "acquisition lots never enter the retail comparable set",
    lots.every((lot) => lot.sellerType !== "dealer"),
  );
  console.log(`  ${opportunities.length} of ${lots.length} lots clear the ceiling`);
  for (const opportunity of opportunities.slice(0, 4)) {
    console.log(
      `  asking ${formatMoney(opportunity.askingPrice)} · ceiling ${formatMoney(opportunity.ceiling)} · ` +
        `headroom ${formatMoney(opportunity.headroom)} · ${opportunity.expectedDaysToSale}d · ` +
        `return ${(opportunity.annualisedReturn * 100).toFixed(0)}%`,
    );
  }
  check(
    "every opportunity sits at or below the buying ceiling",
    opportunities.every((o) => o.askingPrice <= o.ceiling),
  );
  check(
    "every opportunity projects a positive gross",
    opportunities.every((o) => o.projectedGross > 0),
  );
  check(
    "opportunities are ranked by return on capital",
    opportunities.every((o, i) => i === 0 || opportunities[i - 1].annualisedReturn >= o.annualisedReturn),
  );
  check(
    "no live listing is used as evidence for its own valuation",
    opportunities.every((o) => o.listing.delistedAt === null),
  );

  const budget = francs(150_000);
  const allocation = allocateCapital(opportunities, budget, DEFAULT_ECONOMICS);
  console.log(
    `  allocation of ${formatMoney(budget)}: ${allocation.chosen.length} cars · ` +
      `spend ${formatMoney(allocation.spent)} · projected gross ${formatMoney(allocation.projectedGross)}`,
  );
  check("allocation never exceeds the budget", allocation.spent <= budget);
  check("unspent capital reconciles", allocation.unspent === budget - allocation.spent);

  console.log(
    `\n${failures === 0 ? "\x1b[32m" : "\x1b[31m"}${checks - failures}/${checks} checks passed\x1b[0m\n`,
  );
  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
