/* Stage: train, then eat. One pinned cinematic scene on one figure.
   Beat A (p 0..5): the Line enters from the spine, levels into a barbell, plates load, a rest arc counts 60 to 0, tally
   ticks grow (start / last / best) while the figure forms (state 2 -> 3). Beat B (p .5..1): the bar bends into three
   nutrition arcs, then three plate rims (fixed / flexible / free) and the Line returns to the spine.
   Everything is drawn from --p through CSS calc windows (--a/--b draw, --c/--d undraw). Reduced motion or a viewport
   shorter than 640px renders two static frames instead of a pin. The figure is never mirrored; the line groups are. */
import { bustSVG, STATUE } from './brand.js';
import { t, currentLang, reduced, stickyProgress, range } from './core.js';

const FB = { 'stage.figure': { ar: 'الشخصية وهي تتشكل', en: 'The character, taking shape' } };
const tt = k => { const v = t(k); return v === k && FB[k] ? FB[k][currentLang()] : v; };
const R = v => Math.round(v);
const pol = (x, y, r, a) => [R(x + r * Math.cos(a * Math.PI / 180)), R(y + r * Math.sin(a * Math.PI / 180))];
const LENS = [.85, .6, .4];
const KEYS_T = ['stage.a.start', 'stage.a.last', 'stage.a.best'];
const KEYS_N = ['stage.b.protein', 'stage.b.carbs', 'stage.b.fat'];
const KEYS_P = ['stage.b.fixed', 'stage.b.flex', 'stage.b.free'];

/* Two layouts in scene units. Desktop: plates in a column at the inline-end. Mobile: a row under the figure. */
const DESK = { vw: 1200, vh: 800, sh: '100cqh', fig: [492, 270, 415, 460], ey: 700, xy: 790,
  entry: 'M-200 700H120C220 700 220 612 300 612H1100', bar: [1100, 612], rings: [360, 1040, 612], rr: [14, 26, 38],
  rest: [1040, 430, 60], tally: [1000, 672, 9, 24, 30], arcs: [700, 620, [300, 270, 240]], a0: 25, a1: -40,
  plates: [[1110, 300], [1110, 460], [1110, 620]], pr: 46, col: true };
const MOB = { vw: 760, vh: 920, sh: 'min(68cqh, 121.05cqw)', fig: [220, 170, 400, 443], ey: 300, xy: 900,
  entry: 'M-200 300H40C110 300 90 498 130 498H745', bar: [745, 498], rings: [170, 695, 498], rr: [12, 22, 32],
  rest: [695, 350, 48], tally: [60, 545, 8, 20, 28], arcs: [420, 560, [240, 215, 190]], a0: 25, a1: -35,
  plates: [[200, 760], [400, 760], [600, 760]], pr: 50, col: false };

const win = (a, b, c, d) => `--a:${a};--b:${b}${c != null ? `;--c:${c};--d:${d}` : ''}`;
const P = (cls, d, w) => `<path class="stage-d ${cls}" d="${d}" pathLength="1" style="${w}" vector-effect="non-scaling-stroke"/>`;
const C = (cls, x, y, r, w) => `<circle class="stage-d ${cls}" cx="${x}" cy="${y}" r="${r}" pathLength="1" style="${w}" vector-effect="non-scaling-stroke"/>`;
const at = (m, x, y, inner) => `<span class="stage-at ${m}" style="--x:${x};--y:${y}">${inner}</span>`;
const lbl = (m, k, x, y, w) => at(m, x, y, `<span class="stage-lbl stage-f" data-k="${k}" style="${w}">${tt(k)}</span>`);

function scene(L) {
  const [fx, fy, fw, fh] = L.fig, [rx1, rx2, ry] = L.rings, [sx, sy, sr] = L.rest, [tx, ty, tp, th, tg] = L.tally;
  const [ax, ay, ar] = L.arcs, pr = L.pr;
  /* beat A: entry + bar (never fades), rings, rest arc, tally ledger */
  let a = P('stage-ln', L.entry, win(0, .12)) + `<g class="stage-f" style="${win(0, 0, .5, .56)}">`;
  L.rr.forEach((r, i) => { a += C('stage-ln', rx1, ry, r, win(.12 + i * .06, .18 + i * .06)) + C('stage-ln', rx2, ry, r, win(.12 + i * .06, .18 + i * .06)); });
  a += `<g class="stage-f stage-rest" style="${win(.3, .33, .42, .45)}">` + P('stage-hl', `M${sx} ${sy - sr}A${sr} ${sr} 0 1 1 ${sx - sr} ${sy}`, win(.3, .34, .34, .42)) + '</g>';
  [2, 4, 5].forEach((n, i) => {
    const y = ty + i * tg; let d = '';
    for (let k = 0; k < Math.min(n, 4); k++) d += `M${tx + k * tp} ${y}v${th}`;
    if (n === 5) d += `M${tx - 3} ${y + th}L${tx + 3 * tp + 3} ${y}`;
    a += P('stage-tk', d, win(.3 + i * .07, .36 + i * .07));
  });
  a += '</g>';
  /* beat B: bend, arc tracks + fills, connectors, plate rims and their contents, tail */
  const s = pol(ax, ay, ar[0], L.a0), [bx, by] = L.bar;
  let b = P('stage-ln', `M${bx} ${by}C${bx} ${by + 90} ${s[0] + 60} ${s[1] + 10} ${s[0]} ${s[1]}`, win(.5, .53));
  const ends = [], outs = [];
  ar.forEach((r, i) => {
    const p0 = pol(ax, ay, r, L.a0), p1 = pol(ax, ay, r, L.a1), d = `M${p0}A${r} ${r} 0 0 0 ${p1}`;
    const ae = L.a0 + (L.a1 - L.a0) * LENS[i], e = pol(ax, ay, r, ae), o = pol(ax, ay, ar[0] + 14, ae);
    ends.push(e); outs.push(o);
    b += P('stage-hl', d, win(.5, .53)) + P('stage-ln', d, `${win(.53, .66)};--len:${LENS[i]}`) + P('stage-hl', `M${e}L${o}`, win(.56 + i * .03, .6 + i * .03));
  });
  const [ex, ey] = ends[0], [[p1x, p1y], [p2x, p2y], [p3x, p3y]] = L.plates;
  const rim = (x, y, top) => top ? `M${x} ${y - pr}A${pr} ${pr} 0 1 1 ${x} ${y + pr}A${pr} ${pr} 0 1 1 ${x} ${y - pr}`
    : `M${x - pr} ${y}A${pr} ${pr} 0 1 1 ${x + pr} ${y}A${pr} ${pr} 0 1 1 ${x - pr} ${y}`;
  const c0 = L.col ? `M${ex} ${ey}C${ex + 24} ${ey - 80} ${p1x - pr - 40} ${p1y + 90} ${p1x - pr} ${p1y}`
    : `M${ex} ${ey}C${ex + 70} ${ey - 40} ${ex + 100} ${p1y - 78} ${ex + 20} ${p1y - 78}H${p1x + 60}C${p1x + 20} ${p1y - 78} ${p1x} ${p1y - 70} ${p1x} ${p1y - pr}`;
  const c1 = L.col ? `M${p1x} ${p1y + pr}V${p2y - pr}` : `M${p1x + pr} ${p1y}H${p2x - pr}`;
  const c2 = L.col ? `M${p2x} ${p2y + pr}V${p3y - pr}` : `M${p2x + pr} ${p2y}H${p3x - pr}`;
  const tail = `M${p3x} ${p3y + pr}V${L.xy}H-200`;
  b += P('stage-ln', c0, win(.66, .69)) + P('stage-ln', c1, win(.76, .78)) + P('stage-ln', c2, win(.86, .88)) + P('stage-ln', tail, win(.95, 1));
  const plate = (i, x, y, inner) => `<g class="stage-pl" data-i="${i}"><circle class="stage-pfill" cx="${x}" cy="${y}" r="${pr - 1}"/>${P('stage-ln', rim(x, y, L.col ? i > 0 : i === 0), win(.69 + i * .095, .74 + i * .095))}${inner}</g>`;
  /* fixed: three carved portions and a check */
  const cq = [p1x + pr * .78, p1y - pr * .78];
  let f = P('stage-hl', [0, 120, 240].map(g => `M${pol(p1x, p1y, 8, g - 90)}L${pol(p1x, p1y, pr - 8, g - 90)}`).join(''), win(.72, .75));
  f += P('stage-hl stage-chk', `M${cq[0] - 8} ${cq[1]}l6 6 11-12`, `${win(.75, .76)};--cx:${cq[0]}`);
  /* flexible: a shelf of three saved pieces that slide into the plate */
  const shx = p2x + pr + 10, shy = p2y + 8, tgt = [[p2x - 11, p2y - 8], [p2x + 4, p2y - 8], [p2x - 3, p2y + 5]];
  let g = P('stage-hl', `M${shx} ${shy}h29`, win(.78, .8));
  tgt.forEach(([qx, qy], k) => { g += `<rect class="stage-hl stage-pc stage-f" x="${qx}" y="${qy}" width="7" height="7" vector-effect="non-scaling-stroke" style="${win(.78, .8)};--dx:${shx + 11 * k - qx};--dy:${shy - 7 - qy};--sa:${.8 + k * .02};--sb:${.84 + k * .02}"/>`; });
  /* free: loose single items dropped one by one */
  const it = [`<circle cx="${p3x - 14}" cy="${p3y - 6}" r="7"/>`, `<rect x="${p3x + 4}" y="${p3y - 14}" width="13" height="13"/>`, `<path d="M${p3x - 8} ${p3y + 22}l10-16 10 16z"/>`];
  const h = it.map((m, k) => `<g class="stage-hl stage-drop stage-f" style="${win(.89 + k * .02, .905 + k * .02)}" vector-effect="non-scaling-stroke">${m}</g>`).join('');
  b += plate(0, p1x, p1y, f) + plate(1, p2x, p2y, g) + plate(2, p3x, p3y, h);
  const svg = `<svg class="stage-scene" viewBox="0 0 ${L.vw} ${L.vh}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
<g class="stage-lines">${a}</g>
<g class="stage-lines stage-lb">${b}</g>
<g class="stage-fig" style="--fx:${fx};--fy:${fy};--fw:${fw};--fh:${fh}">${bustSVG(3, { label: tt('stage.figure') })}</g></svg>`;
  /* HTML labels, positioned in scene units; CSS maps them through --u and mirrors them by inline-start */
  let l = KEYS_T.map((k, i) => lbl('is-s', k, tx + 4 * tp + 10, ty + i * tg + th / 2, win(.3 + i * .07, .36 + i * .07, .5, .56))).join('');
  l += at('is-c', sx, sy - 4, `<bdi class="num stage-num stage-f" style="${win(.3, .33, .42, .45)}">60</bdi>`) + lbl('is-c', 'stage.a.rest', sx, sy + 24, win(.3, .33, .42, .45));
  l += KEYS_N.map((k, i) => lbl('is-s', k, outs[i][0] + 4, outs[i][1] + 12, win(.56 + i * .03, .6 + i * .03))).join('');
  l += KEYS_P.map((k, i) => at('is-t', L.plates[i][0], L.plates[i][1] - pr, `<button type="button" class="stage-plate stage-f" data-i="${i}" aria-pressed="false" style="--r:${pr};${win(.7 + i * .095, .74 + i * .095)}"><span class="stage-lbl" data-k="${k}">${tt(k)}</span></button>`)).join('');
  return svg + `<div class="stage-labels">${l}</div>`;
}

/* Turn the state-3 bust into a continuous state 2 -> 3 rig: cloned hatch-1 and 35% fill crossfade on opacity,
   leaves reveal by index, the contour fades, pitch is driven by --pa in CSS. */
function rig(root) {
  root.querySelectorAll('.stage-fig .bust').forEach(b => {
    const body = b.querySelector('.rig-body'), fill = b.querySelector('.rig-fill'), shade = b.querySelector('.rig-shade');
    body.style.transform = '';
    const s1 = shade.cloneNode(true); s1.classList.add('stage-sh1'); s1.setAttribute('fill', 'url(#hatch-1)'); shade.before(s1);
    const f2 = fill.cloneNode(true); f2.classList.add('stage-fl2'); fill.setAttribute('fill-opacity', '.35'); fill.after(f2);
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    c.setAttribute('d', STATUE); c.setAttribute('class', 'stage-ctr'); c.setAttribute('vector-effect', 'non-scaling-stroke'); body.append(c);
    b.querySelectorAll('.rig-leaf').forEach(p => { p.style.setProperty('--i', p.dataset.i); p.removeAttribute('opacity'); });
  });
}

const cap = (beat, on) => `<div class="stage-cap${on ? ' is-on' : ''}" data-beat="${beat}"${on ? '' : ' aria-hidden="true"'}><h2 data-k="stage.${beat}.h2">${tt(`stage.${beat}.h2`)}</h2><p data-k="stage.${beat}.body">${tt(`stage.${beat}.body`)}</p></div>`;

export function mountStage(root) {
  root.classList.add('stage');
  const mqM = matchMedia('(max-width: 767px)'), mqS = matchMedia('(max-height: 639px)');
  let dispose = null, numEl = null, lastN = -1, beat = 'a';
  const canvasStyle = L => `--vw:${L.vw};--vh:${L.vh};--sh:${L.sh};--ey:${L.ey};--xy:${L.xy}`;
  function build() {
    if (dispose) { dispose(); dispose = null; }
    const L = mqM.matches ? MOB : DESK, isStatic = reduced() || mqS.matches;
    root.classList.toggle('is-static', isStatic); root.classList.toggle('is-pinned', !isStatic);
    if (isStatic) {
      root.innerHTML = ['a', 'b'].map(bt => `<section class="stage-frame" data-beat="${bt}"><div class="stage-canvas" style="${canvasStyle(L)}">${scene(L)}</div>${cap(bt, true)}</section>`).join('');
      root.querySelector('[data-beat="a"] .stage-num').textContent = '60';
    } else {
      root.innerHTML = `<div class="stage-canvas" style="${canvasStyle(L)}"><div class="stage-stub stage-stub-top stage-f" style="${win(0, .02)}"></div>${scene(L)}<div class="stage-stub stage-stub-bot stage-f" style="${win(.99, 1)}"></div><div class="stage-caps">${cap('a', true)}${cap('b', false)}</div></div>`;
      numEl = root.querySelector('.stage-num'); lastN = -1; beat = 'a';
      const caps = root.querySelectorAll('.stage-cap');
      dispose = stickyProgress(root, p => {
        root.style.setProperty('--p', p.toFixed(4));
        const n = Math.round(60 * (1 - range(.34, .42, p)));
        if (n !== lastN) { lastN = n; numEl.textContent = String(n); }
        const nb = p >= .5 ? 'b' : 'a';
        if (nb !== beat) { beat = nb; caps.forEach(c => { const on = c.dataset.beat === nb; c.classList.toggle('is-on', on); if (on) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true'); }); }
      });
    }
    rig(root);
    root.querySelectorAll('.stage-plate').forEach(btn => {
      const g = btn.closest('.stage-canvas').querySelector(`.stage-pl[data-i="${btn.dataset.i}"]`);
      const sync = () => g.classList.toggle('is-on', btn.matches(':hover') || btn.getAttribute('aria-pressed') === 'true');
      btn.addEventListener('click', () => { btn.setAttribute('aria-pressed', String(btn.getAttribute('aria-pressed') !== 'true')); sync(); });
      btn.addEventListener('pointerenter', sync); btn.addEventListener('pointerleave', sync);
    });
  }
  build();
  mqM.addEventListener('change', build); mqS.addEventListener('change', build);
  document.addEventListener('bm:lang', () => {
    root.querySelectorAll('[data-k]').forEach(el => { el.textContent = tt(el.dataset.k); });
    root.querySelectorAll('.bust').forEach(b => b.setAttribute('aria-label', tt('stage.figure')));
  });
  return () => { if (dispose) dispose(); mqM.removeEventListener('change', build); mqS.removeEventListener('change', build); };
}
