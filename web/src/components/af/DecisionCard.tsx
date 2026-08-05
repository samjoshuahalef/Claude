"use client";

import React from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { ConfidenceMeter, ConfidenceTone } from "./ConfidenceMeter";

export type DecisionPrimaryAction = {
  label: string;
  onClick?: () => void;
};

export type DecisionCardProps = {
  eyebrow?: string;
  title: string;
  summary?: string;
  confidence: number; // 0..1
  confidenceTone?: ConfidenceTone;
  reasons: string[];
  primaryAction: DecisionPrimaryAction;
  secondaryActions?: Array<{ label: string; onClick?: () => void }>;
  badge?: { tone?: "neutral" | "primary" | "confidence" | "positive"; text: string };
};

export function DecisionCard({
  eyebrow,
  title,
  summary,
  confidence,
  confidenceTone = "confidence",
  reasons,
  primaryAction,
  secondaryActions,
  badge,
}: DecisionCardProps) {
  return (
    <article className="af-decision">
      {eyebrow ? (
        <div className="af-decision__eyebrow">
          <Badge tone="neutral">{eyebrow}</Badge>
        </div>
      ) : null}

      <div className="af-decision__header">
        <div className="af-decision__titleBlock">
          <h2 className="af-h2 af-decision__title">{title}</h2>
          {summary ? <p className="af-body af-decision__summary">{summary}</p> : null}
        </div>

        <div className="af-decision__meter">
          {badge ? (
            <div className="af-decision__badge">
              <Badge tone={badge.tone ?? "confidence"}>{badge.text}</Badge>
            </div>
          ) : null}
          <ConfidenceMeter value={confidence} tone={confidenceTone} label="Confidence" />
        </div>
      </div>

      <div className="af-decision__reasons" aria-label="Data-backed reasons">
        <div className="af-decision__reasonsTitle">Why this recommendation</div>
        <ul className="af-decision__reasonsList">
          {reasons.map((r, idx) => (
            <li key={idx} className="af-decision__reason">
              <span className="af-decision__reasonIcon" aria-hidden="true">
                ✓
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="af-decision__actions">
        <Button variant="primary" size="lg" onClick={primaryAction.onClick}>
          {primaryAction.label}
        </Button>

        {secondaryActions && secondaryActions.length ? (
          <div className="af-decision__secondary">
            {secondaryActions.map((a, idx) => (
              <button
                key={idx}
                type="button"
                className="af-linkBtn"
                onClick={a.onClick}
              >
                {a.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

