import React from "react";
import { AppShell, EmptyState, PageHeader } from "@/components/fc";

export default function Page() {
  return (
    <AppShell active="sourcing">
      <PageHeader title="Sourcing" description="Undervalued listings scored against live market value." />
      <section className="bg-accent-white">
        <EmptyState
          title="Deal finding comes after Market"
          description="Sourcing ranks live listings by the gap between asking price and market value, so the opportunities surface rather than needing to be hunted."
          bullets={[
            "Ranked by value gap, with the reasoning shown per listing",
            "Any search can be saved, and a saved search becomes a watch",
            "Germany import lands here later as a source filter with landed cost",
          ]}
        />
      </section>
    </AppShell>
  );
}
