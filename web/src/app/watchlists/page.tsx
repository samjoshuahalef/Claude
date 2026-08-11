import React from "react";
import { AppShell, EmptyState, PageHeader } from "@/components/fc";

export default function Page() {
  return (
    <AppShell active="watchlists">
      <PageHeader title="Watchlists" description="What you track, and everything it has flagged." />
      <section className="bg-accent-white">
        <EmptyState
          title="One mechanism, not three"
          description="A watch is a saved query plus a notification rule. Watch a segment from Market, a search from Sourcing, or a unit from Inventory — every firing lands in one feed here."
          bullets={[
            "Watches tab to manage what you track",
            "Alert feed for everything that has fired",
            "The topbar bell is the quick way in",
          ]}
        />
      </section>
    </AppShell>
  );
}
