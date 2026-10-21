/* Procession: the five carving states of the one figure on the Line.
   Desktop with a fine pointer: a pinned frieze (300vh wrapper, sticky track) panned by scroll progress in the reading direction.
   Touch, small screens, reduced motion: a native scroll-snap row (no pin). The figure nearest the centre lifts. */
import { bustSVG } from './brand.js';
import { t, stickyProgress, reduced } from './core.js';

export function mountProcession(root, stages, { pin = false } = {}) {
  root.classList.add('procession', pin ? 'is-pinned' : 'is-flow');
  const label = (s) => t(s.label).replace('{n}', String(s.n));
  root.innerHTML = `
    <div class="procession-sticky">
      <ol class="procession-row">
        ${stages.map((s, i) => `
          <li class="procession-item" data-stage="${i}">
            <div class="procession-figure">${bustSVG(i + 1, { star: i === 4, label: label(s) })}</div>
            <div class="procession-stars" aria-hidden="true">${'<i></i>'.repeat(i + 1)}</div>
            <p class="procession-label${i === 0 || i === 4 ? '' : ' is-quiet'}">${label(s)}</p>
          </li>`).join('')}
      </ol>
      <div class="procession-ground" aria-hidden="true"></div>
    </div>`;
  const row = root.querySelector('.procession-row');
  const items = Array.from(root.querySelectorAll('.procession-item'));
  if (pin) {
    const dir = () => document.documentElement.dir === 'rtl' ? 1 : -1;
    stickyProgress(root, (p) => {
      const dist = Math.max(0, row.scrollWidth - row.clientWidth);
      row.style.transform = `translateX(${(dir() * dist * p).toFixed(1)}px)`;
      const idx = Math.min(items.length - 1, Math.round(p * (items.length - 1)));
      items.forEach((el, i) => el.classList.toggle('is-focus', i === idx));
      root.style.setProperty('--p', p.toFixed(3));
    });
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => en.target.classList.toggle('is-focus', en.isIntersecting && en.intersectionRatio > .6));
    }, { root: row, threshold: [0, .6, 1] });
    items.forEach(i => io.observe(i));
    // start at the reading start without relying on scrollLeft sign conventions
    requestAnimationFrame(() => items[0].scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'instant' }));
  }
  if (reduced()) items.forEach(el => el.classList.add('is-drawn'));
  document.addEventListener('bm:lang', () => {
    items.forEach((el, i) => { el.querySelector('.procession-label').textContent = label(stages[i]); el.querySelector('.bust').setAttribute('aria-label', label(stages[i])); });
  });
}
