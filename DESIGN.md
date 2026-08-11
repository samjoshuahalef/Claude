# Firecrawl design system — implementation spec

The visual language for this app is a 1:1 port of Firecrawl's. Tokens are not
eyeballed from screenshots: they are taken from Firecrawl's own published
design system source — [`colors.json`][colors] and [`tailwind.config.ts`][tw]
in `firecrawl/open-scouts`, cross-checked against their
[`DESIGN_SYSTEM.md`][ds].

Everything below is live in `web/src/app/globals.css`. `web/src/app/page.tsx`
renders the Firecrawl dashboard Overview as the calibration reference — the
screen to diff against when the real product screens get built.

[colors]: https://github.com/firecrawl/open-scouts/blob/main/colors.json
[tw]: https://github.com/firecrawl/open-scouts/blob/main/tailwind.config.ts
[ds]: https://github.com/firecrawl/open-scouts/blob/main/DESIGN_SYSTEM.md

---

## 1. The one rule that breaks everything if you forget it

**Numeric utilities are literal pixels, not rem.**

```
p-24   = 24px padding      (not 6rem)
gap-16 = 16px gap          (not 4rem)
h-40   = 40px height       (not 10rem)
size-16 = 16x16px          (not 4rem)
```

Firecrawl does this by generating a 0–1000 pixel scale in their Tailwind
config. In Tailwind v4 the same result comes from one declaration:

```css
@theme { --spacing: 1px; }
```

Consequence: **never copy `h-9`, `size-4`, `p-1.5` from shadcn/ui or any other
Tailwind codebase.** `h-9` is a 9px-tall button here. Paste-in components must
have their sizing rewritten to pixels.

---

## 2. Color

### Heat — the brand orange, `#fa5d19`

| Token | Value | Where it is used |
|---|---|---|
| `heat-4` | `#fa5d190a` | What's New card fill, API-key field fill |
| `heat-8` | `#fa5d1914` | Active nav item fill, badge/tag fill |
| `heat-12` | `#fa5d191f` | — |
| `heat-16` | `#fa5d1929` | Borders on heat-tinted surfaces |
| `heat-20` | `#fa5d1933` | Text selection |
| `heat-40` | `#fa5d1966` | Focus-within border on inputs |
| `heat-90` | `#fa5d19e6` | — |
| `heat-100` | `#fa5d19` | Primary button, active nav text, links, live dot, chart stroke |

**Budget: one saturated heat fill per view.** On the Overview that is the
Upgrade button. Everything else that is "orange" is a 4–16% tint or heat text
on white. Heat is a pointing device, not a decoration — the moment a second
solid orange block appears, both stop reading as the action.

### Accents

`accent-black #262626` · `accent-white #ffffff` · `accent-amethyst #9061ff` ·
`accent-bluetron #2a6dfb` · `accent-crimson #eb3424` · `accent-forest #42c366` ·
`accent-honey #ecb730`

Note the near-black is `#262626`, never `#000`. Accents other than black/white
are for status only, never surfaces.

### Alpha ramps — how text hierarchy is actually built

Firecrawl does not maintain a grey palette for text. It layers `accent-black`
at fixed alphas:

| Token | Role |
|---|---|
| `black-alpha-88` | Code keys |
| `black-alpha-72` | Secondary body, user email |
| `black-alpha-64` | Inactive nav labels |
| `black-alpha-56` | Descriptions, subtitles |
| `black-alpha-48` | Card subtitles, placeholders |
| `black-alpha-40` | Icon default, axis labels, chevrons |
| `black-alpha-32` | Inactive segmented-tab icons |
| `black-alpha-24` | Resting external-link icons, line numbers |
| `black-alpha-4/5/8` | Hover fills, kbd chips, avatar squares |

Rule of thumb: **body text `56%`, labels `64%`, icons `40%`, full
`accent-black` only for the primary string in a block.**

### Surfaces and borders

| Token | Value | Role |
|---|---|---|
| `background-base` | `#f9f9f9` | App canvas |
| `background-lighter` | `#fbfbfb` | Hover fill on white cells |
| `accent-white` | `#ffffff` | Every card and content sheet |
| `border-faint` | `#ededed` | Default — nearly every border in the product |
| `border-muted` | `#e8e8e8` | — |
| `border-loud` | `#e6e6e6` | Hover borders, crosshair glyphs |

**There are no shadows on content surfaces.** Depth comes from the hairline
grid, not elevation. The only shadows in the system are a 1px hairline
(`0 1px 2px rgba(0,0,0,0.04)`) under white *buttons* and a heat glow under the
support bubble. Do not add card shadows.

---

## 3. Typography

Sans is **SuisseIntl**, which is commercially licensed and cannot ship here.
**Geist** stands in — same grotesk skeleton, near-vertical terminals, and
crucially it is variable, which the system needs because every label token is
weight **450**. Mono is **Geist Mono** and the ASCII fields use **Roboto
Mono**; both of those are Firecrawl's actual faces.

| Token | Size / line-height / tracking / weight |
|---|---|
| `text-title-h1` | 60 / 64 / −0.3 / 500 |
| `text-title-h2` | 52 / 56 / −0.52 / 500 |
| `text-title-h3` | 40 / 44 / −0.4 / 500 |
| `text-title-h4` | 32 / 36 / −0.32 / 500 |
| `text-title-h5` | 24 / 32 / −0.24 / 500 |
| `text-body-x-large` | 20 / 28 / −0.1 / 400 |
| `text-body-large` | 16 / 24 / 0 / 400 |
| `text-body-medium` | 14 / 20 / 0.14 / 400 |
| `text-body-small` | 13 / 20 / 0 / 400 |
| `text-body-input` | 15 / 24 / 0 / 400 |
| `text-label-x-large` | 20 / 28 / −0.1 / **450** |
| `text-label-large` | 16 / 24 / 0 / **450** |
| `text-label-medium` | 14 / 20 / 0 / **450** |
| `text-label-small` | 13 / 20 / 0 / **450** |
| `text-label-x-small` | 12 / 20 / 0 / **450** |
| `text-mono-medium` | 14 / 22 / 0 / 400 |
| `text-mono-small` | 13 / 20 / 0 / **500** |
| `text-mono-x-small` | 12 / 16 / 0 / 400 |

**Label vs body is not cosmetic.** Body tokens (400) are for prose that gets
read. Label tokens (450) are for UI strings that get scanned — nav items,
buttons, table headers, chips. Using body where a label belongs makes the UI
feel washed out; the reverse makes paragraphs feel shouty.

### Applied scale on the dashboard

Measured off the reference screenshots, not assumed:

- Page title (`Explore our endpoints`) → `title-h5` (24px)
- Page subtitle → `body-medium`
- Card/section heading (`API Key`, `Integrations`) → `label-x-large` (20px)
- Card subtitle (`Start scraping right away`) → `body-medium` @ `black-alpha-48`
- Headline metric (the `2`) → `title-h3` (40px)
- Nav items, buttons → `label-medium`
- Descriptions → `body-medium` @ `black-alpha-56`
- Anything technical — API keys, code, tags, axis labels, project titles →
  **mono**. Firecrawl uses mono as a semantic signal for "this is a machine
  value", not as a style flourish.

---

## 4. Radius, and the grid

`rounded-{0,2,4,6,8,10,12,14,16,20,24,32}` are literal pixels;
`rounded-full` = 999px.

- `rounded-4` — badges, tags, kbd chips, small avatars
- `rounded-6` — icon buttons, small buttons, inputs
- `rounded-8` — **the default**: cards, buttons, nav items, fields
- `rounded-10` — segmented-tab container
- `rounded-full` — status rings, the support bubble

### The graph-paper motif

This is the single most identifying thing about Firecrawl's UI, and it is easy
to miss: **content is not a stack of floating cards.** It is one white sheet
divided by 1px `border-faint` rules, inset 24px from the canvas with vertical
rules down both gutters. Sections are cells in that grid, including empty
rhythm bands that exist purely to keep the beat.

Intersections get a small crosshair (`<GridPlus />`, 9×9px, `border-loud`).
On the Playground the same idea scales up into a full dotted field
(`fc-graph-paper`, 96px pitch).

Practical rules:
- Reach for a shared rule before a bordered card. Two adjacent cards with a
  gap between them is *not* the house style.
- Cell padding is `p-24`; tight cells (integration rows) are `p-16`.
- Content column is `max-w-1200`.

---

## 5. Components

Sizes are fixed; do not improvise heights.

| Component | Spec |
|---|---|
| **Button** small / medium / large | `h-32 px-10 rounded-6` / `h-36 px-12 rounded-8` / `h-40 px-16 rounded-8`, `text-label-medium` |
| Button `primary` | `bg-heat-100` white text, hover `brightness-95` |
| Button `secondary` | White, `border-faint`, 1px hairline shadow, hover `background-lighter` + `border-loud` — the dashboard workhorse |
| Button `tertiary` | Transparent, `black-alpha-64`, hover `black-alpha-4` fill |
| **IconButton** | `size-32 rounded-6`, icon `black-alpha-56` |
| **Input** | `h-36 rounded-8`, white, `border-faint`, `focus-within:border-heat-40` |
| **Card** | White, `border-faint`, `rounded-8`, **no shadow** |
| **Badge** | `h-20 rounded-4 px-6`, `label-x-small` |
| **Tag** | `h-24 rounded-4 px-8`, mono, `heat-8` on `heat-100` |
| **Kbd** | `h-20 rounded-4 px-6`, mono, `black-alpha-5` |
| **Nav item** | `h-40 rounded-8 px-10 gap-10`; active = `heat-8` fill + `heat-100` text and icon |
| **SegmentedTabs** | `rounded-10` container on `background-lighter`; active chip white + hairline shadow; inactive neighbours separated by hairlines, not gaps |
| **Sidebar / Topbar** | 240px / 60px |
| Icons | 16px in UI, 20px for endpoint glyphs, stroke 1.4 |

Endpoint glyphs are **dot matrices**, not line icons — a 5×5 pixel grid per
endpoint. That plus the ASCII fields is what gives the product its
terminal-adjacent character.

---

## 6. Motion

Firecrawl's motion is short, eased-out, and almost entirely reserved for state
feedback. There is no page choreography, no parallax, no spring.

**Defaults, applied globally:**

```css
--default-transition-duration: 200ms;
--default-transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
```

That curve is the house easing — a gentle ease-in-out that starts moving
immediately. Use bare `transition`; do not hand-pick durations per element.

| Named animation | Spec | Use |
|---|---|---|
| `animate-fade-in` | 500ms ease-out, opacity 0→1 | Content arriving after fetch |
| `animate-fade-up` | 500ms ease-out, +10px → 0 | First paint of a results block |
| `animate-button-press` | 300ms, scale 1 → 0.9 → 1 | Deliberate press affordances |
| `animate-accordion-down/up` | 200ms ease-out | Disclosure |
| `animate-heat-pulse` | 2s infinite | Live status dots |
| `animate-screenshot-scroll` | 15s ease-in-out infinite | Long screenshot previews |
| `animate-selection-pulse-green` | 2s infinite | Element-picker selection |

**Interaction rules:**

- Hover on a cell or row → background shift only (`background-lighter` or
  `black-alpha-4`). No lift, no scale, no shadow change.
- Hover on a link/cell that leads somewhere → its icon goes `heat-100`, and a
  directional arrow may translate 2px. This is the one piece of decorative
  motion in the system, and it is 2 pixels.
- Press → `active:scale-[0.98]`. (`animate-button-press` at 0.9 is much
  stronger; keep it for deliberate one-shot affordances.)
- Focus → `2px solid heat-100`, `outline-offset: 1px`. Never remove it.
- Loading → 700ms linear spinner, or skeletons in `black-alpha-4`.

Durations longer than 500ms are for ambient loops only. If a state change
takes longer than 200ms, it is too slow.

`prefers-reduced-motion: reduce` collapses every animation and transition to
0.01ms globally — already wired in `globals.css`. Ambient loops
(`heat-pulse`, `screenshot-scroll`) must therefore never be the only carrier of
information; the live dot is accompanied by the literal text `[ LIVE ]`.

---

## 7. Breakpoints and responsive behaviour

`xs 390` · `sm 576` · `md 768` · `lg 996` · `xl 1200` — Firecrawl's values, not
Tailwind's defaults. Note `lg` is 996, not 1024.

**`lg` is the layout hinge.** Above it the sidebar is in the flow; below it the
sidebar leaves the flow and becomes an off-canvas drawer:

| | `< lg` (996) | `>= lg` |
|---|---|---|
| Sidebar | Fixed drawer, `-translate-x-full` until opened, dimmed `black-alpha-32` backdrop | In flow, 240px |
| Drawer dismissal | Backdrop click, close button, `Escape`; body scroll locked while open | n/a |
| Topbar left | Hamburger + team chip (name hidden below `xs`) | Team chip only |
| Help / Docs | Moved into the drawer | Topbar buttons |
| Collapse control | Hidden — the drawer has its own close | Visible |
| Cell padding | `p-16` | `p-24` (`sm` and up) |
| Rhythm band | 32px | 64px |

**The grid rules have to resolve at every column count.** This is the part
that breaks silently. The pattern that works:

- Every cell carries a bottom rule, and the last row's doubles as the section
  separator — so the `<section>` must *not* draw its own `border-b`, or the
  bottom line renders twice.
- Vertical rules are per-column-count: `md:[&:nth-child(even)]:border-l-1` for
  two columns, `lg:border-l-1 lg:first:border-l-0` for four.
- A right-hand column that stacks below its partner needs `border-t-1
  lg:border-t-0` — the seam changes axis with the layout.

**Watch `min-width: auto` on grid and flex children.** A wide `<pre>` (the MCP
snippet) will stretch its track past the viewport rather than scrolling inside
itself. Every grid track holding code, long mono strings or truncating text
needs an explicit `min-w-0`.

Verify with `document.documentElement.scrollWidth` at 390px — it must equal
390. Note the shell is `h-screen` with `main` as the scroll container, so
`fullPage` screenshots capture only one viewport; use a tall viewport instead.

### Deviation: mobile is an extension, not a port

Firecrawl's own mobile dashboard is not in the reference screenshots and their
site is unreachable from this environment, so the drawer pattern above is built
from the system's existing vocabulary (240px panel, `heat-8` active state,
hairline dividers, 200ms house easing) rather than copied. If a mobile
reference turns up, this is the layer to re-check.

---

## 8. Deliberate deviations

Five, all forced, all flagged:

1. **SuisseIntl → Geist.** Licensed font, cannot be redistributed. Swap the
   `Geist(...)` call in `layout.tsx` for `localFont(...)` if the license is
   acquired; nothing else changes.
2. **Integration logos are letter placeholders.** The real marks are
   third-party brand assets and are not in Firecrawl's public repo.
3. **Endpoint dot-matrix glyphs are rebuilt**, not extracted — Firecrawl does
   not publish those SVGs. They are reconstructed on the same 5×5 grid from
   the screenshots.
4. **Light mode only.** The Firecrawl dashboard ships light-only and
   `colors.json` defines no dark ramp. Inventing one would not be 1:1; say the
   word and it gets added as a documented extension.
5. **`duration-*` uses real milliseconds.** Firecrawl's config remaps
   `duration-4` to 200ms (n × 50). Tailwind v4's native `duration-200` already
   means 200ms, and carrying the remap over would be a footgun for no visual
   gain. The default duration and easing are identical either way.

The Mobbin footer bar and watermark in the source screenshots are that
service's capture chrome, not part of Firecrawl's UI, and are not reproduced.
