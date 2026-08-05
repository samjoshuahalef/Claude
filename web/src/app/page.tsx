"use client";

import React from "react";
import { AppShell } from "@/components/af/AppShell";
import { DecisionCard } from "@/components/af/DecisionCard";
import { EmptyState } from "@/components/af/EmptyState";

export default function Home() {
  return (
    <AppShell active="opportunities">
      <div className="af-page">
        <div className="af-page__intro">
          <h1 className="af-h1">What should the dealer do next?</h1>
          <p className="af-body">
            AutoFlair is watching the Switzerland market continuously. Import your inventory to unlock
            buying and pricing opportunities personalized to your stock.
          </p>
        </div>

        <div className="af-stack">
          <DecisionCard
            eyebrow="Next step"
            title="Import your inventory"
            summary="Upload a CSV/Excel export (AutoScout-style) so the Vehicle Intelligence Engine can match your vehicles to market movement."
            confidence={0.98}
            confidenceTone="positive"
            reasons={[
              "Opportunities require dealer-specific stock context",
              "Pricing depends on local comps and days-on-market signals",
              "Confidence increases as the engine learns your import patterns",
            ]}
            badge={{ tone: "confidence", text: "Required" }}
            primaryAction={{
              label: "Import inventory",
              onClick: () => {},
            }}
            secondaryActions={[
              { label: "Download CSV template", onClick: () => {} },
            ]}
          />

          <div className="af-grid2">
            <EmptyState
              title="No buying opportunities yet"
              description="Once your inventory is imported, you’ll see ranked opportunities with confidence and reasoning."
              actionLabel="Import now"
              onAction={() => {}}
            />

            <DecisionCard
              eyebrow="Market change"
              title="Opportunity may be forming for compact hatchbacks"
              summary="A subtle shift in local demand suggests a short window for efficient buying."
              confidence={0.74}
              confidenceTone="warning"
              reasons={[
                "Comparable listings are moving faster than the last observed period",
                "Price deltas remain within the model’s confidence bounds",
              ]}
              badge={{ tone: "neutral", text: "Monitor" }}
              primaryAction={{ label: "See matching vehicles", onClick: () => {} }}
              secondaryActions={[{ label: "Dismiss", onClick: () => {} }]}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
