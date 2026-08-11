import React from "react";
import Link from "next/link";
import {
  AppShell,
  Badge,
  Button,
  DataTable,
  EmptyState,
  Money,
  PageHeader,
  StatTile,
  TrendDelta,
  ArrowRightIcon,
  SearchIcon,
  ValuationIcon,
  type Column,
} from "@/components/fc";
import { ALERTS, SEGMENTS } from "@/lib/mock";
import { chf, type AlertItem, type Segment } from "@/lib/types";

/**
 * Overview is a decision inbox, not a stats dashboard.
 *
 * Firecrawl's Overview showcased endpoints because its user was evaluating an
 * API. A dealer opening AutoFlair at 8am has a different question — what
 * changed overnight and what do I do about it — so the page leads with the
 * action queue and keeps the numbers as supporting context.
 */

const KIND_LABEL: Record<AlertItem["kind"], string> = {
  deal: "Deal",
  "price-drop": "Price drop",
  "stock-aging": "Stock",
  trend: "Trend",
};

const segmentColumns: Array<Column<Segment>> = [
  {
    key: "label",
    header: "Segment",
    render: (row) => (
      <Link
        href="/market"
        className="text-accent-black transition hover:text-heat-100"
      >
        {row.label}
      </Link>
    ),
  },
  {
    key: "median",
    header: "Median",
    numeric: true,
    render: (row) => <Money amount={row.medianPrice} />,
  },
  {
    key: "trend",
    header: "30d",
    numeric: true,
    render: (row) => (
      <span className="inline-flex justify-end">
        <TrendDelta value={row.trend30d} goodWhen="up" />
      </span>
    ),
  },
  {
    key: "listings",
    header: "Listings",
    numeric: true,
    render: (row) => row.listings,
  },
  {
    key: "days",
    header: "Days to sell",
    numeric: true,
    render: (row) => `${row.daysToSell}d`,
  },
];

export default function OverviewPage() {
  return (
    <AppShell active="overview">
      <PageHeader
        title="Good morning, Sam"
        description="Four things changed in your market overnight."
        action={
          <Button variant="primary" iconLeft={<ValuationIcon />}>
            New appraisal
          </Button>
        }
      />

      {/*
        The Advisor is ambient, but ambient-only costs discoverability — so it
        gets one visible entry point on the page a dealer opens first.
      */}
      <section className="border-b-1 border-border-faint bg-accent-white p-16 sm:p-24">
        <button
          type="button"
          className="flex h-48 w-full cursor-pointer items-center gap-12 rounded-8 border-1 border-border-faint bg-background-lighter px-16 text-left transition hover:border-heat-40 hover:bg-accent-white"
        >
          <span className="text-heat-100">
            <SearchIcon size={18} />
          </span>
          <span className="min-w-0 flex-1 truncate text-body-input text-black-alpha-48">
            Ask anything — &ldquo;what should I pay for a 2020 320d Touring?&rdquo;
          </span>
        </button>
      </section>

      <section className="grid grid-cols-1 border-b-1 border-border-faint bg-accent-white sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Stock value"
          value={<Money amount={chf(1284000)} />}
          delta={<TrendDelta value={-0.021} goodWhen="up" />}
          footnote="34 units"
          className="border-b-1 border-border-faint sm:border-r-1 lg:border-b-0"
        />
        <StatTile
          label="Avg. days on lot"
          value="41d"
          delta={<TrendDelta value={0.08} goodWhen="down" />}
          footnote="8 units over 60 days"
          className="border-b-1 border-border-faint lg:border-r-1 lg:border-b-0"
        />
        <StatTile
          label="Open opportunities"
          value="12"
          footnote="Matching your saved searches"
          className="border-b-1 border-border-faint sm:border-r-1 sm:border-b-0"
        />
        <StatTile label="Watched segments" value="6" footnote="2 moving sharply" />
      </section>

      {/* -------------------------------------------------- Needs attention */}
      <section className="border-b-1 border-border-faint bg-accent-white">
        <div className="flex items-center justify-between gap-16 border-b-1 border-border-faint p-16 sm:p-24">
          <h2 className="text-label-x-large text-accent-black">
            Needs your attention
          </h2>
          <Button size="small" href="/watchlists">
            View all
          </Button>
        </div>

        {ALERTS.map((alert) => (
          <Link
            key={alert.id}
            href={alert.href}
            className="group flex items-start gap-12 border-b-1 border-border-faint p-16 transition last:border-b-0 hover:bg-background-lighter sm:items-center sm:p-24"
          >
            <span className="mt-2 shrink-0 sm:mt-0">
              <Badge tone={alert.kind === "deal" ? "heat" : "neutral"}>
                {KIND_LABEL[alert.kind]}
              </Badge>
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-label-medium text-accent-black">
                {alert.title}
              </span>
              <span className="text-body-medium text-black-alpha-56">
                {alert.detail}
              </span>
            </span>

            <span className="hidden shrink-0 text-body-small text-black-alpha-40 sm:block">
              {alert.when}
            </span>
            <span className="shrink-0 text-black-alpha-24 transition group-hover:translate-x-2 group-hover:text-heat-100">
              <ArrowRightIcon size={14} />
            </span>
          </Link>
        ))}
      </section>

      {/* ------------------------------------------------ Watched segments */}
      <section className="border-b-1 border-border-faint bg-accent-white">
        <div className="flex items-center justify-between gap-16 border-b-1 border-border-faint p-16 sm:p-24">
          <h2 className="text-label-x-large text-accent-black">
            Your segments
          </h2>
          <Button size="small" href="/market" iconRight={<ArrowRightIcon size={14} />}>
            Explore market
          </Button>
        </div>
        <DataTable
          columns={segmentColumns}
          rows={SEGMENTS}
          getRowKey={(row) => row.id}
        />
      </section>

      <section className="bg-accent-white">
        <EmptyState
          title="Connect your inventory to unlock stock intelligence"
          description="Stock value and days-on-lot above are sample figures. Once your units are in, AutoFlair prices each one against live market data and tells you which to reprice, hold or wholesale."
          bullets={[
            "Per-unit market position against comparable live listings",
            "Ageing alerts before a unit becomes hard to move",
            "Recommended action per unit, with the reasoning behind it",
          ]}
          action={<Button variant="primary">Connect inventory</Button>}
        />
      </section>
    </AppShell>
  );
}
