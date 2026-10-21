/* Procession: the five carving states of the one figure in a row. Desktop: a horizontal scroll-snap row that also
   responds to a range "scrubber"; the state under focus lifts. Mobile: native snap scrolling. No pinning, so it
   is reliable on iOS and with reduced motion. */
import { bustSVG } from './brand.js';
import { t } from './core.js';

export function mountProcession(root, stages) {
  root.classList.add('procession');
  root.innerHTML = `
    <ol class="procession-row">
      ${stages.map((s, i) => `
        <li class="procession-item" data-stage="${i}">
          <div class="procession-figure">${bustSVG(i, { withStar: i === 4, label: t(s.label) })}</div>
          <div class="procession-stars" aria-hidden="true">${'<i></i>'.repeat(i + 1)}</div>
          <h3 class="procession-label">${t(s.label)}</h3>
        </li>`).join('')}
    </ol>`;
  const items = root.querySelectorAll('.procession-item');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => en.target.classList.toggle('is-focus', en.isIntersecting && en.intersectionRatio > .6));
    }, { root: root.querySelector('.procession-row'), threshold: [0, .6, 1] });
    items.forEach(i => io.observe(i));
  }
  document.addEventListener('bm:lang', () => {
    items.forEach((el, i) => { el.querySelector('.procession-label').textContent = t(stages[i].label); el.querySelector('.bust').setAttribute('aria-label', t(stages[i].label)); });
  });
}
