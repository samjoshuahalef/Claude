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

export type Verdict = "go" | "caution" | "stop";

export function verdictFor(
  offeredPrice: number | null,
  appraisal: SufficientAppraisal,
): Verdict {
  if (offeredPrice === null) return "go";
  if (offeredPrice <= appraisal.maxBuyPrice) return "go";
  if (offeredPrice <= appraisal.walkAwayPrice) return "caution";
  return "stop";
}

const VERDICT_COPY: Record<Verdict, { label: string; glow: string }> = {
  go: { label: "Within your limit", glow: "var(--af-go-soft)" },
  caution: { label: "Above target margin", glow: "var(--af-caution-soft)" },
  stop: { label: "Do not buy", glow: "var(--af-stop-soft)" },
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
    <section
      className="af-decision"
      style={{ ["--af-verdict-glow" as string]: copy?.glow ?? "var(--af-accent-soft)" }}
      aria-label="Buying decision"
    >
      <div className="af-decision__inner">
        <div className="af-decision__top">
          <div className="af-stack-2">
            <p className="af-eyebrow">Maximum purchase price</p>
            <div className="af-decision__headline">
              <span className="af-decision__currency af-num">{currency}</span>
              <span className="af-display af-decision__amount">{amount}</span>
            </div>
          </div>

          {verdict && copy && (
            <span className={`af-verdict af-verdict--${verdict}`}>
              <span className="af-verdict__dot" aria-hidden />
              {copy.label}
            </span>
          )}
        </div>

        <p className="af-body af-decision__caption">
          {gap === null ? (
            <>
              Pay up to this figure and the car returns your target gross profit at an
              expected retail of{" "}
              <span className="af-strong af-num">
                {formatMoney(appraisal.expectedRetailPrice, appraisal.currency)}
              </span>{" "}
              within {formatDays(targetDays)}.
            </>
          ) : gap <= 0 ? (
            <>
              The asking price leaves{" "}
              <span className="af-strong af-num">
                {formatMoney(Math.abs(gap), appraisal.currency)}
              </span>{" "}
              of headroom against your target margin.
            </>
          ) : (
            <>
              The asking price is{" "}
              <span className="af-strong af-num">{formatMoney(gap, appraisal.currency)}</span>{" "}
              above your ceiling. Negotiate to{" "}
              <span className="af-strong af-num">
                {formatMoney(appraisal.maxBuyPrice, appraisal.currency)}
              </span>{" "}
              or walk.
            </>
          )}
        </p>

        <div className="af-decision__stats">
          <Stat
            label="Never exceed"
            value={formatMoney(appraisal.walkAwayPrice, appraisal.currency)}
            note="Minimum acceptable margin"
            tone="stop"
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
            tone="go"
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
  tone?: "go" | "stop";
}) {
  return (
    <div className={`af-stat${tone ? ` af-stat--${tone}` : ""}`}>
      <span className="af-stat__k">{label}</span>
      <span className="af-stat__v af-num">{value}</span>
      <span className="af-stat__note">{note}</span>
    </div>
  );
}
