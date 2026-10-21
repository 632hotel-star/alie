/* Procession: the five carving states of the one figure on the Line.
   Desktop with a fine pointer: a pinned frieze (300vh wrapper, sticky track) panned by scroll progress in the reading direction.
   Touch, small screens, reduced motion: a native scroll-snap row (no pin). The figure nearest the centre lifts. */
import { t, stickyProgress, reduced } from './core.js';

export function mountProcession(root, stages, { pin = false } = {}) {
  root.classList.add('procession', pin ? 'is-pinned' : 'is-flow');
  const label = (s) => t(s.label).replace('{n}', String(s.n));
  const head = root.querySelector('.section-head');
  const sticky = document.createElement('div'); sticky.className = 'procession-sticky';
  if (head) sticky.appendChild(head);
  sticky.insertAdjacentHTML('beforeend', `
    <div class="procession-track">
      <ol class="procession-row">
        ${stages.map((s, i) => `
          <li class="procession-item" data-stage="${i}">
            <div class="procession-figure"><img src="assets/img/characters/${['1-idle','2','3','4','5-golden'][i]}.webp" alt="${label(s)}" width="${[1100,1054,1021,1088,1088][i]}" height="1100" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async"></div>
            <div class="procession-meta"><div class="procession-stars" aria-hidden="true">${'<i></i>'.repeat(i + 1)}</div>
            <p class="procession-label${i === 0 || i === 4 ? '' : ' is-quiet'}">${label(s)}</p></div>
          </li>`).join('')}
      </ol>
      <div class="procession-ground" aria-hidden="true"></div>
    </div>`);
  root.innerHTML = ''; root.appendChild(sticky);
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
  }
  if (reduced()) items.forEach(el => el.classList.add('is-drawn'));
  document.addEventListener('bm:lang', () => {
    items.forEach((el, i) => { el.querySelector('.procession-label').textContent = label(stages[i]); el.querySelector('img').alt = label(stages[i]); });
  });
}
