/* Before / after comparison: two engraving states of the same figure stacked, revealed by a draggable divider
   (a native range input for keyboard + touch), plus an illustrative chart whose cursor follows the divider.
   Direction aware: the divider starts from the inline-start edge. No numbers are shown as claims. */
import { bustSVG } from './brand.js';
import { t, reduced, clamp } from './core.js';

export function mountCompare(root, { onCut } = {}) {
  root.classList.add('compare');
  root.innerHTML = `
    <div class="compare-frame">
      <div class="compare-layer compare-before">${bustSVG(1, { label: t('carved.first') })}</div>
      <div class="compare-layer compare-after">${bustSVG(3, { label: t('carved.latest') })}</div>
      <div class="compare-divider" aria-hidden="true"><span class="compare-handle"><svg><use href="#i-arrows-left-right"/></svg></span></div>
      <label class="compare-range-label"><span class="sr-only">${t('compare.range')}</span>
        <input class="compare-range" type="range" min="0" max="100" value="38" step="1"></label>
      <span class="compare-tag compare-tag-before">${t('carved.first')}</span>
      <span class="compare-tag compare-tag-after">${t('carved.latest')}</span>
    </div>
    <figure class="compare-chart" aria-hidden="true">
      <svg viewBox="0 0 600 180" preserveAspectRatio="none">
        <g class="chart-grid" stroke="currentColor" stroke-width="1" opacity=".18">
          <line x1="0" y1="45" x2="600" y2="45"/><line x1="0" y1="90" x2="600" y2="90"/><line x1="0" y1="135" x2="600" y2="135"/>
        </g>
        <path class="chart-plan" d="M0 40 C 150 48, 300 92, 600 150" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round" opacity=".7"/>
        <path class="chart-actual" d="M0 44 C 60 40, 110 60, 160 70 S 260 72, 320 96 S 440 118, 520 134 S 580 146, 600 142" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" pathLength="1"/>
        <line class="chart-cursor" x1="0" y1="0" x2="0" y2="180" stroke="currentColor" stroke-width="1" opacity=".5"/>
      </svg>
      <figcaption><span>${t('carved.projected')}</span><span>${t('carved.actual')}</span></figcaption>
    </figure>`;
  const range = root.querySelector('.compare-range');
  const before = root.querySelector('.compare-before');
  const divider = root.querySelector('.compare-divider');
  const cursor = root.querySelector('.chart-cursor');
  const frame = root.querySelector('.compare-frame');
  function apply(v) {
    const p = clamp(v / 100);
    root.style.setProperty('--cut', String(p)); if (onCut) onCut(p);
    const rtl = document.documentElement.dir === 'rtl';
    // the first measurement occupies the reading start up to the cut; the latest is revealed beyond it
    before.style.clipPath = rtl ? `inset(0 0 0 ${(1 - p) * 100}%)` : `inset(0 ${(1 - p) * 100}% 0 0)`;
    divider.style.insetInlineStart = `${p * 100}%`;
    cursor.setAttribute('x1', String(rtl ? 600 - p * 600 : p * 600)); cursor.setAttribute('x2', String(rtl ? 600 - p * 600 : p * 600));
  }
  range.addEventListener('input', () => apply(Number(range.value)));
  // tap anywhere on the frame moves the divider there
  frame.addEventListener('pointerdown', (e) => {
    if (e.target === range) return;
    const r = frame.getBoundingClientRect();
    let p = (e.clientX - r.left) / r.width;
    if (document.documentElement.dir === 'rtl') p = 1 - p;
    range.value = String(Math.round(clamp(p) * 100)); apply(Number(range.value));
  });
  document.addEventListener('bm:lang', () => {
    root.querySelector('.compare-tag-before').textContent = t('carved.first');
    root.querySelector('.compare-tag-after').textContent = t('carved.latest');
    root.querySelector('.compare-chart figcaption').innerHTML = `<span>${t('carved.projected')}</span><span>${t('carved.actual')}</span>`;
    apply(Number(range.value));
  });
  apply(Number(range.value));
  // one nudge when first seen, to show it moves
  if (!reduced() && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return; io.disconnect();
      const from = Number(range.value), to = from + 14, start = performance.now();
      const step = (now) => { const k = Math.min(1, (now - start) / 900); const s = Math.sin(k * Math.PI); apply(from + (to - from) * s); range.value = String(Math.round(from + (to - from) * s)); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: .6 });
    io.observe(root);
  }
}
