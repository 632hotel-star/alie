# Performance, testing and honest limits

## Decisions

| Decision | Why |
|---|---|
| One sticky stage, one master timeline, one `ScrollTrigger` | one scroll observer, native scrolling, zero pinning spacers (the most fragile thing on iOS Safari) |
| `svh` for the stage and for scroll lengths | stays constant when Safari's toolbar collapses, so nothing jumps |
| Only `transform`, `opacity`, `clip-path`, SVG dash offsets and CSS custom properties are animated | compositor friendly. No filter, blur or backdrop-filter anywhere. |
| No React state in the animation path | counters, rings and charts are tweened plain values written straight to the DOM; React only knows the active chapter (changes about 8 times per visit) |
| Frames outside their chapter are `visibility: hidden` | they cost no paint and cannot be tabbed into |
| **A single WebGL context**, created lazily when the visitor reaches chapter 2, and built in small steps with yields | the first screen ships no three.js (it is a separate 137 kB gzip chunk); creation never blocks the main thread for long |
| WebGL renders **on demand** (a render request per scrub update, batched in one `requestAnimationFrame`) and idles at zero cost between chapters | no continuous loop |
| Pixel ratio capped at 2 (1.5 when `hardwareConcurrency <= 4` or `deviceMemory <= 4`) | detail is reduced on weak devices, the idea is not |
| Images load one chapter ahead (`LazyImg`) because stacked frames defeat native lazy loading | first load went from 2.1 MB to 0.84 MB |
| Poster images for the 3D props load only when WebGL is missing or in reduced-motion stills | 240 kB not paid by the 99% case |
| Fonts self-hosted, split by script, `swap`, the five main ones preloaded | no third-party font requests |
| Grain is a fixed, `pointer-events: none` layer, never on scrolling content | continuous repaint of scrolling layers is what kills mobile fps |

## Fallbacks

| Situation | Behaviour |
|---|---|
| `prefers-reduced-motion` | no pinning and no long motion: the film becomes nine **settled stills** in sequence (each chapter's `settled` label), nothing hidden |
| no WebGL2 | the mannequin and the box are replaced by pre-rendered posters driven by the same timeline (opacity, scale, front/back crossfade); the scan frame is placed from the poster geometry |
| no JavaScript | stacked static layout (images need JS to start loading) |
| low-end device | lower pixel ratio and fewer hero dots, same story |

## Measured (production build, `qa/` scripts, headless Chromium with software WebGL)

| Metric | Result |
|---|---|
| First load transfer (gzip) | **0.84 MB**: JS 226 kB, fonts 376 kB, images 187 kB, CSS 11 kB, HTML 16 kB |
| Loaded lazily while scrolling the whole film | three.js chunk 137 kB + about 445 kB of images |
| Page height | about 25 screens on phones, 22 on desktop |
| Console errors / warnings over a full down-and-up pass | none |
| JS heap after two full passes | about 11 MB (no growth between passes) |
| Horizontal overflow | none at 320, 360, 390, 430, 768, 1024, 1440 px wide (`overflow-x: clip` plus visual review of each chapter) |
| Reversibility (`qa/reverse.mjs`): 12 positions sampled downward then upward, pixel diff | identical except sub-pixel anti-aliasing on the chapter headline in 4 of 12 positions; numbers, states and layout match |
| LCP (software-rendered sandbox, not representative) | about 2.7 s, dominated by the deliberate 2 s hero assembly |

## What was **not** verified

* **No real iPhone, Safari or Low Power Mode testing happened.** Everything was tested in Chromium (mobile emulation, `svh`, safe-area variables set by CSS only). Test on a physical iPhone before launch; the places most worth checking are listed below.
* **Frame rate was not measured on hardware.** The sandbox renders WebGL in software, so fps figures would be meaningless. The architecture targets 60 fps on current phones and stays coherent at 30 fps, but that is a design goal, not a measurement.
* Lighthouse was not run.

Things to eyeball on a real device: Safari toolbar collapse during scrub (stage uses `svh`), scrub smoothness while the three.js chunk is being created (it is staged to avoid long tasks), the barcode scan frame alignment on the 3D box, `clip-path` with CSS variables in the before / after slider, and notch / Dynamic Island spacing in landscape.

## How to re-run the checks

See `qa/README.md`.
