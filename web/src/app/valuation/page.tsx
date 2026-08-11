"use client";

import React from "react";
import {
  AppShell,
  Badge,
  Button,
  DataTable,
  DecisionCard,
  DistributionChart,
  Input,
  Money,
  PageHeader,
  SegmentedTabs,
  TrendDelta,
  VehicleHeader,
  formatKm,
  ArrowRightIcon,
  DownloadIcon,
  SearchIcon,
  WatchlistIcon,
  type Column,
} from "@/components/fc";
import { SAMPLE_VALUATION } from "@/lib/mock";
import { chf, type Comparable, type ValuationMode } from "@/lib/types";

/**
 * Valuation, with trade-in as a mode rather than a separate section.
 *
 * All three modes start from the same vehicle and the same retail value, and
 * differ only in the adjustments applied on top. Splitting them into separate
 * tools would make a dealer enter the same car twice — the fastest way to
 * lose their trust in the tool.
 *
 * The adjustment list is also where the Germany import lens lands later:
 * duty, VAT and transport are simply further entries that are absent for a
 * domestic car.
 */

const MODES: Array<{ value: ValuationMode; label: string }> = [
  { value: "retail", label: "Retail value" },
  { value: "trade-in", label: "Trade-in offer" },
  { value: "buy-target", label: "Buy target" },
];

const MODE_COPY: Record<ValuationMode, { title: string; eyebrow: string; blurb: string }> = {
  retail: {
    eyebrow: "Retail",
    title: "What this car sells for",
    blurb: "Asking price a dealer can realistically achieve in this market today.",
  },
  "trade-in": {
    eyebrow: "Trade-in",
    title: "What to offer the customer",
    blurb: "Retail value less reconditioning, target margin and days-to-sell risk.",
  },
  "buy-target": {
    eyebrow: "Buy target",
    title: "Your maximum bid",
    blurb: "The most you can pay at auction or trade and still hit target margin.",
  },
};

const compColumns: Array<Column<Comparable>> = [
  { key: "title", header: "Listing", render: (row) => row.title },
  { key: "year", header: "Year", numeric: true, render: (row) => row.year },
  {
    key: "km",
    header: "Mileage",
    numeric: true,
    render: (row) => formatKm(row.mileageKm),
  },
  {
    key: "price",
    header: "Price",
    numeric: true,
    render: (row) => <Money amount={row.price} />,
  },
  {
    key: "delta",
    header: "vs market",
    numeric: true,
    render: (row) => (
      <span className="inline-flex justify-end">
        <TrendDelta value={row.deltaVsMarket} goodWhen="down" />
      </span>
    ),
  },
  {
    key: "days",
    header: "Listed",
    numeric: true,
    render: (row) => `${row.daysListed}d`,
  },
];

export default function ValuationPage() {
  const [mode, setMode] = React.useState<ValuationMode>("retail");
  const valuation = SAMPLE_VALUATION;

  const breakdown = valuation.breakdown[mode];

  const total = breakdown.lines.reduce(
    (sum, line) => sum + line.amount.value,
    breakdown.basis.amount.value,
  );

  const copy = MODE_COPY[mode];

  return (
    <AppShell active="valuation">
      <PageHeader
        title="Valuation"
        description="Price any vehicle against live Swiss market data."
        action={
          <>
            <Button iconLeft={<WatchlistIcon />}>Watch model</Button>
            <Button iconLeft={<DownloadIcon />}>Export</Button>
          </>
        }
      />

      {/* ------------------------------------------------------ Vehicle input */}
      <section className="border-b-1 border-border-faint bg-accent-white p-16 sm:p-24">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
          <Input
            className="h-48 flex-1"
            iconLeft={<SearchIcon size={18} />}
            placeholder="VIN, licence plate, or make and model"
            defaultValue="BMW 320d Touring xDrive M Sport · 2020 · 78,400 km"
            aria-label="Vehicle to value"
          />
          <Button variant="primary" size="large" className="shrink-0">
            Value this vehicle
          </Button>
        </div>
      </section>

      <section className="border-b-1 border-border-faint bg-accent-white p-16 sm:p-24">
        <VehicleHeader
          vehicle={valuation.vehicle}
          action={<Badge tone="neutral">412 comps · 90 days</Badge>}
        />
      </section>

      {/* ---------------------------------------------------------- The modes */}
      <section className="border-b-1 border-border-faint bg-accent-white p-16 sm:p-24">
        <SegmentedTabs
          segments={MODES}
          value={mode}
          onChange={(next) => setMode(next as ValuationMode)}
        />
        <p className="mt-12 text-body-medium text-black-alpha-56">{copy.blurb}</p>
      </section>

      <section className="grid grid-cols-1 border-b-1 border-border-faint bg-accent-white lg:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0 border-b-1 border-border-faint lg:border-r-1 lg:border-b-0">
          <DecisionCard
            eyebrow={copy.eyebrow}
            title={copy.title}
            headline={<Money amount={chf(total)} />}
            confidence={valuation.confidence}
            sampleSize={valuation.sampleSize}
            reasons={valuation.reasons}
            actions={
              <>
                <Button>
                  {mode === "trade-in" ? "Save appraisal" : "Add to inventory"}
                </Button>
                <Button href="/market" iconRight={<ArrowRightIcon size={14} />}>
                  See segment
                </Button>
              </>
            }
          />
        </div>

        {/* ------------------------------------------- Adjustment breakdown */}
        <div className="min-w-0 p-16 sm:p-24">
          <h2 className="text-label-x-large text-accent-black">
            How we get there
          </h2>

          <dl className="mt-16 flex flex-col">
            <div className="flex items-baseline justify-between gap-16 border-b-1 border-border-faint py-10">
              <dt className="text-body-medium text-black-alpha-72">
                {breakdown.basis.label}
              </dt>
              <dd className="tnum text-label-medium text-accent-black">
                <Money amount={breakdown.basis.amount} />
              </dd>
            </div>

            {breakdown.lines.map((line) => (
              <div
                key={line.label}
                className="flex items-baseline justify-between gap-16 border-b-1 border-border-faint py-10"
              >
                <dt className="flex min-w-0 flex-col">
                  <span className="text-body-medium text-black-alpha-72">
                    {line.label}
                  </span>
                  {line.note ? (
                    <span className="text-body-small text-black-alpha-40">
                      {line.note}
                    </span>
                  ) : null}
                </dt>
                {/*
                  Neutral ink: these are arithmetic, not a verdict. The sign
                  carries the direction, and colouring deductions red would
                  read as "bad" when it is just how the number is built.
                */}
                <dd className="tnum text-label-medium text-accent-black">
                  <Money amount={line.amount} signed />
                </dd>
              </div>
            ))}

            <div className="flex items-baseline justify-between gap-16 py-12">
              <dt className="text-label-medium text-accent-black">
                {copy.eyebrow}
              </dt>
              <dd className="tnum text-title-h5 text-accent-black">
                <Money amount={chf(total)} />
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-body-small text-black-alpha-48">
            {mode === "retail"
              ? "Retail builds up from the segment median. Switch mode to see reconditioning, margin and risk deducted from it."
              : "Deducted from retail value. Import duty, VAT and transport join this list when sourcing from Germany."}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ Distribution */}
      <section className="grid grid-cols-1 border-b-1 border-border-faint bg-accent-white lg:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0 border-b-1 border-border-faint p-16 sm:p-24 lg:border-r-1 lg:border-b-0">
          <h2 className="text-label-x-large text-accent-black">
            Where this car sits
          </h2>
          <p className="mt-2 text-body-medium text-black-alpha-48">
            412 comparable Swiss listings, last 90 days
          </p>
          <DistributionChart
            className="mt-24"
            buckets={valuation.distribution}
            marker={valuation.retail.value}
          />
        </div>

        <div className="grid min-w-0 grid-cols-2">
          <div className="flex flex-col gap-6 border-r-1 border-b-1 border-border-faint p-16 sm:p-24">
            <span className="text-label-x-small text-black-alpha-56">
              Days to sell
            </span>
            <span className="tnum text-title-h4 text-accent-black">
              {valuation.daysToSell}d
            </span>
            <span className="text-body-small text-black-alpha-48">
              Segment average 35d
            </span>
          </div>
          <div className="flex flex-col gap-6 border-b-1 border-border-faint p-16 sm:p-24">
            <span className="text-label-x-small text-black-alpha-56">
              Segment 30d
            </span>
            <span className="text-title-h4">
              <TrendDelta value={-0.042} goodWhen="up" />
            </span>
            <span className="text-body-small text-black-alpha-48">
              Softening — price against current comps
            </span>
          </div>
          <div className="col-span-2 flex flex-col gap-6 p-16 sm:p-24">
            <span className="text-label-x-small text-black-alpha-56">
              Supply
            </span>
            <span className="tnum text-title-h4 text-accent-black">412</span>
            <span className="text-body-small text-black-alpha-48">
              Active listings in Switzerland
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Comparables */}
      <section className="bg-accent-white">
        <div className="flex items-center justify-between gap-16 border-b-1 border-border-faint p-16 sm:p-24">
          <div>
            <h2 className="text-label-x-large text-accent-black">
              Comparable listings
            </h2>
            <p className="mt-2 text-body-medium text-black-alpha-48">
              The five closest matches driving this valuation
            </p>
          </div>
          <Button size="small" href="/sourcing">
            See all
          </Button>
        </div>
        <DataTable
          columns={compColumns}
          rows={valuation.comparables}
          getRowKey={(row) => row.id}
        />
      </section>
    </AppShell>
  );
}
