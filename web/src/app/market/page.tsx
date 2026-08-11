import React from "react";
import { AppShell, EmptyState, PageHeader } from "@/components/fc";

export default function Page() {
  return (
    <AppShell active="market">
      <PageHeader title="Market" description="Explore segments, prices and where the market is moving." />
      <section className="bg-accent-white">
        <EmptyState
          title="Market intelligence is next up"
          description="The landing view is the movers board — which of your segments are heating and cooling — and every segment drills into its own page."
          bullets={[
            "Price distribution, supply and days-to-sell per segment",
            "Trend over time, because trends are the time axis on this data rather than a separate report",
            "Watch any segment to get its movement in your alerts",
          ]}
        />
      </section>
    </AppShell>
  );
}
