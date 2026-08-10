import { getWorkspace } from "@/lib/data/workspace";
import { Money, Percent } from "@/components/ui/Figure";
import { formatKm } from "@/lib/format";
import type { StockAction } from "@/lib/engine/stock";

/**
 * Stock.
 *
 * Every car the dealer owns, with what to do about it. Sorted by the value of
 * acting rather than by age or price, because the point of the screen is to
 * order the next hour of work.
 *
 * The column that matters most is return on capital. Dealers instinctively
 * optimise absolute margin, and that instinct is what leaves CHF 3'000 sitting
 * in a car for four months when CHF 2'000 twice over would have been better.
 */

const ACTION: Record<StockAction, { label: string; tone: string }> = {
  reduce: { label: "Reduce", tone: "neg" },
  reprice: { label: "Reprice", tone: "warn" },
  exit: { label: "Exit", tone: "neg" },
  investigate: { label: "Investigate", tone: "warn" },
  hold: { label: "Hold", tone: "calm" },
};

export default async function StockPage() {
  const { stock, summary } = await getWorkspace();

  return (
    <>
      <header className="topbar">
        <div className="topbar__title">
          <h1 className="t-h1">Stock</h1>
          <span className="t-xs">
            {summary.vehicles} vehicles · <Money value={summary.capital} /> employed
          </span>
        </div>
      </header>

      <div className="page stack-6">
        <div className="metrics">
          <Tile label="Capital employed" value={<Money value={summary.capital} />} sub={`${summary.vehicles} vehicles`} />
          <Tile
            label="Average return"
            value={<Percent value={summary.averageReturn} />}
            sub="Annualised, at current prices"
          />
          <Tile
            label="Over 60 days"
            value={<span className="num">{summary.aged}</span>}
            sub={`Average age ${summary.averageDaysInStock} days`}
          />
          <Tile
            label="Upside from acting"
            value={<Money value={summary.opportunity} />}
            sub={`${summary.needingAction} vehicles`}
          />
        </div>

        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Mileage</th>
                  <th scope="col" style={{ textAlign: "right" }}>Age</th>
                  <th scope="col" style={{ textAlign: "right" }}>Paid</th>
                  <th scope="col" style={{ textAlign: "right" }}>Asking</th>
                  <th scope="col" style={{ textAlign: "right" }}>Return now</th>
                  <th scope="col">Recommendation</th>
                  <th scope="col" style={{ textAlign: "right" }}>After acting</th>
                  <th scope="col" style={{ textAlign: "right" }}>Gain from acting</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((review) => {
                  const action = ACTION[review.action];
                  return (
                    <tr key={review.item.id}>
                      <td className="td-strong">
                        {review.item.vehicle.make} {review.item.vehicle.model}{" "}
                        <span className="td-muted">{review.item.vehicle.derivative}</span>
                      </td>
                      <td className="td-num">{formatKm(review.item.vehicle.mileageKm)}</td>
                      <td className="td-num">{review.daysInStock}d</td>
                      <td className="td-num">
                        <Money value={review.item.acquisitionPrice} showCode={false} />
                      </td>
                      <td className="td-num">
                        <Money value={review.item.currentAskingPrice} showCode={false} />
                      </td>
                      <td className="td-num">
                        <Percent value={review.holding.annualisedReturn} />
                      </td>
                      <td>
                        <span className={`pill pill--${action.tone}`}>
                          <span className="pill__dot" aria-hidden />
                          {action.label}
                          {review.action !== "hold" && (
                            <>
                              {" "}
                              <Money value={review.recommended.price} showCode={false} />
                            </>
                          )}
                        </span>
                      </td>
                      <td className="td-num">
                        {review.action === "hold" ? (
                          <span className="td-null">—</span>
                        ) : review.action === "exit" ? (
                          <span className="t-neg">
                            <Money value={review.recommended.grossProfit} showCode={false} />
                          </span>
                        ) : (
                          <Percent value={review.recommended.annualisedReturn} />
                        )}
                      </td>
                      <td className="td-num">
                        {review.valueOfActing === 0 ? (
                          <span className="td-null">—</span>
                        ) : (
                          <Money value={review.valueOfActing} showCode={false} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <section className="stack-3">
          <h2 className="t-h2">Why these calls</h2>
          <div className="panel panel__body stack-3">
            {stock
              .filter((review) => review.action !== "hold")
              .map((review) => (
                <div key={review.item.id} className="row wrap" style={{ gap: "var(--s2)" }}>
                  <span className="t-sm t-strong" style={{ minWidth: 200 }}>
                    {review.item.vehicle.make} {review.item.vehicle.model}
                  </span>
                  {review.grounds.map((ground) => (
                    <span key={ground.key} className="pill pill--calm">
                      {ground.message}
                    </span>
                  ))}
                </div>
              ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Tile({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="metric">
      <span className="metric__label">{label}</span>
      <span className="metric__value metric__value--sm">{value}</span>
      <span className="metric__sub">{sub}</span>
    </div>
  );
}
