import Link from "next/link";
import { getWorkspace } from "@/lib/data/workspace";
import { Money, Percent } from "@/components/ui/Figure";
import { Magnitude } from "@/components/viz/Bullet";
import { Severity } from "@/components/viz/Severity";
import { formatKm } from "@/lib/format";
import type { StockAction, StockRecommendation } from "@/lib/engine/stock";
import type { Opportunity } from "@/lib/engine/sourcing";

/**
 * Today.
 *
 * The screen a dealer opens in the morning. It answers one question — what
 * needs my attention — and it is deliberately a queue rather than a dashboard.
 * Charts live further down the product; a decision tool that opens with a chart
 * is a reporting tool.
 *
 * Rows are ranked by money at stake, not by date, because that is the order in
 * which a dealer should spend the next hour.
 */

const ACTION_COPY: Record<StockAction, { label: string; tone: string }> = {
  reduce: { label: "Reduce", tone: "neg" },
  reprice: { label: "Reprice", tone: "warn" },
  exit: { label: "Exit", tone: "neg" },
  investigate: { label: "Investigate", tone: "warn" },
  hold: { label: "Hold", tone: "calm" },
};

export default async function TodayPage() {
  const { stock, summary, opportunities } = await getWorkspace();

  const actions = stock.filter((review) => review.action !== "hold");
  const topOpportunities = opportunities.slice(0, 5);
  const opportunityValue = topOpportunities.reduce((sum, o) => sum + o.projectedGross, 0);

  // Bars are scaled to the largest item in each list, so length ranks the queue
  // before a single figure is read.
  const maxStake = Math.max(...actions.map((a) => a.valueOfActing), 1);
  const maxGross = Math.max(...topOpportunities.map((o) => o.projectedGross), 1);

  return (
    <>
      <header className="topbar">
        <div className="topbar__title">
          <h1 className="t-h1">Today</h1>
          <span className="t-xs">Sunday, 10 August</span>
        </div>
        <span className="provenance">
          <span className="provenance__dot" aria-hidden />
          Demonstration market — synthetic listings
        </span>
      </header>

      <div className="page stack-8">
        {/* The whole product's value proposition, rendered as one sentence. */}
        <p style={{ fontSize: 16, lineHeight: 1.5, margin: 0, maxWidth: "72ch" }}>
          {actions.length === 0 ? (
            <>Your stock is priced where it should be. </>
          ) : (
            <>
              <span className="t-strong">{actions.length} cars</span> need a price decision, worth{" "}
              <span className="t-strong">
                <Money value={summary.opportunity} />
              </span>{" "}
              of capital productivity.{" "}
            </>
          )}
          {topOpportunities.length > 0 && (
            <>
              <span className="t-strong">{topOpportunities.length} cars</span> on the buying
              channels clear your ceiling, together projecting{" "}
              <span className="t-strong">
                <Money value={opportunityValue} />
              </span>{" "}
              of gross.
            </>
          )}
        </p>

        <div className="metrics">
          <Metric
            label="Capital in stock"
            value={<Money value={summary.capital} />}
            sub={`${summary.vehicles} vehicles`}
          />
          <Metric
            label="Average return"
            value={<Percent value={summary.averageReturn} />}
            sub="Annualised, at current prices"
          />
          <Metric
            label="Average age"
            value={<span className="num">{summary.averageDaysInStock}d</span>}
            sub={`${summary.aged} over 60 days`}
          />
          <Metric
            label="Capital needing action"
            value={<Money value={summary.atRisk} />}
            sub={`${actions.length} of ${summary.vehicles} vehicles`}
          />
        </div>

        <section>
          <div className="section__head">
            <h2 className="t-h2">Your stock needs a decision</h2>
            <Link href="/stock" className="btn btn--quiet btn--sm">
              All stock →
            </Link>
          </div>

          <div className="panel">
            {actions.length === 0 ? (
              <div className="empty">
                <p className="t-strong">Nothing needs repricing.</p>
                <p className="t-sm">Every car is within its target return.</p>
              </div>
            ) : (
              <div className="queue">
                <div className="queue__header" aria-hidden>
                  <span />
                  <span>Vehicle</span>
                  <span>Recommendation</span>
                  <span style={{ textAlign: "right" }}>Current price</span>
                  <span style={{ textAlign: "right" }}>Gain from acting</span>
                </div>
                {actions.map((review) => (
                  <StockQueueRow
                    key={review.item.id}
                    review={review}
                    maxStake={maxStake}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="section__head">
            <h2 className="t-h2">Worth buying</h2>
            <span className="t-xs">Auction and trade channels · ranked by return on capital</span>
          </div>

          <div className="panel">
            {topOpportunities.length === 0 ? (
              <div className="empty">
                <p className="t-strong">Nothing clears your ceiling today.</p>
                <p className="t-sm">
                  Every lot on the buying channels is priced above what you can pay and still make
                  your margin.
                </p>
              </div>
            ) : (
              <div className="queue">
                <div className="queue__header" aria-hidden>
                  <span />
                  <span>Vehicle</span>
                  <span>Why it qualifies</span>
                  <span style={{ textAlign: "right" }}>Asking</span>
                  <span style={{ textAlign: "right" }}>Projected gross</span>
                </div>
                {topOpportunities.map((opportunity) => (
                  <OpportunityQueueRow
                    key={opportunity.listing.id}
                    opportunity={opportunity}
                    maxGross={maxGross}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="metric">
      <span className="metric__label">{label}</span>
      <span className="metric__value">{value}</span>
      <span className="metric__sub">{sub}</span>
    </div>
  );
}

function StockQueueRow({
  review,
  maxStake,
}: {
  review: StockRecommendation;
  maxStake: number;
}) {
  const copy = ACTION_COPY[review.action];
  const { vehicle } = review.item;
  const aged = review.daysInStock >= 90;

  return (
    <Link href="/stock" className="queue__row">
      <Severity tone={copy.tone as "neg" | "warn" | "pos"} label={copy.label} />

      <span className="stack-2">
        <span className="queue__title">
          {vehicle.make} {vehicle.model}
        </span>
        <span className="queue__sub">
          {vehicle.derivative} · {formatKm(vehicle.mileageKm)} ·{" "}
          <span className={aged ? "t-neg" : undefined}>{review.daysInStock}d in stock</span>
        </span>
      </span>

      <span className="stack-2">
        <span className={`pill pill--${copy.tone}`} style={{ alignSelf: "flex-start" }}>
          <span className="pill__dot" aria-hidden />
          {copy.label}
        </span>
        <span className="queue__sub">
          {(review.grounds.find((g) => g.key !== "aged") ?? review.grounds[0])?.message}
        </span>
      </span>

      <span className="stack-2 queue__num">
        <span className="pricemove" style={{ justifyContent: "flex-end" }}>
          <span className="pricemove__from">
            <Money value={review.item.currentAskingPrice} showCode={false} />
          </span>
          <span className="pricemove__arrow" aria-hidden>
            →
          </span>
          <span className="pricemove__to">
            <Money value={review.recommended.price} showCode={false} />
          </span>
        </span>
        <span className="queue__sub">
          {review.action === "exit" ? (
            <>
              result <Money value={review.recommended.grossProfit} showCode={false} />
            </>
          ) : (
            <>
              <Percent value={review.holding.annualisedReturn} /> →{" "}
              <Percent value={review.recommended.annualisedReturn} />
            </>
          )}
        </span>
      </span>

      <span className="stack-2 queue__num">
        <span className="queue__stake">
          <Money value={review.valueOfActing} />
        </span>
        <Magnitude value={review.valueOfActing} max={maxStake} tone={copy.tone as "neg" | "warn"} />
      </span>
    </Link>
  );
}

function OpportunityQueueRow({
  opportunity,
  maxGross,
}: {
  opportunity: Opportunity;
  maxGross: number;
}) {
  const { vehicle } = opportunity.listing;

  return (
    <Link href="/appraise" className="queue__row">
      <Severity tone="pos" label="Worth buying" />

      <span className="stack-2">
        <span className="queue__title">
          {vehicle.make} {vehicle.model}
        </span>
        <span className="queue__sub">
          {vehicle.derivative} · {formatKm(vehicle.mileageKm)} ·{" "}
          {channelLabel(opportunity.listing.sellerType)} · {opportunity.listing.region}
        </span>
      </span>

      <span className="stack-2">
        <span className="pill pill--pos" style={{ alignSelf: "flex-start" }}>
          <span className="pill__dot" aria-hidden />
          <Money value={opportunity.headroom} showCode={false} /> under ceiling
        </span>
        <span className="queue__sub">
          Sells in ~{opportunity.expectedDaysToSale}d at{" "}
          <Money value={opportunity.expectedRetailPrice} showCode={false} />
        </span>
      </span>

      <span className="stack-2 queue__num">
        <span className="pricemove" style={{ justifyContent: "flex-end" }}>
          <span className="pricemove__to">
            <Money value={opportunity.askingPrice} showCode={false} />
          </span>
        </span>
        <span className="queue__sub">
          ceiling <Money value={opportunity.ceiling} showCode={false} />
        </span>
      </span>

      <span className="stack-2 queue__num">
        <span className="queue__stake queue__stake--pos">
          <Money value={opportunity.projectedGross} />
        </span>
        <Magnitude value={opportunity.projectedGross} max={maxGross} tone="pos" />
      </span>
    </Link>
  );
}

function channelLabel(seller: string): string {
  if (seller === "auction") return "Auction";
  if (seller === "trade") return "Trade";
  if (seller === "private") return "Private";
  return "Dealer";
}
