import React from "react";
import { cn } from "./cn";
import { Badge } from "./Badge";
import { formatKm } from "./Money";
import type { Vehicle } from "@/lib/types";

/**
 * One vehicle identity, rendered the same way in Valuation, Trade-in and
 * Inventory — a dealer should never wonder whether they are looking at the
 * same car.
 */
export function VehicleHeader({
  vehicle,
  action,
  className,
}: {
  vehicle: Vehicle;
  action?: React.ReactNode;
  className?: string;
}) {
  const specs = [
    String(vehicle.year),
    formatKm(vehicle.mileageKm),
    vehicle.fuel,
    vehicle.gearbox,
  ];

  return (
    <div
      className={cn(
        "flex flex-col gap-12 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-center gap-8">
          <h2 className="text-label-x-large text-accent-black">
            {vehicle.make} {vehicle.model}
          </h2>
          <Badge>{vehicle.country}</Badge>
        </div>
        <p className="text-body-medium text-black-alpha-56">
          {vehicle.variant}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-12 gap-y-4">
          {specs.map((spec) => (
            <span
              key={spec}
              className="tnum font-mono text-mono-x-small text-black-alpha-64"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>
      {action ? <div className="flex shrink-0 gap-8">{action}</div> : null}
    </div>
  );
}
