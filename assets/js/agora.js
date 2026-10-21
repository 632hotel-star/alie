/* Agora: friends on a leaderboard with two competition modes (stars / lifts / both). Switching modes re-sorts
   with a FLIP move so the two rules are felt, not explained. Tapping "you" adds a star (feedback). Names are
   illustrative first names; numbers are illustrative sample values inside the drawing, never claims. */
import { bustSVG } from './brand.js';
import { t, reduced } from './core.js';

export function mountAgora(root, friends) {
  const data = friends.map(f => ({ ...f }));
  let mode = 'stars';
  root.classList.add('agora');
  root.innerHTML = `
    <div class="agora-modes" role="radiogroup" aria-label="${t('agora.mode')}">
      ${['stars', 'lifts', 'both'].map(m => `<button type="button" role="radio" aria-checked="${m === mode}" data-mode="${m}" class="chip">${t('agora.' + m)}</button>`).join('')}
    </div>
    <ol class="agora-list"></ol>`;
  const list = root.querySelector('.agora-list');
  const score = f => mode === 'stars' ? f.stars : mode === 'lifts' ? f.lift : f.stars * 4 + f.lift / 5;
  function render() {
    const max = Math.max(...data.map(score));
    const sorted = [...data].sort((a, b) => score(b) - score(a));
    list.innerHTML = sorted.map((f, i) => `
      <li class="agora-row ${f.you ? 'is-you' : ''}" data-id="${f.id}" style="--h:${(score(f) / max).toFixed(3)}">
        <div class="agora-column"><div class="agora-shaft"></div><div class="agora-cap"></div></div>
        <div class="agora-medal">${bustSVG(f.stage, { label: '' })}</div>
        <div class="agora-meta">
          <span class="agora-name">${f.you ? t('agora.you') : t(f.name)}</span>
          <bdi class="agora-score num">${mode === 'lifts' ? f.lift + ' kg' : mode === 'stars' ? f.stars + ' ★' : f.stars + ' ★ · ' + f.lift + ' kg'}</bdi>
        </div>
        ${f.you ? `<button type="button" class="agora-add chip" aria-label="${t('agora.addStar')}">+1 ★</button>` : ''}
      </li>`).join('');
    const add = list.querySelector('.agora-add');
    if (add) add.addEventListener('click', () => { const me = data.find(f => f.you); me.stars += 1; flip(); });
  }
  function flip() {
    const first = new Map(); list.querySelectorAll('.agora-row').forEach(el => first.set(el.dataset.id, el.getBoundingClientRect()));
    render();
    if (reduced()) return;
    list.querySelectorAll('.agora-row').forEach(el => {
      const a = first.get(el.dataset.id), b = el.getBoundingClientRect();
      if (!a) return;
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0,0)' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
  }
  root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    root.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    flip();
  }));
  document.addEventListener('bm:lang', () => { root.querySelectorAll('[data-mode]').forEach(b => { b.textContent = t('agora.' + b.dataset.mode); }); render(); });
  render();
}
