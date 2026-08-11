import React from "react";
import { cn } from "./cn";

/**
 * Firecrawl's dashboard surfaces are flat: white fill, 1px faint border,
 * 8px radius, no shadow. Depth comes from the border grid, not elevation.
 */
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-8 border-1 border-border-faint bg-accent-white",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-16", className)}>
      <div className="flex flex-col gap-2">
        <h2 className="text-title-h5 text-accent-black">{title}</h2>
        {subtitle ? (
          <p className="text-body-medium text-black-alpha-56">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
