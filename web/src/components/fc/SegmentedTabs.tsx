"use client";

import React from "react";
import { cn } from "./cn";
import { Badge } from "./Badge";

export type Segment = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
};

export function SegmentedTabs({
  segments,
  value,
  onChange,
  className,
}: {
  segments: Segment[];
  value: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-2 rounded-10 border-1 border-border-faint bg-background-lighter p-4",
        className,
      )}
    >
      {segments.map((segment, index) => {
        const active = segment.value === value;

        return (
          <React.Fragment key={segment.value}>
            {/* Inactive neighbours are separated by hairlines, not gaps. */}
            {index > 0 && !active && segments[index - 1].value !== value ? (
              <span className="h-16 w-1 bg-border-faint" aria-hidden="true" />
            ) : null}

            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange?.(segment.value)}
              className={cn(
                "inline-flex h-32 cursor-pointer items-center gap-8 rounded-8 px-12 text-label-medium transition",
                active
                  ? "border-1 border-border-faint bg-accent-white text-accent-black shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  : "text-black-alpha-56 hover:text-accent-black",
              )}
            >
              {segment.icon ? (
                <span className={active ? "text-accent-black" : "text-black-alpha-32"}>
                  {segment.icon}
                </span>
              ) : null}
              {segment.label}
              {segment.badge ? <Badge>{segment.badge}</Badge> : null}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
