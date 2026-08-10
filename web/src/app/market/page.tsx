import { getWorkspace } from "@/lib/data/workspace";
import { Money, Percent } from "@/components/ui/Figure";

/**
 * Market.
 *
 * Every line here answers "so what". A market screen that reports supply is up
 * 18% has told a dealer nothing they can act on; one that says acquisition
 * prices for this model should come down has changed what they will pay this
 * afternoon. Movement without a consequence does not earn a row.
 */

interface Reading {
  tone: "pos" | "neg" | "warn" | "calm";
  consequence: string;
}

/**
 * Turn measurements into an instruction.
 *
 * Deliberately conservative: when supply, drift and liquidity disagree, we say
 * the market is steady rather than inventing a narrative out of noise.
 */
function readMarket(args: {
  supplyChange: number | null;
  drift: number | null;
  medianDays: number;
}): Reading {
  const { supplyChange, drift, medianDays } = args;

  if (supplyChange !== null && supplyChange > 0.25 && drift !== null && drift < -0.02) {
    return {
      tone: "neg",
      consequence: "Supply rising and prices falling — buy well below your usual ceiling",
    };
  }
  if (supplyChange !== null && supplyChange > 0.15) {
    return { tone: "warn", consequence: "More competition arriving — price to sell, not to hold" };
  }
  if (drift !== null && drift < -0.03) {
    return { tone: "warn", consequence: "Sellers are cutting — today's retail estimate will age fast" };
  }
  if (medianDays > 85) {
    return { tone: "warn", consequence: "Slow to clear — only buy with a wider margin" };
  }
  if (supplyChange !== null && supplyChange < 0 && medianDays < 60) {
    return { tone: "pos", consequence: "Tightening supply and quick sales — you can pay up a little" };
  }
  return { tone: "calm", consequence: "Steady — no change to how you should be buying" };
}

export default async function MarketPage() {
  const { markets } = await getWorkspace();

  return (
    <>
      <header className="topbar">
        <div className="topbar__title">
          <h1 className="t-h1">Market</h1>
          <span className="t-xs">What changed, and what it means for your buying</span>
        </div>
      </header>

      <div className="page stack-4">
        {markets.map((market) => {
          const supplyChange =
            market.supplyChange && market.supplyChange.previous > 0
              ? (market.supplyChange.current - market.supplyChange.previous) /
                market.supplyChange.previous
              : null;
          const reading = readMarket({
            supplyChange,
            drift: market.priceDrift,
            medianDays: market.medianDays,
          });

          return (
            <section className="panel" key={market.key}>
              <header className="panel__head">
                <h2 className="t-h2">{market.label}</h2>
                <span className={`pill pill--${reading.tone}`}>
                  <span className="pill__dot" aria-hidden />
                  {reading.consequence}
                </span>
              </header>

              <div className="decision__stats">
                <Stat
                  label="Market middle"
                  value={<Money value={market.medianPrice} />}
                  note="Retail, adjusted to the reference spec"
                />
                <Stat
                  label="Time to sell"
                  value={<span className="num">{market.medianDays}d</span>}
                  note="At the market middle"
                />
                <Stat
                  label="Live listings"
                  value={<span className="num">{market.liveListings}</span>}
                  note={
                    supplyChange === null
                      ? "No prior period"
                      : `${supplyChange > 0 ? "▲" : "▼"} ${Math.abs(supplyChange * 100).toFixed(0)}% in 30 days`
                  }
                  tone={supplyChange !== null && supplyChange > 0.15 ? "neg" : undefined}
                />
                <Stat
                  label="Asking prices"
                  value={
                    market.priceDrift === null ? (
                      <span className="td-null">—</span>
                    ) : (
                      <Percent value={market.priceDrift} decimals={1} />
                    )
                  }
                  note="Median move across live listings"
                  tone={market.priceDrift !== null && market.priceDrift < -0.02 ? "neg" : undefined}
                />
                <Stat
                  label="Observed sales"
                  value={<span className="num">{market.observedSales}</span>}
                  note="Sales the timing estimate is built on"
                />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  tone?: "pos" | "neg";
}) {
  return (
    <div className={`decision__stat${tone ? ` decision__stat--${tone}` : ""}`}>
      <span className="decision__stat-k">{label}</span>
      <span className="decision__stat-v">{value}</span>
      <span className="decision__stat-n">{note}</span>
    </div>
  );
}
