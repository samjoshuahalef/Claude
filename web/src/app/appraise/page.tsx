import { AppraisalWorkbench } from "@/components/appraisal/AppraisalWorkbench";
import { getWorkspace } from "@/lib/data/workspace";

/**
 * Appraise.
 *
 * One question: what is the most I should pay. Market data is fetched here on
 * the server through `MarketDataSource`; every recomputation after that is
 * local and synchronous, so moving a slider redraws the decision with no
 * spinner. That immediacy is what makes it usable with a customer waiting.
 */
export default async function AppraisePage() {
  const { markets, catalogue, asOf } = await getWorkspace();

  return (
    <>
      <header className="topbar">
        <div className="topbar__title">
          <h1 className="t-h1">Appraise</h1>
          <span className="t-xs">What is the most you should pay?</span>
        </div>
        <span className="provenance">
          <span className="provenance__dot" aria-hidden />
          Demonstration market — synthetic listings
        </span>
      </header>

      <div className="page">
        <AppraisalWorkbench
          catalogue={catalogue}
          bundles={markets.map((market) => ({
            label: market.label,
            modelId: market.modelId,
            vehicle: market.vehicle,
            comparables: market.comparables,
            supplyChange: market.supplyChange,
          }))}
          asOf={asOf}
        />
      </div>
    </>
  );
}
