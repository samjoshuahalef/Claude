import React from "react";
import { AppShell, EmptyState, PageHeader } from "@/components/fc";

export default function Page() {
  return (
    <AppShell active="settings">
      <PageHeader title="Settings" description="Team, plan and integrations." />
      <section className="bg-accent-white">
        <EmptyState
          title="Account administration lives here"
          description="Usage and API keys moved out of the main navigation — they are account admin rather than daily work, so they sit alongside team and billing."
          bullets={[
            "Team members and dealership profile",
            "Plan, usage and billing",
            "Integrations and API keys",
          ]}
        />
      </section>
    </AppShell>
  );
}
