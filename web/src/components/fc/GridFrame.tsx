import React from "react";
import { cn } from "./cn";

/**
 * Firecrawl frames content in a hairline grid and marks the intersections
 * with a small crosshair — the "graph paper" motif that runs through the
 * whole product. The crosshairs are decorative overlays so they can sit on
 * top of a cell boundary without affecting layout.
 */
export function GridPlus({
  className,
}: {
  /** Position with inset utilities, e.g. `-top-4 -left-4`. */
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute z-10 text-border-loud", className)}
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
        <path
          d="M4.5 0v9M0 4.5h9"
          stroke="currentColor"
          strokeWidth="1"
          shapeRendering="crispEdges"
        />
      </svg>
    </span>
  );
}

/** A section separated from the next by a full-bleed hairline. */
export function GridSection({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("relative border-b-1 border-border-faint", className)}
      {...rest}
    >
      {children}
    </section>
  );
}
