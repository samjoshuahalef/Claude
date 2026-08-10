import { getWorkspace } from "@/lib/data/workspace";
import { Money, Percent } from "@/components/ui/Figure";
import { Bullet, Magnitude } from "@/components/viz/Bullet";
import { StockMatrix } from "@/components/viz/StockMatrix";
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

  // Bars are scaled to the fleet, not to an absolute, so the comparison the
  // dealer makes is between their own cars.
  const maxAge = Math.max(...stock.map((r) => r.daysInStock), 120);
  const maxGain = Math.max(...stock.map((r) => r.valueOfActing), 1);

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

        <section className="panel">
          <header className="panel__head">
            <h2 className="t-h2">Where your capital is sitting</h2>
            <span className="t-xs">Days in stock against return on capital</span>
          </header>
          <div className="panel__body">
            <StockMatrix stock={stock} />
          </div>
        </section>

        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Mileage</th>
                  <th scope="col">
                    Age
                    <span className="th-axis" aria-hidden>
                      <span>0</span>
                      <span>60</span>
                      <span>90+</span>
                    </span>
                  </th>
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
                      <td className="td-num" data-label="Mileage">{formatKm(review.item.vehicle.mileageKm)}</td>
                      <td data-label="Age" className="td-age">
                        <span className="cell-viz">
                          <span className="cell-viz__num">{review.daysInStock}d</span>
                          <Bullet
                            value={review.daysInStock}
                            max={maxAge}
                            thresholds={[60, 90]}
                            tone={
                              review.daysInStock >= 90
                                ? "neg"
                                : review.daysInStock >= 60
                                  ? "warn"
                                  : "calm"
                            }
                            label={`${review.daysInStock} days in stock`}
                          />
                        </span>
                      </td>
                      <td className="td-num" data-label="Paid">
                        <Money value={review.item.acquisitionPrice} showCode={false} />
                      </td>
                      <td className="td-num" data-label="Asking">
                        <Money value={review.item.currentAskingPrice} showCode={false} />
                      </td>
                      <td className="td-num" data-label="Return now">
                        <Percent value={review.holding.annualisedReturn} />
                      </td>
                      <td data-label="Recommendation">
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
                      <td className="td-num" data-label="After acting">
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
                      <td data-label="Gain from acting" className="td-num">
                        {review.valueOfActing === 0 ? (
                          <span className="td-null">—</span>
                        ) : (
                          <span className="cell-viz cell-viz--end">
                            <span className="cell-viz__num t-strong">
                              <Money value={review.valueOfActing} showCode={false} />
                            </span>
                            <Magnitude
                              value={review.valueOfActing}
                              max={maxGain}
                              tone={review.action === "exit" ? "neg" : "warn"}
                            />
                          </span>
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
          <div className="panel">
            <dl className="grounds">
              {stock
                .filter((review) => review.action !== "hold")
                .map((review) => (
                  <div className="grounds__row" key={review.item.id}>
                    <dt className="grounds__subject">
                      {review.item.vehicle.make} {review.item.vehicle.model}
                    </dt>
                    {/* Sentences, not statuses. Rendering them as pills forced
                        nowrap on running prose, which overflowed a phone and
                        spent the pill shape — a shape that should mean "state" —
                        on an explanation. */}
                    <dd className="grounds__reasons">
                      {review.grounds.map((ground) => ground.message).join(" · ")}
                    </dd>
                  </div>
                ))}
            </dl>
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
