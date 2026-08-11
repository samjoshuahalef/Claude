import React from "react";
import { AppShell, EmptyState, PageHeader } from "@/components/fc";

export default function Page() {
  return (
    <AppShell active="inventory">
      <PageHeader title="Inventory" description="Your stock, priced against the market it competes in." />
      <section className="bg-accent-white">
        <EmptyState
          title="Connect your inventory"
          description="AutoFlair prices each unit you own against comparable live listings, then tells you which to reprice, hold or wholesale — and why."
          bullets={[
            "Per-unit market position and days on lot",
            "Ageing alerts before a unit becomes hard to move",
            "A recommended action per unit, with its reasoning",
          ]}
        />
      </section>
    </AppShell>
  );
}
