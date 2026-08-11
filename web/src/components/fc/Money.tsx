import React from "react";
import { cn } from "./cn";
import type { Amount } from "@/lib/types";

/**
 * Currency-aware, tabular by default. Never assumes CHF — the DE lens needs
 * EUR alongside it, and retrofitting currency into every number later is the
 * expensive version of this.
 */
export function Money({
  amount,
  signed,
  className,
}: {
  amount: Amount;
  /** Show an explicit + for positive values, as cost adjustments need. */
  signed?: boolean;
  className?: string;
}) {
  // Format the magnitude and place the sign ourselves — de-CH renders a
  // negative as "CHF-800", with the minus wedged inside the currency string.
  const formatted = new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: amount.currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount.value));

  const sign = amount.value < 0 ? "\u2212" : signed && amount.value > 0 ? "+" : "";

  return (
    <span className={cn("tnum", className)}>
      {sign}
      {formatted}
    </span>
  );
}

export function formatKm(km: number) {
  return `${new Intl.NumberFormat("de-CH").format(km)} km`;
}
