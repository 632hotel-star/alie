# QA scripts

Playwright (`playwright-core` + the Chromium that ships with the environment). Screenshots land in `qa/shots` (git-ignored).

```bash
./qa/prod.sh                     # build + start the production server on :3100
export BASE=http://localhost:3100

node qa/layout.mjs               # chapter start/length in svh for phone and desktop
node qa/seq.mjs NAME W H SCENE P1,P2,P3 [cols3|cols6] [slow] [dpr2] [nogl] [reduced]
                                 # screenshots at scene-relative progress values + contact sheet
node qa/reverse.mjs W H N        # visit N positions down then up and diff the screenshots
node qa/static.mjs W H           # reduced-motion stills, one screenshot per chapter
node qa/weight.mjs               # transfer size by type, extra weight while scrolling, LCP
node qa/console.mjs              # console output and heap over a down/up pass
node qa/poster.mjs               # regenerate 3D poster renders (needs qa/gltest, see its README)
```

`seq.mjs` opens the page with `?qa=1`, which exposes `window.__film` so the script can wait until the scrubbed playhead has truly reached the scroll position (software rendering lags).
