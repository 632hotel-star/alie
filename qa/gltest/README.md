# 3D harness

Development-only page used to render the WebGL props in isolation (and to regenerate `public/posters/*.webp`).
It is intentionally **not** inside `src/app`, so it never ships.

```bash
cp -r qa/gltest src/app/gltest
npm run dev                       # in one terminal
node qa/poster.mjs                # another terminal: writes qa/shots/poster-*.png
rm -rf src/app/gltest
```

Then crop and convert the PNGs (see the snippet in the project history, or any image tool) into `public/posters/{mannequin,box-front,box-back}.webp`.
Query parameters: `prop=mannequin|box`, `rotY`, `rotX`, `hi=<muscle>`, `load=0..1`, `explode`, `dis`, `bg=none` for transparency.
