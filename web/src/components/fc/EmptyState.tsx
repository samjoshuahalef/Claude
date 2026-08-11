import React from "react";
import { cn } from "./cn";
import { AsciiField } from "./AsciiField";

/**
 * Sections ship before their data does. The empty state has to make the value
 * legible on its own, not just say "nothing here".
 */
export function EmptyState({
  title,
  description,
  bullets,
  action,
  className,
}: {
  title: string;
  description: string;
  bullets?: string[];
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden p-24 sm:p-48", className)}>
      <div className="pointer-events-none absolute -top-16 right-0 opacity-50">
        <AsciiField rows={10} cols={70} seed={5} />
      </div>

      <div className="relative flex max-w-560 flex-col gap-12">
        <h2 className="text-title-h5 text-accent-black">{title}</h2>
        <p className="text-body-medium text-black-alpha-56">{description}</p>

        {bullets?.length ? (
          <ul className="mt-4 flex flex-col gap-8">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-10 text-body-medium text-black-alpha-72"
              >
                <span className="mt-7 size-4 shrink-0 rounded-full bg-heat-100" aria-hidden="true" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {action ? <div className="mt-8 flex gap-8">{action}</div> : null}
      </div>
    </div>
  );
}
