import { getWorkspace } from "@/lib/data/workspace";
import { Money } from "@/components/ui/Figure";

/**
 * Performance.
 *
 * This screen is deliberately mostly empty, and that is the point.
 *
 * Autoflair has made recommendations but no dealer has yet confirmed a purchase
 * or a sale against them, so there is nothing realised to report. The temptation
 * — the one every tool in this category gives in to — is to add up estimated
 * upside and present it as value delivered. That number would be impressive,
 * checkable by nobody, and worthless.
 *
 * So the four money states stay separate: estimated, realised, confirmed,
 * attributed. Estimated money is not realised money. Potential money is not
 * money saved. The screen fills up as outcomes come back, and not before.
 */

interface MoneyState {
  key: string;
  label: string;
  definition: string;
  available: boolean;
}

export default async function PerformancePage() {
  const { summary, stock } = await getWorkspace();

  const recommendationsMade = stock.filter((review) => review.action !== "hold").length;

  const states: MoneyState[] = [
    {
      key: "estimated",
      label: "Estimated",
      definition: "What the model projects if every recommendation is followed",
      available: true,
    },
    {
      key: "realised",
      label: "Realised",
      definition: "Gross profit on cars actually sold, from your own sale prices",
      available: false,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      definition: "Realised profit on cars where you told us you acted on the advice",
      available: false,
    },
    {
      key: "attributed",
      label: "Attributed",
      definition: "The share of that profit the recommendation can be credited with",
      available: false,
    },
  ];

  return (
    <>
      <header className="topbar">
        <div className="topbar__title">
          <h1 className="t-h1">Performance</h1>
          <span className="t-xs">Was the advice any good?</span>
        </div>
      </header>

      <div className="page stack-6">
        <p style={{ fontSize: 16, lineHeight: 1.5, margin: 0, maxWidth: "72ch" }}>
          <span className="t-strong">{recommendationsMade} open recommendations</span>, worth an
          estimated{" "}
          <span className="t-strong">
            <Money value={summary.opportunity} />
          </span>
          . None have been confirmed as acted on yet, so nothing here is realised.
        </p>

        <div className="metrics">
          {states.map((state) => (
            <div className="metric" key={state.key}>
              <span className="metric__label">{state.label}</span>
              <span className="metric__value metric__value--sm">
                {state.available ? (
                  <Money value={summary.opportunity} />
                ) : (
                  <span className="td-null">—</span>
                )}
              </span>
              <span className="metric__sub">{state.definition}</span>
            </div>
          ))}
        </div>

        <section className="panel">
          <header className="panel__head">
            <h2 className="t-h2">Accuracy</h2>
            <span className="t-xs">Fills in as cars sell</span>
          </header>
          <div className="empty">
            <p className="t-strong">No completed outcomes yet.</p>
            <p className="t-sm" style={{ maxWidth: "56ch" }}>
              Once you record what a car actually sold for and when, this compares it against what
              Autoflair predicted — sale price error, days-to-sale error, and estimated versus
              realised margin. Until then there is nothing honest to show.
            </p>
          </div>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2 className="t-h2">Why this screen is empty</h2>
          </header>
          <div className="panel__body stack-3">
            <p className="t-body" style={{ maxWidth: "72ch" }}>
              Every tool in this category can produce a large number here by summing projected
              upside and calling it value delivered. Autoflair does not, because that figure cannot
              be checked and a dealer who discovers it is theoretical stops believing the rest of
              the product.
            </p>
            <p className="t-body" style={{ maxWidth: "72ch" }}>
              The four states above never mix. Estimated money is not realised money. Realised money
              is not attributable money. When the numbers do appear they will be arithmetic on your
              own invoices, and you will be able to click any of them and see the cars behind it.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
