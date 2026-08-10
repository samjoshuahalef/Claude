"use client";

import type { SufficientAppraisal } from "@/lib/engine/types";
import { formatDays, formatMoney, splitMoney } from "@/lib/format";

/**
 * The verdict.
 *
 * A dealer standing at a desk with a customer waiting should get the answer in
 * one glance and one number. Everything else on the screen is there to be
 * checked afterwards, or not at all.
 */

export type Verdict = "pos" | "warn" | "neg";

export function verdictFor(
  offeredPrice: number | null,
  appraisal: SufficientAppraisal,
): Verdict {
  if (offeredPrice === null) return "pos";
  if (offeredPrice <= appraisal.maxBuyPrice) return "pos";
  if (offeredPrice <= appraisal.walkAwayPrice) return "warn";
  return "neg";
}

const VERDICT_COPY: Record<Verdict, string> = {
  pos: "Within your limit",
  warn: "Above target margin",
  neg: "Do not buy",
};

interface Props {
  appraisal: SufficientAppraisal;
  offeredPrice: number | null;
  targetDays: number;
}

export function DecisionHeadline({ appraisal, offeredPrice, targetDays }: Props) {
  const verdict = offeredPrice === null ? null : verdictFor(offeredPrice, appraisal);
  const copy = verdict ? VERDICT_COPY[verdict] : null;
  const { currency, amount } = splitMoney(appraisal.maxBuyPrice, appraisal.currency);

  // The headline states the ceiling, always. When an asking price is on the
  // table we additionally say how far off it is — the gap is the negotiation.
  const gap = offeredPrice === null ? null : offeredPrice - appraisal.maxBuyPrice;

  return (
    <section className="decision" aria-label="Buying decision">
      <div className="decision__inner">
        <div className="decision__top">
          <div className="stack-2">
            <p className="t-label">Maximum purchase price</p>
            <div className="decision__figure">
              <span className="cur num">{currency}</span>
              <span className="t-display num">{amount}</span>
            </div>
          </div>

          {verdict && copy && (
            <span className={`pill pill--${verdict}`}>
              <span className="pill__dot" aria-hidden />
              {copy}
            </span>
          )}
        </div>

        <p className="t-body decision__caption">
          {gap === null ? (
            <>
              Pay up to this figure and the car returns your target gross profit at an
              expected retail of{" "}
              <span className="t-strong num">
                {formatMoney(appraisal.expectedRetailPrice, appraisal.currency)}
              </span>{" "}
              within {formatDays(targetDays)}.
            </>
          ) : gap <= 0 ? (
            <>
              The asking price leaves{" "}
              <span className="t-strong num">
                {formatMoney(Math.abs(gap), appraisal.currency)}
              </span>{" "}
              of headroom against your target margin.
            </>
          ) : (
            <>
              The asking price is{" "}
              <span className="t-strong num">{formatMoney(gap, appraisal.currency)}</span>{" "}
              above your ceiling. Negotiate to{" "}
              <span className="t-strong num">
                {formatMoney(appraisal.maxBuyPrice, appraisal.currency)}
              </span>{" "}
              or walk.
            </>
          )}
        </p>

        <div className="decision__stats">
          <Stat
            label="Never exceed"
            value={formatMoney(appraisal.walkAwayPrice, appraisal.currency)}
            note="Minimum acceptable margin"
            tone="neg"
          />
          <Stat
            label="Expected retail"
            value={formatMoney(appraisal.expectedRetailPrice, appraisal.currency)}
            note={`Sells in ~${formatDays(appraisal.expectedDaysToSale)}`}
          />
          <Stat
            label="Gross profit"
            value={formatMoney(
              appraisal.bridge.find((line) => line.key === "target_margin")
                ? Math.abs(
                    appraisal.bridge.find((line) => line.key === "target_margin")!.amount,
                  )
                : 0,
              appraisal.currency,
            )}
            note="At the ceiling price"
            tone="pos"
          />
          <Stat
            label="Confidence"
            value={`${appraisal.confidence.score}`}
            note={`${appraisal.evidence.sampleSize} comparables`}
          />
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "pos" | "neg";
}) {
  return (
    <div className={`decision__stat${tone ? ` decision__stat--${tone}` : ""}`}>
      <span className="decision__stat-k">{label}</span>
      <span className="decision__stat-v num">{value}</span>
      <span className="decision__stat-n">{note}</span>
    </div>
  );
}
