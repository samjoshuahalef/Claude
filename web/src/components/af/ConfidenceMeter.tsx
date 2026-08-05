"use client";

import React from "react";

export type ConfidenceTone = "neutral" | "confidence" | "positive" | "warning";

type ConfidenceMeterProps = {
  value: number; // 0..1
  tone?: ConfidenceTone;
  label?: string;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function ConfidenceMeter({
  value,
  tone = "confidence",
  label = "Confidence",
}: ConfidenceMeterProps) {
  const v = clamp01(value);
  const percent = Math.round(v * 100);

  return (
    <div className={["af-conf", `af-conf--${tone}`].join(" ")}>
      <div className="af-conf__top">
        <span className="af-conf__label">{label}</span>
        <span className="af-conf__value">{percent}%</span>
      </div>
      <div className="af-conf__track" aria-hidden="true">
        <div className="af-conf__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

