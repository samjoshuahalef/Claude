"use client";

import type { Confidence, RiskFlag } from "@/lib/engine/types";

/**
 * Confidence and risk.
 *
 * Shown as drivers rather than a single opaque score, because "72" tells a
 * dealer nothing they can act on while "only 6 observed sales behind the timing
 * estimate" tells them exactly how much weight to put on the days figure.
 */

interface Props {
  confidence: Confidence;
  risks: RiskFlag[];
}

const BAND: Record<Confidence["band"], { label: string; tone: string }> = {
  high: { label: "High confidence", tone: "pos" },
  moderate: { label: "Moderate confidence", tone: "warn" },
  low: { label: "Low confidence", tone: "neg" },
};

const SEVERITY_TONE: Record<RiskFlag["severity"], string> = {
  info: "calm",
  warning: "warn",
  critical: "neg",
};

export function ConfidencePanel({ confidence, risks }: Props) {
  const band = BAND[confidence.band];

  return (
    <div className="stack-4">
      <div className="row row--between row--baseline">
        <span className="metric__value metric__value--sm num">{confidence.score}</span>
        <span className={`pill pill--${band.tone}`}>
          <span className="pill__dot" aria-hidden />
          {band.label}
        </span>
      </div>

      <div className="stack-3">
        {confidence.drivers.map((driver) => (
          <div className="driver" key={driver.key}>
            <div className="stack-2">
              <span className="t-sm t-strong">{driver.label}</span>
              <span className="t-xs">{driver.detail}</span>
            </div>
            <span className="meter">
              <span
                className={`meter__fill meter__fill--${band.tone}`}
                style={{ width: `${Math.round(driver.score * 100)}%` }}
              />
            </span>
          </div>
        ))}
      </div>

      {risks.length > 0 && (
        <>
          <hr className="divider" />
          <div className="stack-3">
            <p className="t-label">Risk flags</p>
            <div className="row wrap" style={{ gap: "var(--s2)" }}>
              {risks.map((risk, index) => (
                <span
                  className={`pill pill--${SEVERITY_TONE[risk.severity]}`}
                  key={`${risk.key}-${index}`}
                >
                  <span className="pill__dot" aria-hidden />
                  {risk.message}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
