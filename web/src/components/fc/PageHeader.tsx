import React from "react";
import { cn } from "./cn";

/** The title block every section opens with. Keeps the type scale honest. */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-12 border-b-1 border-border-faint bg-accent-white p-16 sm:flex-row sm:items-start sm:justify-between sm:p-24",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <h1 className="text-title-h5 text-accent-black">{title}</h1>
        {description ? (
          <p className="text-body-medium text-black-alpha-56">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 gap-8">{action}</div> : null}
    </div>
  );
}
