import { AppraisalWorkbench, type MarketBundle } from "@/components/appraisal/AppraisalWorkbench";
import { ThemeToggle } from "@/components/af/ThemeToggle";
import { DEMO_VEHICLES, SyntheticSwissMarketSource } from "@/lib/data/fixtures";

/**
 * The appraisal screen.
 *
 * Market data is fetched here, on the server, through `MarketDataSource` — the
 * same interface a licensed feed will implement. Swapping the synthetic source
 * for a real one is a change to this file and nothing else.
 */

/**
 * Fixed valuation date.
 *
 * The engine never reads a clock: every appraisal is a pure function of its
 * inputs, which is what lets a recommendation be replayed months later when we
 * check it against what the car actually sold for. In production this becomes
 * the request timestamp.
 */
const AS_OF = "2026-08-10";

export default async function AppraisalPage() {
  const source = new SyntheticSwissMarketSource();

  const bundles: MarketBundle[] = await Promise.all(
    DEMO_VEHICLES.map(async ({ label, vehicle }) => {
      const response = await source.fetchComparables({
        subject: vehicle,
        market: "CH",
        asOf: AS_OF,
        lookbackDays: 120,
      });
      return {
        label,
        vehicle,
        comparables: response.comparables,
        supplyChange: response.supplyChange,
      };
    }),
  );

  return (
    <div className="af-shell">
      <header className="af-topbar">
        <div className="af-brand">
          <span className="af-brand__mark" aria-hidden />
          Autoflair
        </div>

        <div className="af-topbar__meta">
          <div className="af-metaItem">
            <span className="af-metaItem__k">Market</span>
            <span className="af-metaItem__v">Switzerland</span>
          </div>
          <div className="af-metaItem">
            <span className="af-metaItem__k">Valued</span>
            <span className="af-metaItem__v af-num">10 Aug 2026</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="af-main">
        <div className="af-container">
          <div className="af-row af-row--between" style={{ flexWrap: "wrap", gap: "var(--af-4)" }}>
            <div className="af-stack-2">
              <p className="af-eyebrow">Acquisition</p>
              <h1 className="af-h1">What is the most you should pay?</h1>
            </div>
            <span className="af-provenance">
              <span className="af-provenance__dot" aria-hidden />
              Demonstration market — synthetic listings, not observed data
            </span>
          </div>

          <AppraisalWorkbench bundles={bundles} asOf={AS_OF} />
        </div>
      </main>
    </div>
  );
}
