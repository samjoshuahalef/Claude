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

const BAND_LABEL: Record<Confidence["band"], string> = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

export function ConfidencePanel({ confidence, risks }: Props) {
  return (
    <div className={`af-conf af-conf--${confidence.band}`}>
      <div className="af-conf__head">
        <span className="af-conf__score af-num">{confidence.score}</span>
        <span className="af-conf__band">{BAND_LABEL[confidence.band]} confidence</span>
      </div>

      <div>
        {confidence.drivers.map((driver) => (
          <div className="af-driver" key={driver.key}>
            <div className="af-stack-2">
              <span className="af-driver__label">{driver.label}</span>
              <span className="af-driver__detail">{driver.detail}</span>
            </div>
            <span className="af-driver__track">
              <span
                className="af-driver__fill"
                style={{ width: `${Math.round(driver.score * 100)}%` }}
              />
            </span>
          </div>
        ))}
      </div>

      {risks.length > 0 && (
        <>
          <hr className="af-divider" />
          <div className="af-stack-3">
            <p className="af-eyebrow">Risk flags</p>
            <div className="af-risks">
              {risks.map((risk, index) => (
                <span className={`af-risk af-risk--${risk.severity}`} key={`${risk.key}-${index}`}>
                  <span className="af-risk__dot" aria-hidden />
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
