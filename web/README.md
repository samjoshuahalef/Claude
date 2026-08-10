# Autoflair

Acquisition intelligence for professional car dealers. Switzerland first.

The product answers one question at a time, with a number attached. The first
one is the highest-stakes decision a dealer makes: **what is the most I should
pay for this car?**

## The shape of the thing

```
src/lib/engine/     pure, deterministic decision engine — no clock, no network
src/lib/data/       MarketDataSource: the only door market data comes through
src/components/     the interface onto the engine
scripts/            verification against a market whose true parameters we know
```

### The engine is pure

`appraise()` is a pure function of `(subject, dealer economics, comparables,
valuation date)`. It never reads a clock or a network, and it contains no
randomness. That is not stylistic — it is what lets a recommendation made today
be replayed in six months against what the car actually sold for. Scoring our
own past advice is the foundation of the outcome loop, and it is impossible if
the same inputs can produce two answers.

Run `npm run verify` to check it. The suite appraises against a synthetic market
whose generating parameters are known, and asserts that:

- the fitted mileage coefficient and median time-to-sale recover the true values
- paying the ceiling yields **exactly** the target gross profit, no more
- the displayed bridge reconciles to the displayed headline, to the franc
- higher prices never sell faster and never earn less at a fixed purchase price
- identical inputs produce byte-identical output
- a car with no comparables gets a refusal, not a guess

### Money is integer Rappen

Never floats. A bridge with eight lines accumulates float error, and a ceiling
two rappen off is a ceiling a dealer stops trusting.

Number formatting is done by hand rather than through `Intl`, because Node's ICU
and the browser's disagree on the Swiss thousands separator — one emits `'`, the
other `’`. That produced a hydration mismatch on every price on the page, and
more importantly it meant the same appraisal rendered differently depending on
where it was formatted.

### Data supply is abstracted on purpose

Everything external enters through `MarketDataSource`. Autoflair's data supply
*will* change — observed today, licensed tomorrow, dealer-consented at scale —
and each of those has to be a new implementation of that interface, never a
change to the engine. `Provenance` travels with the data because where a listing
came from governs whether we may show it, derive saleable figures from it, or
put it in a customer-facing audit trail.

The bundled `SyntheticSwissMarketSource` is marked `derived` and labelled in the
UI as a demonstration market. It must never be presented as observed evidence.

### Refusing is a feature

`AppraisalResult` is a union. When comparables are too few, too dispersed or too
stale, the engine returns `status: "insufficient"` with reasons and remedies,
and the UI shows no number at all. A dealer who is confidently misled once stops
using the software permanently, so a visible "we don't know" is the cheaper
outcome.

### The explanation is arithmetic, not prose

The retail-to-ceiling bridge is eight signed lines that sum to the headline. A
dealer can check it against the back of an envelope in fifteen seconds, and
every line traces to an input they control. No generated paragraph earns the
same trust.

## Swiss specifics encoded

- VAT at 8.1%, with the notional input tax deduction that replaced margin
  taxation in 2018. Purchase price is solved for rather than subtracted, because
  the tax depends on it: `P = S − (C + G) / (1 − k)`.
- Prices round **down** to the nearest CHF 100 for a ceiling — rounding a limit
  upward hands the dealer permission we did not calculate.
- Retail estimates snap to the 900-ending prices Swiss dealers actually list at.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run verify   # engine checks
npm run build
```
