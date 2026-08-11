import React from "react";
import { cn } from "./cn";

/** Headline metric. No plot — the number is the whole point. */
export function StatTile({
  label,
  value,
  delta,
  footnote,
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  footnote?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6 p-16 sm:p-24", className)}>
      <span className="text-label-x-small text-black-alpha-56">{label}</span>
      <div className="flex items-baseline gap-10">
        <span className="tnum text-title-h4 text-accent-black">{value}</span>
        {delta ? <span className="text-label-small">{delta}</span> : null}
      </div>
      {footnote ? (
        <span className="text-body-small text-black-alpha-48">{footnote}</span>
      ) : null}
    </div>
  );
}
