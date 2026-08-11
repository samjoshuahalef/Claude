import React from "react";
import { cn } from "./cn";

/**
 * An unexplained number out of a valuation engine does not get trusted, and
 * does not get used. Confidence travels with every value we publish.
 */
export function ConfidenceMeter({
  value,
  sampleSize,
  className,
}: {
  /** 0..1 */
  value: number;
  sampleSize?: number;
  className?: string;
}) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const label = percent >= 80 ? "High" : percent >= 55 ? "Moderate" : "Low";

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex items-baseline justify-between gap-8">
        <span className="text-label-x-small text-black-alpha-56">
          Confidence
        </span>
        <span className="tnum text-label-small text-accent-black">
          {label} · {percent}%
        </span>
      </div>
      <div
        className="h-6 w-full overflow-hidden rounded-full bg-black-alpha-5"
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Valuation confidence"
      >
        <div
          className="h-full rounded-full bg-market-down transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      {sampleSize ? (
        <span className="tnum text-body-small text-black-alpha-48">
          Based on {new Intl.NumberFormat("de-CH").format(sampleSize)} comparable
          listings
        </span>
      ) : null}
    </div>
  );
}
