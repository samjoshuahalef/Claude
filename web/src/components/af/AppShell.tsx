"use client";

import React from "react";

export type WorkflowKey =
  | "discover"
  | "opportunities"
  | "tradein"
  | "pricing"
  | "stock"
  | "ask";

const workflowItems: Array<{ key: WorkflowKey; label: string }> = [
  { key: "discover", label: "Discover" },
  { key: "opportunities", label: "Opportunities" },
  { key: "tradein", label: "Trade-in" },
  { key: "pricing", label: "Pricing" },
  { key: "stock", label: "Stock" },
  { key: "ask", label: "Ask" },
];

export function AppShell({
  active = "discover",
  children,
}: {
  active?: WorkflowKey;
  children: React.ReactNode;
}) {
  return (
    <div className="af-app">
      <header className="af-topbar">
        <div className="af-topbar__left">
          <div className="af-logo" aria-label="AutoFlair">
            <span className="af-logo__mark" aria-hidden="true" />
            <span className="af-logo__text">AutoFlair</span>
          </div>

          <div className="af-region">
            <span className="af-region__label">Region</span>
            <span className="af-region__value">Switzerland</span>
          </div>
        </div>

        <div className="af-topbar__right">
          <button type="button" className="af-ctaInline">
            Import inventory
          </button>
          <div className="af-avatar" aria-hidden="true" />
        </div>
      </header>

      <div className="af-bodyGrid">
        <nav className="af-rail" aria-label="Dealer workflow navigation">
          {workflowItems.map((item) => {
            const isActive = item.key === active;
            return (
              <button
                key={item.key}
                type="button"
                className={["af-railItem", isActive && "af-railItem--active"]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="af-railItem__dot" aria-hidden="true" />
                <span className="af-railItem__label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="af-main" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}

