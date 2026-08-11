import React from "react";
import { cn } from "./cn";

/**
 * Market polarity.
 *
 * `goodWhen` is required rather than defaulted, because metrics genuinely
 * disagree about direction and guessing produces confidently wrong colour:
 * stock value rising is good, days-on-lot rising is bad, and a listing priced
 * below market is a good buy but a bad sale. An explicit prop makes the
 * caller state which one they mean.
 *
 * The glyph and the signed value carry the meaning; colour only reinforces
 * it. Green/red is ΔE 4.2 under deuteranopia — unreadable as a sole channel —
 * so there is deliberately no colour-only variant to reach for.
 */
export function TrendDelta({
  value,
  goodWhen,
  suffix = "",
  className,
}: {
  value: number;
  /** "neither" renders neutral — direction is informational, not a verdict. */
  goodWhen: "up" | "down" | "neither";
  suffix?: string;
  className?: string;
}) {
  const flat = Math.abs(value) < 0.001;
  const rising = value > 0;

  let tone = "text-market-flat";
  if (!flat && goodWhen !== "neither") {
    const good = goodWhen === "up" ? rising : !rising;
    tone = good ? "text-market-down" : "text-market-up";
  }

  return (
    <span className={cn("tnum inline-flex items-center gap-4", tone, className)}>
      <span aria-hidden="true">{flat ? "→" : rising ? "▲" : "▼"}</span>
      <span>
        {rising && !flat ? "+" : ""}
        {(value * 100).toFixed(1)}%{suffix}
      </span>
    </span>
  );
}
