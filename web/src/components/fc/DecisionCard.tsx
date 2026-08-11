import React from "react";
import { cn } from "./cn";
import { Badge } from "./Badge";
import { ConfidenceMeter } from "./ConfidenceMeter";

/**
 * A recommendation, what it is worth, how sure we are, and why. The "why" is
 * not optional — it is the difference between a number a dealer acts on and a
 * number they ignore.
 */
export function DecisionCard({
  eyebrow,
  title,
  headline,
  confidence,
  sampleSize,
  reasons,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  headline?: React.ReactNode;
  confidence: number;
  sampleSize?: number;
  reasons: string[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("flex flex-col gap-16 p-16 sm:p-24", className)}>
      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-6">
          {eyebrow ? (
            <span className="w-fit">
              <Badge tone="heat">{eyebrow}</Badge>
            </span>
          ) : null}
          <h2 className="text-label-x-large text-accent-black">{title}</h2>
          {headline ? (
            <div className="tnum mt-4 text-title-h3 text-accent-black">
              {headline}
            </div>
          ) : null}
        </div>
        <ConfidenceMeter
          value={confidence}
          sampleSize={sampleSize}
          className="w-full shrink-0 lg:w-260"
        />
      </div>

      <div className="border-t-1 border-border-faint pt-16">
        <h3 className="text-label-x-small text-black-alpha-56">
          Why this number
        </h3>
        <ul className="mt-10 flex flex-col gap-8">
          {reasons.map((reason) => (
            <li
              key={reason}
              className="flex gap-10 text-body-medium text-black-alpha-72"
            >
              <span
                className="mt-7 size-4 shrink-0 rounded-full bg-black-alpha-24"
                aria-hidden="true"
              />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {actions ? (
        <div className="flex flex-wrap gap-8 border-t-1 border-border-faint pt-16">
          {actions}
        </div>
      ) : null}
    </article>
  );
}
