# BetterMe: cinematic landing page

Mobile-first, Arabic RTL, scroll-driven product film for the BetterMe iPhone app (working name).
Neo-classical Greek engraving identity on true black (`#000000`): halftone morphs, a WebGL muscle map, a 3D meal box with a real EAN-13 barcode scan, and a five-stage hero evolution that ends in gold.

> This repository is the **marketing site only**. Every interface you see in it (workout log, barcode scan, nutrition rings, streaks, coach, widgets) is an original demo built for the page. It never requests the camera, location or Health data, and every number on screen is sample data.

## Quick start

```bash
npm install
cp .env.example .env.local     # optional, see "Configuration"
npm run dev                    # http://localhost:3000
npm run build && npm start     # production
```

Node 20+ (tested on Node 22). No other tooling is required.

## Configuration (`.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BRAND_NAME` | Working brand name. Changing it renames the header, metadata and legal pages everywhere. Default `BetterMe`. |
| `NEXT_PUBLIC_APP_STORE_URL` | Real App Store link. **While empty the CTA says "قريباً على iPhone"** and nothing pretends to download. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | If set, the CTA becomes "سجّل اهتمامك" (a `mailto:`) and `/contact` shows the address. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, Open Graph, `robots.txt` and `sitemap.xml`. |

All visible Arabic copy lives in `src/config/copy.ts`. Scroll length of every chapter lives in `src/config/lengths.ts`.

## How it works (one paragraph)

The page is one tall `.film` section with a single `position: sticky` stage (`100svh`). Every chapter is a frame stacked on that stage. `Film` (`src/components/film/director.tsx`) asks each chapter for a paused GSAP timeline authored on a normalised `[0,1]` axis, adds them to one master timeline and scrubs it with a single `ScrollTrigger`. Because everything is a pure function of the scroll position, scrolling back up reverses every animation exactly, numbers included. No scroll hijacking: native Safari scrolling is untouched, and a chapter rail plus a skip link let visitors jump anywhere.

```
src/
  app/                    layout, page, privacy / terms / contact, robots, sitemap
  components/
    film/                 director.tsx (master timeline, rail), useScene.ts
    scenes/               Hero, Plan, Train, Fuel, Commit, Progress, Coach, Widgets, Finale
    gl/                   one WebGL stage (three.js): mannequin, food box, barcode encoder, shared state
    engraving/DotField.ts halftone dot field: assemble, morph, disperse
    ui/                   Header, Cta, Tap, Ring, LazyImg, LegalPage, FeatureSummary
  config/                 site, copy, characters, lengths, asset-meta.json
  lib/                    tl.ts (timeline helpers), env.ts (capability detection)
  styles/                 ui.css (demo kit), scenes.css (layout)
scripts/process_assets.py optimise the supplied artwork (crop, resize, WebP)
assets-src/               original artwork exactly as supplied
qa/                       Playwright scripts used for the QA described in PERFORMANCE.md
```

## Adding or changing a chapter

1. Create `src/components/scenes/MyScene.tsx`, call `useScene({ id, len, build })`. `build(q, env, root)` returns a paused timeline on `[0,1]`; add a `settled` label for the reduced-motion still.
2. Add it to `src/app/page.tsx` and a length to `src/config/lengths.ts`.
3. Use `tap()`, `countTo()`, `frame()` from `src/lib/tl.ts`. Animate transform / opacity only.

## Replacing artwork

* Characters: `assets-src/` holds the supplied files. Stage 1 ("المهمل") has **not** been supplied: add its transparent WebP as `assets-src/1b.webp`, extend `scripts/process_assets.py` for it, set `file: "stage-1"` in `src/config/characters.ts`, and it appears in the hero, the finale sequence and the finale strip automatically.
* Run `npm run assets` after changing any source file.

## Honesty rules baked into the site

* No fake download link: the CTA reflects whether `NEXT_PUBLIC_APP_STORE_URL` exists.
* Demo data is labelled ("بيانات توضيحية", "عرض توضيحي"); the barcode is a demo EAN-13 and the scan is a visual sequence, not a real scan.
* Screen Time focus mode is described as optional and permission-based.
* Character stages are motivational art, not a promise about anyone's body or a timeline.
* No testimonials, ratings, download counts or result statistics.

See also: `DESIGN_SYSTEM.md`, `STORYBOARD.md`, `PERFORMANCE.md`, `ASSETS_AND_LICENSES.md`, `DEPLOYMENT.md`.
