import React from "react";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "heat" | "forest" | "bluetron" | "honey";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-black-alpha-5 text-black-alpha-64",
  heat: "bg-heat-8 text-heat-100",
  forest: "bg-accent-forest/12 text-accent-forest",
  bluetron: "bg-accent-bluetron/12 text-accent-bluetron",
  honey: "bg-accent-honey/16 text-accent-honey",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-20 shrink-0 items-center rounded-4 px-6 text-label-x-small",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Monospaced pill used for the tech tags under Example Projects. */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-24 items-center rounded-4 bg-heat-8 px-8 font-mono text-mono-x-small text-heat-100">
      {children}
    </span>
  );
}

/** Keyboard hint, e.g. the ⌘K on the sidebar search field. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-20 items-center rounded-4 bg-black-alpha-5 px-6 font-mono text-mono-x-small text-black-alpha-48">
      {children}
    </kbd>
  );
}
