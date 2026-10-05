# A.L.I.E.

A scroll-driven particle experience. One GPU particle system (Three.js, custom shaders) morphs between
about 30 procedural shapes as you scroll: wordmark, neural network, self-extending core, laptop, house,
book, globe, orb and more. Mobile first, English and Arabic (RTL), sound off by default.

```bash
npm install
npm run dev      # local dev
npm run build    # static site in dist/
```

- `src/shapes.js`  procedural point-cloud shapes
- `src/story.js`   which shape holds at each scroll position, plus scrubbed typing, steps and timelines
- `src/main.js`    particle engine, adaptive quality, layout, input
- `src/i18n.js`    copy (EN / AR)

Adaptive: particle count and pixel ratio follow the device tier, and drop further if frames run slow.
`prefers-reduced-motion` gives a calm version (no inertia scroll, drift, swirl or pointer effects).
Without WebGL the copy renders as a plain static page. The final CTA has a placeholder `href`.
