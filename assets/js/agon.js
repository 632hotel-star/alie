/* Agon: friends on the lanes. Six medallions on five stadium lanes (six rows on phones) with a three-state
   competition control (stars / iron / both). Switching re-ranks the medallions with a FLIP move and swaps the
   character state so the leader carries the highest one. Hover, long-press or focus shows a tally of ticks;
   tapping "You" adds a tick. Scores are hidden and illustrative: nothing on screen is a number. */
import { bustSVG } from './brand.js';
import { t, reduced } from './core.js';

const N = 6, MAX = 15, SIZE = 64, EASE = 'cubic-bezier(.2,.8,.2,1)';
const AXES = ['stars', 'iron', 'both'];
const STATE_BY_RANK = [4, 3, 3, 2, 2, 1];
const phone = window.matchMedia('(max-width: 699px)');
const dir = () => document.documentElement.dir === 'rtl' ? -1 : 1;

export function mountAgon(root) {
  /* hidden illustrative scores, 0..15 ticks per axis */
  const friends = [
    { stars: 9, iron: 13 }, { stars: 12, iron: 6 }, { stars: 7, iron: 11 },
    { stars: 11, iron: 8, you: true }, { stars: 14, iron: 4 }, { stars: 5, iron: 9 },
  ];
  const you = friends.findIndex(f => f.you);
  const uid = 'agon' + Math.random().toString(36).slice(2, 7);
  let axis = 'stars', rank = [], pos = [], youRank = -1, built = '';

  root.classList.add('agon');
  root.innerHTML = `
    <div class="agon-ctl" role="radiogroup">${AXES.map((a, i) => `<button type="button" class="chip" role="radio" data-axis="${a}" aria-checked="${i === 0}" tabindex="${i ? -1 : 0}"></button>`).join('')}</div>
    <div class="agon-stage">
      <svg class="agon-lanes" aria-hidden="true"></svg>
      <div class="agon-field">${friends.map((f, i) => `
        <div class="agon-m${f.you ? ' is-you' : ''}"><div class="agon-flip">
          <button type="button" class="agon-disc" aria-describedby="${uid}-${i}"></button>
          ${f.you ? '<span class="agon-you"></span>' : ''}
          <svg class="agon-tally" id="${uid}-${i}" role="img" height="14"></svg>
        </div></div>`).join('')}</div>
    </div>
    <p class="agon-live sr-only" aria-live="polite"></p>`;
  const ctl = root.querySelector('.agon-ctl'), chips = Array.from(ctl.children);
  const stage = root.querySelector('.agon-stage'), svg = root.querySelector('.agon-lanes'), live = root.querySelector('.agon-live');
  const items = Array.from(root.querySelectorAll('.agon-m')).map(el => ({ el, box: el.firstElementChild, disc: el.querySelector('.agon-disc'), tally: el.querySelector('.agon-tally'), state: 0, anim: null }));

  const score = f => axis === 'stars' ? f.stars : axis === 'iron' ? f.iron : (f.stars + f.iron) / 2;
  const ticks = f => Math.min(MAX, Math.round(score(f)));
  function rankAll() {
    const order = friends.map((_, i) => i).sort((a, b) => score(friends[b]) - score(friends[a])
      || (friends[b].stars + friends[b].iron) - (friends[a].stars + friends[a].iron) || a - b);
    order.forEach((i, r) => { rank[i] = r; });
  }

  /* ---- lanes: built in pixel units so hairlines stay 1px and the lane gap stays constant ---- */
  function build() {
    const W = stage.clientWidth, mobile = phone.matches, key = W + (mobile ? 'm' : 'd');
    if (!W || key === built) return; built = key;
    const paths = [], slots = []; let H, finish;
    if (mobile) {
      const P = 88, top = 40, step = (W - 108) / (N - 1);
      H = top + (N - 1) * P + 56;
      for (let i = 0; i < N; i++) { paths.push(`M0 ${top + i * P}H${W}`); slots.push({ lane: i, d: 36 + i * step }); }
      finish = `M${W - .5} ${top - 30}V${top + (N - 1) * P + 30}`;
    } else {
      const G = Math.min(80, Math.max(52, W / 16)), R0 = Math.round(G * 1.3), R4 = R0 + 4 * G;
      const cy = 40 + R4, cx = W - R4 - 36, oy = cy - R0 - 2 * G, fx = Math.min(cx * .4, 360);
      const step = Math.min(G * 1.2, Math.max(44, (cx - fx - 80) / 3));
      H = cy + 56;
      /* each lane: a fan from the origin, a straight, then the quarter bend to the finish */
      for (let i = 0; i < 5; i++) { const r = R0 + i * G, y = cy - r; paths.push(`M0 ${oy}C${fx * .5} ${oy} ${fx * .5} ${y} ${fx} ${y}H${cx}A${r} ${r} 0 0 1 ${cx + r} ${cy}`); }
      /* the leader sits on the bend near the finish; the others wait on the straights, staggered back by rank */
      for (let r = 0; r < N; r++) { const lane = Math.min(r, 4); slots.push({ lane, d: r ? (R0 + lane * G) * Math.PI / 2 + 10 + (r - 1) * step + (r === 5 ? Math.max(0, 70 - step) : 0) : R0 }); }
      finish = `M${cx + R0 - 12} ${cy + .5}H${cx + R4 + 12}`;
    }
    root.style.setProperty('--agon-h', H + 'px');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = paths.map(d => `<path class="agon-lane" d="${d}"/>`).join('')
      + `<path class="agon-lane agon-lane-main" d="${paths[0]}" pathLength="1"/><path class="agon-finish" d="${finish}"/>`;
    const lanes = svg.querySelectorAll('.agon-lane');
    pos = slots.map(s => { const p = lanes[s.lane]; return p.getPointAtLength(Math.max(0, p.getTotalLength() - s.d)); });
  }

  /* ---- FLIP: measure, change, invert, play (the inner box animates so the position transform stays untouched) ---- */
  function place(animate) {
    if (!pos.length) return;
    const first = animate && !reduced() ? items.map(it => it.box.getBoundingClientRect()) : null;
    items.forEach(it => { if (it.anim) { it.anim.cancel(); it.anim = null; } });
    const D = dir();
    items.forEach((it, i) => {
      const p = pos[rank[i]];
      it.el.style.setProperty('--x', `${D * (p.x - SIZE / 2)}px`);
      it.el.style.setProperty('--y', `${p.y - SIZE / 2}px`);
    });
    if (!first) return;
    items.forEach((it, i) => {
      const last = it.box.getBoundingClientRect(), dx = first[i].left - last.left, dy = first[i].top - last.top;
      if (!dx && !dy) return;
      it.anim = it.box.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 480, easing: EASE });
    });
  }

  /* ---- tally ticks: groups of five, the fifth crossing; drawn twice for the incised groove ---- */
  function tallyMarkup(n) {
    let s = '';
    for (let i = 0; i < n; i++) { const g = Math.floor(i / 5) * 25, k = i % 5; s += k < 4 ? `<path d="M${g + k * 5 + 1} 1v12"/>` : `<path d="M${g - 1} 11L${g + 17} 3"/>`; }
    return `<g class="agon-groove">${s}</g><g>${s}</g>`;
  }
  const tallyWidth = n => { const g = Math.ceil(n / 5) - 1, k = n - g * 5; return Math.max(2, g * 25 + (k === 5 ? 18 : (k - 1) * 5 + 2)); };

  /* ---- states, labels and tallies for the current ranking ---- */
  function dress() {
    items.forEach((it, i) => {
      const s = STATE_BY_RANK[rank[i]], label = t(`stage.${s - 1}`), n = ticks(friends[i]);
      if (it.state !== s) { it.state = s; it.disc.innerHTML = bustSVG(s, { crop: 'head', label }); }
      else it.disc.firstElementChild.setAttribute('aria-label', label);
      it.disc.setAttribute('aria-label', friends[i].you ? t('agon.add') : label);
      it.tally.innerHTML = tallyMarkup(n);
      const w = tallyWidth(n);
      it.tally.setAttribute('viewBox', `0 0 ${w} 14`); it.tally.setAttribute('width', w);
      it.tally.setAttribute('aria-label', `${t('agon.tally')}: ${n}`);
    });
  }
  function text() {
    chips.forEach(c => { c.textContent = t(`agon.${c.dataset.axis}`); });
    ctl.setAttribute('aria-label', t('agon.mode'));
    root.querySelector('.agon-you').textContent = t('agon.you');
  }
  const announce = () => { live.innerHTML = `${t('agon.tally')}: <bdi class="num">${youRank + 1} / ${N}</bdi>`; };
  function rerank(animate) {
    const prev = youRank;
    rankAll(); dress(); place(animate); youRank = rank[you];
    return youRank !== prev;
  }

  /* ---- control: radiogroup with roving tabindex ---- */
  function setAxis(a, focus) {
    axis = a;
    chips.forEach(c => { const on = c.dataset.axis === a; c.setAttribute('aria-checked', on); c.tabIndex = on ? 0 : -1; if (on && focus) c.focus(); });
    if (rerank(true)) announce();
  }
  chips.forEach((c, i) => {
    c.addEventListener('click', () => setAxis(c.dataset.axis));
    c.addEventListener('keydown', e => {
      const rtl = dir() < 0; let step;
      if (e.key === 'ArrowRight') step = rtl ? -1 : 1; else if (e.key === 'ArrowLeft') step = rtl ? 1 : -1;
      else if (e.key === 'ArrowDown') step = 1; else if (e.key === 'ArrowUp') step = -1;
      else if (e.key === 'Home') step = -i; else if (e.key === 'End') step = AXES.length - 1 - i; else return;
      e.preventDefault();
      setAxis(AXES[(i + step + AXES.length) % AXES.length], true);
    });
  });

  /* ---- medallions: hover, long-press (500ms) and focus show the tally; tapping "You" adds a tick ---- */
  items.forEach((it, i) => {
    let timer = 0, held = false, peek = 0;
    const cls = it.el.classList, show = () => cls.add('is-tally'), hide = () => cls.remove('is-tally');
    it.disc.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(); });
    it.disc.addEventListener('pointerleave', () => { clearTimeout(timer); hide(); });
    it.disc.addEventListener('pointerdown', () => { clearTimeout(timer); it.skip = false; timer = setTimeout(() => { held = true; show(); }, 500); });
    const end = e => { clearTimeout(timer); if (held) { held = false; it.skip = true; if (e.pointerType !== 'mouse') setTimeout(hide, 900); } };
    it.disc.addEventListener('pointerup', end); it.disc.addEventListener('pointercancel', end);
    it.disc.addEventListener('contextmenu', e => e.preventDefault());
    if (i !== you) return;
    it.disc.addEventListener('click', () => {
      if (it.skip) { it.skip = false; return; }
      const f = friends[you];
      if (axis !== 'iron') f.stars = Math.min(MAX, f.stars + 1);
      if (axis !== 'stars') f.iron = Math.min(MAX, f.iron + 1);
      rerank(true); announce();
      cls.add('is-peek'); clearTimeout(peek); peek = setTimeout(() => cls.remove('is-peek'), 1400);
    });
  });

  /* ---- init, resize, language, entry draw ---- */
  text(); rankAll(); dress(); youRank = rank[you];
  const relayout = () => { build(); place(false); };
  new ResizeObserver(relayout).observe(stage);
  phone.addEventListener('change', relayout);
  document.addEventListener('bm:lang', () => { text(); dress(); place(false); });
  if (reduced() || !('IntersectionObserver' in window)) root.style.setProperty('--p', 1);
  else {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { root.style.setProperty('--p', 1); io.disconnect(); } }, { threshold: .2 });
    io.observe(root);
  }
}
