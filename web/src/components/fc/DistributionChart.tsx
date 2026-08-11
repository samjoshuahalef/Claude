import React from "react";
import { cn } from "./cn";

type Bucket = { from: number; to: number; count: number };

/**
 * Price distribution for a segment, with the valued vehicle marked.
 *
 * Single series, so no legend — the title names it. Bars stay neutral because
 * they encode volume, not polarity; the heat marker is a pointer, not a data
 * colour, which keeps the "heat never encodes data" rule intact.
 */
export function DistributionChart({
  buckets,
  marker,
  markerLabel = "This vehicle",
  className,
}: {
  buckets: Bucket[];
  /** Price to mark on the axis. */
  marker?: number;
  markerLabel?: string;
  className?: string;
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const format = (n: number) => `${Math.round(n / 1000)}k`;
  const markerIndex = marker
    ? buckets.findIndex((b) => marker >= b.from && marker < b.to)
    : -1;

  return (
    <figure className={cn("flex flex-col gap-8", className)}>
      <div className="flex h-160 items-end gap-2" role="img"
        aria-label={`Price distribution across ${buckets.length} price bands${
          marker ? `, with ${markerLabel} marked` : ""
        }`}
      >
        {buckets.map((bucket, index) => {
          const isMarked = index === markerIndex;
          return (
            <div
              key={bucket.from}
              className="group relative flex h-full flex-1 flex-col justify-end"
            >
              {/* Hover readout — an HTML chart should respond to the pointer. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-full z-10 mb-6 flex justify-center opacity-0 transition group-hover:opacity-100">
                <span className="tnum rounded-6 border-1 border-border-faint bg-accent-white px-8 py-4 text-mono-x-small whitespace-nowrap text-accent-black shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  {format(bucket.from)}–{format(bucket.to)} · {bucket.count}
                </span>
              </div>

              <div
                className={cn(
                  "w-full rounded-t-4 transition",
                  isMarked
                    ? "bg-heat-100"
                    : "bg-illustrations-default group-hover:bg-black-alpha-24",
                )}
                style={{ height: `${(bucket.count / max) * 100}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between border-t-1 border-border-faint pt-8">
        <span className="tnum font-mono text-mono-x-small text-black-alpha-40">
          {format(buckets[0].from)}
        </span>
        {marker ? (
          <span className="tnum font-mono text-mono-x-small text-heat-100">
            {markerLabel} · {format(marker)}
          </span>
        ) : null}
        <span className="tnum font-mono text-mono-x-small text-black-alpha-40">
          {format(buckets[buckets.length - 1].to)}
        </span>
      </div>
    </figure>
  );
}
