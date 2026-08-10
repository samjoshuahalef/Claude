"use client";

import { useState } from "react";
import type { Currency, Evidence } from "@/lib/engine/types";
import {
  formatKm,
  formatMoney,
  formatRegistration,
  formatShortDate,
  formatSignedMoney,
} from "@/lib/format";

/**
 * The comparables behind the number.
 *
 * Non-negotiable for this audience: a dealer will argue with a valuation, and
 * the only useful response is the list of cars it came from with the adjustment
 * arithmetic attached. Hiding this makes the product a black box, and dealers
 * do not buy black boxes that spend their money.
 */

interface Props {
  evidence: Evidence;
  currency: Currency;
}

export function EvidenceTable({ evidence, currency }: Props) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...evidence.comparables].sort((a, b) => b.weight - a.weight);
  const visible = expanded ? sorted : sorted.slice(0, 8);

  /**
   * Weights are shown relative to the strongest comparable rather than on an
   * absolute 0–1 scale. Absolute weights are the product of five factors and so
   * are almost always small, which rendered every bar as a stub and destroyed
   * the one thing this column is for: ranking the evidence at a glance.
   */
  const maxWeight = Math.max(...sorted.map((item) => item.weight), 0.0001);

  return (
    <div className="stack-4">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Registered</th>
              <th scope="col">Mileage</th>
              <th scope="col">Seller</th>
              <th scope="col">Listed</th>
              <th scope="col" style={{ textAlign: "right" }}>
                Asking
              </th>
              <th scope="col" style={{ textAlign: "right" }}>
                Adjustment
              </th>
              <th scope="col" style={{ textAlign: "right" }}>
                Adjusted
              </th>
              <th scope="col" style={{ textAlign: "right" }}>
                Days
              </th>
              <th scope="col" style={{ textAlign: "right" }}>
                Weight
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => {
              const adjustment = item.adjustmentBreakdown.reduce(
                (sum, line) => sum + line.amount,
                0,
              );
              return (
                <tr key={item.comparable.id}>
                  <td data-label="Registered">{formatRegistration(item.comparable.vehicle.firstRegistration)}</td>
                  <td data-label="Mileage" className="td-num">{formatKm(item.comparable.vehicle.mileageKm)}</td>
                  <td data-label="Seller" className="td-muted">
                    {item.comparable.sellerType === "private" ? "Private" : "Dealer"} ·{" "}
                    {item.comparable.region}
                  </td>
                  <td data-label="Listed" className="td-muted">{formatShortDate(item.comparable.listedAt)}</td>
                  <td className="td-num" data-label="Asking">
                    {formatMoney(item.comparable.askingPrice, currency)}
                  </td>
                  <td
                    className="td-num"
                    data-label="Adjustment"
                    style={{
                      color: adjustment === 0 ? "var(--text-3)" : undefined,
                    }}
                    title={item.adjustmentBreakdown
                      .map((line) => `${line.label}: ${formatSignedMoney(line.amount, currency)}`)
                      .join("\n")}
                  >
                    {adjustment === 0 ? "—" : formatSignedMoney(adjustment, currency)}
                  </td>
                  <td className="td-num" data-label="Adjusted">
                    {formatMoney(item.adjustedPrice, currency)}
                  </td>
                  <td className="td-num" data-label="Days">
                    {item.daysOnMarket === null ? (
                      <span className="td-muted">live</span>
                    ) : (
                      item.daysOnMarket
                    )}
                  </td>
                  <td className="td-num" data-label="Weight">
                    <span className="row" style={{ justifyContent: "flex-end" }}>
                      <span className="meter">
                        <span
                          className="meter__fill"
                          style={{ width: `${Math.round((item.weight / maxWeight) * 100)}%` }}
                        />
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="row row--between" style={{ padding: "0 var(--s4) var(--s4)" }}>
        <span className="t-xs">
          {evidence.comparables.length} used · {evidence.excluded.length} excluded ·{" "}
          {evidence.adjustments.usedPriors
            ? "segment defaults used for depreciation"
            : `depreciation fitted on ${evidence.adjustments.fittedOn} listings`}
        </span>
        {sorted.length > 8 && (
          <button className="btn btn--quiet" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show fewer" : `Show all ${sorted.length}`}
          </button>
        )}
      </div>
    </div>
  );
}
