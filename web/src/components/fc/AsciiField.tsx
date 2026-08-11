import React from "react";
import { cn } from "./cn";

/**
 * The faint character clouds Firecrawl paints behind page headers and charts.
 *
 * Generated from summed sines rather than a PRNG so the output is identical
 * on the server and the client — a random field would hydrate-mismatch.
 */

const RAMP = "    ....::;;--==++xXX#";

function density(x: number, y: number, seed: number) {
  const a = Math.sin((x + seed) * 0.37);
  const b = Math.sin(y * 0.51 + x * 0.13);
  const c = Math.sin((x + y * 1.7) * 0.19 + seed);
  return (a + b + c) / 3;
}

export function AsciiField({
  rows = 12,
  cols = 96,
  seed = 3,
  /** "cloud" fades toward the left edge; "field" is uniform. */
  shape = "cloud",
  className,
}: {
  rows?: number;
  cols?: number;
  seed?: number;
  shape?: "cloud" | "field";
  className?: string;
}) {
  const lines: string[] = [];

  for (let y = 0; y < rows; y += 1) {
    let line = "";
    for (let x = 0; x < cols; x += 1) {
      const falloff = shape === "cloud" ? Math.min(1, (x / cols) ** 1.6 * 1.9) : 1;
      const value = (density(x, y, seed) * 0.5 + 0.5) * falloff;
      line += RAMP[Math.min(RAMP.length - 1, Math.floor(value * RAMP.length))];
    }
    lines.push(line);
  }

  return (
    <pre
      aria-hidden="true"
      className={cn(
        "pointer-events-none font-ascii text-[10px] leading-[12px] whitespace-pre text-illustrations-muted select-none",
        className,
      )}
    >
      {lines.join("\n")}
    </pre>
  );
}
