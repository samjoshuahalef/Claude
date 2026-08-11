# AutoFlair — product architecture

The committed reference for how AutoFlair's capabilities are grouped and
navigated. `DESIGN.md` covers the visual language; this covers the product.

## Context

We have a Firecrawl-quality design system (`DESIGN.md`) and one reference screen. But we
ported Firecrawl's **information architecture** along with its design language, and only the
language transfers.

`Overview / Playground / Extract / Activity Logs / Usage / API Keys` is a developer-API nav:
its user is a developer testing endpoints. AutoFlair's user is a dealer deciding what to buy
and what to pay. Every nav item except Overview and Settings has to go.

The design language stays exactly as built. This is a nav and page-composition change.

The risk to design against: nine stated capabilities becoming nine nav items. That produces a
toolbox — nine places to go, none of which know about each other. Several of the nine are the
same surface under a different lens, and two are not destinations at all.

## Decisions taken

- **Trade-in is a mode inside Valuation**, not a section.
- **Switzerland at launch, but country-aware from day one.** CH-only surfaces; country modelled
  on the data and components now so the DE lens is additive rather than a refactor.
- **Inventory ingestion is undecided.** Section is phase 4, designed behind a strong empty
  state; the ingestion path (CSV / DMS / manual) is chosen later.
- **The Advisor is ambient only** — `⌘K` and a context panel, no nav item.

---

## The collapse: 9 capabilities → 6 sections

| Capability | Home |
|---|---|
| Market intelligence & exploration | **Market** — segment pages |
| Market trends | **Market** — landing is the movers board; time is a lens on segment pages |
| Vehicle valuation | **Valuation** — Retail mode |
| Trade-in evaluation | **Valuation** — Trade-in mode |
| Deal / opportunity finder | **Sourcing** |
| Inventory intelligence | **Inventory** |
| Watchlists and alerts | **Watchlists** — tabs: Watches, Alert feed |
| AI Advisor | *Not a section* — ambient, on every page |
| DE → CH import | *Not a section* — a lens across Valuation, Sourcing, Market |

### Why these merges

**Valuation absorbs trade-in.** Both start from one input — VIN/plate or spec + mileage +
condition — and differ only in what they do with the answer. Trade-in is retail value minus
reconditioning, minus target margin, adjusted for days-to-sell risk. Same engine, extra
inputs, different framing. Splitting them means a dealer enters the same car twice, which is
the fastest way to lose their trust in the tool. Mitigation for the buried-flow risk:
prominent mode tabs, plus a "New appraisal" quick action on Overview that deep-links to
Trade-in mode.

**Market absorbs trends.** Trends are not a separate dataset, they are the time axis on the
market data. Market's landing page *is* the trends view — what is heating and cooling across
segments you care about. Drilling into a segment gives price distribution, supply, days-to-
sell, and the trend line for that segment. A separate Trends page would be the same charts
with no segment context.

**Watchlists absorbs alerts.** A watch is a saved query plus a notification rule. One
mechanism: watch a model from Market, watch a search from Sourcing, watch a unit from
Inventory. All firings land in one feed. The topbar bell we already built is the quick access;
the section is where you manage what you track.

### The two that are not sections

**AI Advisor.** As a nav item it becomes a dead chatbot page — users visit once, ask a vague
question, get a vague answer, never return. It should be ambient and context-carrying:

- The sidebar `⌘K` field we already built becomes **"Search or ask anything."**
- On a segment page it knows the segment; on a valuation it knows the vehicle; in Sourcing it
  knows the active filters.
- It answers with product surfaces where it can — rendering a comps table or a trend chart
  inline, not just prose.

Discoverability is the real cost of ambient-only, so Overview carries a visible ask input.

**Germany → Switzerland import.** A lens, not a destination. It surfaces as a landed-cost
toggle in Valuation (duty, VAT, transport, homologation), a source filter plus landed-cost
column in Sourcing, and a DE-vs-CH price delta on segment pages. Building it as a section
would duplicate all three surfaces. Built as a lens, it is mostly additive columns when it
ships — and it belongs under **Sourcing**, since importing is a sourcing channel.

*Country-aware foundation (ship in phase 1, inert while CH-only):* `country` is a field on
vehicle, listing and segment, not an afterthought. `Money` carries a currency rather than
assuming CHF. Market and Sourcing queries take a market/region parameter that today is always
`CH`. Valuation exposes a **cost-adjustment pipeline** — recon, transport, duty, VAT — where
the import adjustments are simply additional entries that are empty for a domestic car. Doing
this now costs little; retrofitting currency and landed cost through every surface later is
the expensive version.

---

## Navigation

```
Overview       decision inbox — what changed, what to act on
Market         explore segments, trends, price distributions
Valuation      price any vehicle · Retail / Trade-in / Buy target
Sourcing       undervalued listings, saved searches, (later) DE import
Inventory      your stock, market position, recommended actions
Watchlists     what you track + alert feed
──────────
Settings       team, plan & usage, integrations, API keys
```

Six plus Settings. `Usage` and `API Keys` become Settings subsections — they are account
administration, not daily work.

**Overview stops being a stats dashboard and becomes a decision inbox.** Ranked by what needs
attention: new deals matching saved searches, price drops on watched models, stock aging past
threshold, valuations awaiting review. Plus the ask input and quick actions. A dealer should
be able to open it and know their day in ten seconds.

---

## What makes it a system rather than six tools

The connective tissue matters more than the section list:

1. **One vehicle identity.** A car entered anywhere is the same object in Valuation, Trade-in
   and Inventory. Never enter it twice.
2. **Every model links to its Market page** — from a listing, a stock unit, a valuation result.
   The segment page is the product's most-linked destination.
3. **Every list can become a watch.** Saved search → watch → alert is one mechanism, not three.
4. **Every number can be explained.** Click any valuation → comps used, adjustments applied,
   confidence. This is the trust layer, and it is where the Advisor plugs in most naturally.
5. **Every screen can be asked about.** The ask bar carries page context.

### Resurrect two deleted concepts

`DecisionCard` and `ConfidenceMeter` (removed in this session, recoverable at `3c95d87`) were
the right idea in the wrong visual language. A recommendation with **a confidence value and
its reasons** is exactly the pattern an advisory product needs — an unexplained number from a
valuation engine does not get trusted, and does not get used. Rebuild both in the Firecrawl
language as first-class primitives.

---

## Design system extensions

Additions to `DESIGN.md`, all consistent with what exists:

**Density.** Firecrawl's dashboard is airy — 40px rows, 24px padding. A dealer scanning 200
listings needs a compact mode: 36px comfortable / 32px compact rows, 12px cell padding,
`body-small`. Numeric columns need `font-variant-numeric: tabular-nums` and mono so digits
align down the column. This is the single biggest gap between what we built and what the
product needs.

**One new colour rule: heat never encodes data.** `#fa5d19` is brand and action. Market
position uses `accent-forest` / `accent-honey` / `accent-crimson`. Scoring a deal in orange
would make it read as a button and would break the one-saturated-heat-per-view budget that
gives the design its calm.

**New primitives** (`web/src/components/fc/`):

| Primitive | For |
|---|---|
| `DataTable` | listings, comps, inventory — sortable, hairline grid, density modes |
| `FilterBar` | make/model/year/mileage/price/region chips + popovers |
| `TrendDelta` | `+4.2% ▲` in semantic colour |
| `DistributionChart` | price histogram with your-vehicle marker |
| `Sparkline` | in-row trend |
| `StatTile` | headline metric + delta |
| `DecisionCard`, `ConfidenceMeter` | recommendation + confidence + reasons |
| `VehicleHeader` | vehicle identity across Valuation/Inventory |
| `Money` | currency-aware formatting, tabular — takes a currency, defaults CHF |
| `AskPanel` | ambient advisor |
| `EmptyState` | pre-data onboarding — carries Inventory until ingestion is decided |

Existing `AreaChart`, `Card`, `Badge`, `Tag`, `SegmentedTabs`, `GridFrame`, `Input`, `Button`
all carry over unchanged. Load the `dataviz` skill before building any chart primitive.

---

## Phasing

Valuation is the atom — deals are listings scored against value, inventory intelligence is
valuation applied to your stock, trends are valuation aggregated over time. Build it first.

1. **Shell + Overview + Valuation** — rebrand AppShell to AutoFlair, replace nav, decision
   inbox, valuation with Retail/Trade-in modes, confidence + reasons, the cost-adjustment
   pipeline, currency-aware `Money`. Thin ask bar from day one.
2. **Market** — movers board, segment pages, distributions.
3. **Sourcing + Watchlists** — they share the query/filter engine, so build together.
4. **Inventory** — ships as the section shell plus its empty state, so the nav is complete and
   the value is legible before ingestion exists. Real data lands once CSV / DMS / manual is
   chosen; that decision does not block anything before it.
5. **Advisor depth**, then **DE → CH lens** switched on over the phase-1 country foundation.

---

## Files

- `web/src/components/fc/Sidebar.tsx` — `NavKey` union and nav items; AutoFlair wordmark
- `web/src/components/fc/AppShell.tsx`, `Topbar.tsx` — rebrand; bell → alert feed
- `web/src/app/page.tsx` — Overview becomes the decision inbox
- New routes — `market/`, `valuation/`, `sourcing/`, `inventory/`, `watchlists/`, `settings/`
- New primitives — as tabled above, in `web/src/components/fc/`
- `web/src/app/globals.css` — density tokens, tabular numerals
- `web/src/app/layout.tsx` — metadata
- `DESIGN.md` — density, colour rule, new primitives
- `PRODUCT.md` (new) — this IA as the committed reference

Keep the Firecrawl Overview at an unlinked `/reference/firecrawl` route. It is our calibration
target — being able to diff new screens against a known-faithful one is worth one dead route.

## Verification

- `next build` and `eslint` clean.
- Render each new route headless at 1440 / 768 / 390 and confirm
  `document.documentElement.scrollWidth` equals the viewport at each.
- Diff a new screen against `/reference/firecrawl` for hairline grid, type scale and heat
  budget — no view should have more than one saturated heat fill.
- Walk one end-to-end path in the browser: Overview → a flagged deal → its segment page →
  valuation → save as watch → confirm it appears in Watchlists.
