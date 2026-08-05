"use client";

import React from "react";

export type BadgeTone = "neutral" | "primary" | "confidence" | "positive";

type BadgeProps = {
  tone?: BadgeTone;
  children: React.ReactNode;
  icon?: React.ReactNode;
};

export function Badge({ tone = "neutral", children, icon }: BadgeProps) {
  return (
    <span className={["af-badge", `af-badge--${tone}`].join(" ")}>
      {icon ? <span className="af-badge__icon">{icon}</span> : null}
      {children}
    </span>
  );
}

