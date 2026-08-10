"use client";

import type { SufficientAppraisal } from "@/lib/engine/types";
import { formatDays, formatMoney, splitMoney } from "@/lib/format";
import { PriceLadder } from "@/components/viz/PriceLadder";

/**
 * The verdict.
 *
 * One hero figure, one sentence, and a ladder that puts every price on a single
 * axis. The four prices used to be four stat boxes — four numbers to read and
 * sort in your head. On one axis they become a picture, and the dealer's actual
 * question ("is their price inside my limit?") stops being arithmetic and
 * becomes a glance.
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
  const { currency, amount } = splitMoney(appraisal.maxBuyPrice, appraisal.currency);
  const gap = offeredPrice === null ? null : offeredPrice - appraisal.maxBuyPrice;
  const targetGross = Math.abs(
    appraisal.bridge.find((line) => line.key === "target_margin")?.amount ?? 0,
  );

  return (
    <section className="decision" aria-label="Buying decision">
      <div className="decision__top">
        <div className="stack-2">
          <p className="t-label">Maximum purchase price</p>
          <div className="decision__figure">
            <span className="cur">{currency}</span>
            <span className="t-display">{amount}</span>
          </div>
        </div>

        {verdict && (
          <span className={`pill pill--${verdict}`}>
            <span className="pill__dot" aria-hidden />
            {VERDICT_COPY[verdict]}
          </span>
        )}
      </div>

      <p className="t-body decision__caption">
        {gap === null ? (
          <>Pay up to this and the car returns your target gross within {formatDays(targetDays)}.</>
        ) : gap <= 0 ? (
          <>
            Their price leaves{" "}
            <span className="t-strong num">{formatMoney(Math.abs(gap), appraisal.currency)}</span> of
            headroom.
          </>
        ) : (
          <>
            Their price is{" "}
            <span className="t-strong num">{formatMoney(gap, appraisal.currency)}</span> over your
            ceiling. Negotiate or walk.
          </>
        )}
      </p>

      <div className="decision__ladder">
        <PriceLadder
          maxBuyPrice={appraisal.maxBuyPrice}
          walkAwayPrice={appraisal.walkAwayPrice}
          expectedRetailPrice={appraisal.expectedRetailPrice}
          askingPrice={offeredPrice}
          currency={appraisal.currency}
        />
      </div>

      {/* Three figures, not five. Retail and the walk-away price now live on the
          ladder, where position says more about them than a number could. */}
      <div className="decision__stats">
        <Stat
          label="Gross profit"
          value={formatMoney(targetGross, appraisal.currency)}
          note="At the ceiling price"
          tone="pos"
        />
        <Stat
          label="Expected to sell in"
          value={formatDays(appraisal.expectedDaysToSale)}
          note="At the retail price shown"
        />
        <Stat
          label="Confidence"
          value={`${appraisal.confidence.score}`}
          note={`${appraisal.evidence.sampleSize} comparables`}
        />
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
