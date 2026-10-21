/* Day Ring: six commitments around an open ring. Tap a commitment to complete it, the ring closes by one
   share; when every ACTIVE commitment is done the star ignites and a streak tile is earned. Each commitment
   has a small switch to turn it off (optional streaks). Pure DOM + inline SVG, RTL aware (order follows the
   reading direction), keyboard accessible (buttons), reduced-motion safe (CSS handles transitions). */
import { STAR } from './brand.js';
import { t, currentLang } from './core.js';

const R = 132, C = 170;                      // ring radius and centre in a 340x340 viewBox
const CIRC = 2 * Math.PI * R;

export function mountDayRing(root, items, { onStar } = {}) {
  const state = items.map(it => ({ ...it, active: true, done: false }));
  let streak = 0, starLit = false;
  root.classList.add('dayring');
  root.innerHTML = `
    <div class="dayring-stage">
      <svg class="dayring-svg" viewBox="0 0 340 340" aria-hidden="true">
        <circle class="dayring-track" cx="${C}" cy="${C}" r="${R}" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 7" />
        <circle class="dayring-fill" cx="${C}" cy="${C}" r="${R}" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round"
                stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}" transform="rotate(-90 ${C} ${C})" />
        <g class="dayring-star" transform="translate(${C - 58} ${C - 48}) scale(.5)"><path d="${STAR}" transform="translate(-1036 -493)" fill="currentColor"/></g>
      </svg>
      <div class="dayring-items"></div>
      <p class="dayring-caption" aria-live="polite"></p>
    </div>
    <div class="dayring-footer">
      <ol class="streak" aria-label="streak"></ol>
      <button type="button" class="chip dayring-next"></button>
    </div>`;
  const itemsEl = root.querySelector('.dayring-items');
  const fill = root.querySelector('.dayring-fill');
  const star = root.querySelector('.dayring-star');
  const caption = root.querySelector('.dayring-caption');
  const streakEl = root.querySelector('.streak');
  const nextBtn = root.querySelector('.dayring-next');

  // place items around the ring, starting at the top, following the reading direction
  const dir = () => document.documentElement.dir === 'rtl' ? -1 : 1;
  function layout() {
    itemsEl.innerHTML = '';
    state.forEach((it, i) => {
      const a = -Math.PI / 2 + dir() * (i / state.length) * Math.PI * 2;
      const x = 50 + (R / 340) * 100 * Math.cos(a), y = 50 + (R / 340) * 100 * Math.sin(a);
      const el = document.createElement('div');
      el.className = 'dayring-item' + (it.done ? ' is-done' : '') + (it.active ? '' : ' is-off');
      el.style.setProperty('--x', x + '%'); el.style.setProperty('--y', y + '%');
      el.innerHTML = `
        <button type="button" class="dayring-glyph" aria-pressed="${it.done}" aria-label="${t(it.label)}">
          <svg aria-hidden="true"><use href="#i-${it.icon}"/></svg>
        </button>
        <span class="dayring-label">${t(it.label)}</span>
        <button type="button" class="dayring-switch" role="switch" aria-checked="${it.active}" aria-label="${t('ring.toggle')} ${t(it.label)}"><i></i></button>`;
      el.querySelector('.dayring-glyph').addEventListener('click', () => { if (!it.active) return; it.done = !it.done; update(); });
      el.querySelector('.dayring-switch').addEventListener('click', () => { it.active = !it.active; if (!it.active) it.done = false; update(); });
      itemsEl.appendChild(el);
    });
    streakEl.innerHTML = Array.from({ length: 7 }, (_, i) => `<li class="${i < streak ? 'is-star' : ''}"><svg viewBox="0 0 200 200" aria-hidden="true"><path d="${STAR}" transform="translate(-1036 -493)" fill="currentColor"/></svg></li>`).join('');
    nextBtn.textContent = t('ring.next');
  }
  function update() {
    const active = state.filter(s => s.active);
    const done = active.filter(s => s.done).length;
    const share = active.length ? done / active.length : 0;
    fill.style.strokeDashoffset = String(CIRC * (1 - share));
    const complete = active.length > 0 && done === active.length;
    if (complete && !starLit) { starLit = true; root.classList.add('is-complete'); onStar && onStar(); }
    if (!complete && starLit) { starLit = false; root.classList.remove('is-complete'); }
    caption.textContent = complete ? t('ring.done') : (done ? t('ring.progress').replace('{n}', String(active.length - done)) : t('ring.hint'));
    // re-render item states without rebuilding
    itemsEl.querySelectorAll('.dayring-item').forEach((el, i) => {
      const it = state[i];
      el.classList.toggle('is-done', it.done); el.classList.toggle('is-off', !it.active);
      el.querySelector('.dayring-glyph').setAttribute('aria-pressed', String(it.done));
      el.querySelector('.dayring-switch').setAttribute('aria-checked', String(it.active));
    });
    nextBtn.disabled = !complete;
  }
  nextBtn.addEventListener('click', () => {
    if (!starLit) return;
    streak = Math.min(7, streak + 1);
    state.forEach(s => { s.done = false; });
    starLit = false; root.classList.remove('is-complete'); root.classList.add('is-reset');
    setTimeout(() => root.classList.remove('is-reset'), 400);
    layout(); update();
  });
  document.addEventListener('bm:lang', () => { layout(); update(); });
  layout(); update();
  return { state };
}
