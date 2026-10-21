# Design system

**Identity:** `TRUE BLACK + WHITE CLASSICAL ENGRAVING + HALFTONE / CROSS-HATCHING + FIVE-STAGE GREEK HERO EVOLUTION + RESTRAINED LEGENDARY GOLD`.
One theme for the whole page (dark, locked via `color-scheme: dark`). The background is `#000000` everywhere: the brief asked for real black, which is why this site deliberately does not use the off-black the generic "no pure black" rule of thumb would suggest.

## Colour tokens (`src/app/globals.css`)

| Token | Value | Role |
|---|---|---|
| `--ink` | `#000000` | background, negative space |
| `--paper` | `#ffffff` | engraving lines, primary text, primary button |
| `--g1 … --g8` | `#f2f2f2 … #0a0a0a` | calibrated greys for hierarchy and panels |
| `--line` / `--line-strong` | white at 13% / 28% | hairlines |
| `--data` | `#0a66ff` | the brand ring blue (sampled from the logo). **Functional data accent only**: selected rings, "added" confirmations, arrival state. |
| `--gold`, `--gold-hi`, `--gold-lo` | `#d4af37`, `#f3dc8a`, `#8d7318` | **legendary stage only**: the final chapter, its CTA and arcs. Never used as a general accent. |

Contrast: `--g3` (`#9b9b9b`) and above pass WCAG AA on black for small text; `--g4` was lifted to `#7c7c7c` (5.0:1 on black, 4.75:1 on panels). Primary button is black on white (21:1), gold button is black on `#d4af37` (about 10:1).

## Typography

| Use | Family | Notes |
|---|---|---|
| Display / headlines | **Noto Kufi Arabic** (variable 100 to 900, weight 800 to 900) | monumental, carved feel that suits the engraving. Letter-spacing is always 0 for Arabic so ligatures stay intact. |
| UI and body | **IBM Plex Sans Arabic** 400 / 600 / 700 | its Latin glyphs cover English labels |
| Numbers and Latin product names | **Geist** (variable) with `tabular-nums` | `.num` forces LTR so `650 kcal` never reorders inside RTL text |

All three are self-hosted woff2 (`/public/fonts`), split by script with `unicode-range`, `font-display: swap`, and the five most used files are preloaded. Display type uses `text-wrap: balance`; headlines are at most two lines on phones.

## Shape, spacing, elevation

* **One radius system:** containers `22px` (panels) and `14px` (rows), every interactive control is a pill (`999px`).
* No glassmorphism, no outer glows, no gradient fills. Depth comes from a 1px hairline, a faint top highlight and a halftone dot texture that fades out toward one corner of each panel.
* Touch targets are at least 44 px (rail buttons 36×44, buttons 46 to 56 px).
* Safe areas (`env(safe-area-inset-*)`) are applied to the header, gutters, hero actions and footer. Heights use `svh`, so Safari's collapsing toolbar never shifts the layout.

## Components of the demo kit (`src/styles/ui.css`)

`panel`, `panel--app` (the shared app-panel size, which grows on large screens through `--panel-w/--panel-h`), `row`, `chip`, `badge`, `dial` (SVG progress ring, driven by `stroke-dashoffset`), `tap` (visual touch: dot plus ring, lives inside the target so it never depends on measured coordinates), `grain-dot`, and one block per chapter.

## Motion language

Replaces rainbow light and neon with **ink, engraving and print**:

| Device | Where | How |
|---|---|---|
| Halftone dot field | hero | a canvas of dots sampled from the artwork assembles from scatter into the hero figure, morphs into the brand mark, then disperses. Three scalars (`assemble`, `morph`, `disperse`) fully define it, so it scrubs both ways. |
| Dithered dissolve | mannequin, box | opacity is a screen-space dither (printed dust), not alpha blending |
| Engraved light | mannequin | custom shader: contour hatching anchored in body space, cross-hatching in the lighter tones, a rim outline. Ink density encodes weekly training volume. |
| Grains | plan, train, coach, finale | small white (and gold) dots that orbit and land where the next element forms |
| Clip reveal | finale | each stage is printed in from the bottom up |
| Real transformations | everywhere | the plan row becomes the workout header; the chart becomes the muscle map; the meal card flies into the calorie ring |

Rules we follow: every tween has a reason (hierarchy, story, feedback or state change), only `transform`/`opacity` (plus `clip-path` and SVG dash offsets) animate, and the page never scroll-hijacks.

## Colour by chapter

| Chapter | Palette |
|---|---|
| Hero, Plan, Train, Commit, Progress, Coach | black + white + greys |
| Fuel | black + white + the single data blue on rings |
| Finale | black + white + gold, applied only to the legendary figure, its arcs, rays, dust and CTA |

## Accessibility

Semantic landmarks (`header`, `main`, `nav`, `footer`), a skip link as the first tab stop, a chapter rail with labelled buttons, visible focus rings, `prefers-reduced-motion` turning the film into a sequence of settled stills (nothing hidden), a text equivalent of the whole story for screen readers (`FeatureSummary`), and no information conveyed by colour alone.
