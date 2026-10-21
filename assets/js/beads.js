/* Beads: the string of days on the Line. A 21-bead window of days. An empty day pushes a hollow bead; on the
   third consecutive empty bead the Line between them thins and the three most recent filled beads lose their
   fill one by one (the lazy rule). Recover restores them (twice per visit). Break reserves the next three beads
   under a laurel shield so empties inside do not count. New day (and the page's Day Ring) push a filled bead.
   Logical layout (no mirroring), transforms and opacity only, reduced motion = instant swaps. */
import { t, currentLang, reduced } from './core.js';

const W = 21;
const SPRIG = '<path d="M20 73Q19 40 23 11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path fill="currentColor" d="M19.9 66.4Q22.5 59.3 30 57.3Q27.9 63.6 19.9 66.4ZM19.9 66.4Q17.3 59.3 9.7 57.3Q11.8 63.6 19.9 66.4ZM19.8 54.8Q22.3 48 29.6 46.1Q27.6 52.1 19.8 54.8ZM19.8 54.8Q17.3 48 10.1 46.1Q12.1 52.1 19.8 54.8ZM20.1 43.5Q22.4 37.2 29.1 35.4Q27.3 41 20.1 43.5ZM20.1 43.5Q17.8 37.2 11.2 35.4Q13 41 20.1 43.5ZM20.8 32.4Q22.9 26.6 29 25Q27.3 30.1 20.8 32.4ZM20.8 32.4Q18.7 26.6 12.6 25Q14.3 30.1 20.8 32.4ZM21.7 21.6Q23.6 16.3 29.1 14.9Q27.6 19.5 21.7 21.6ZM21.7 21.6Q19.8 16.3 14.3 14.9Q15.8 19.5 21.7 21.6ZM23 12Q20.4 6.5 23.8 1Q26.4 6.5 23 12Z"/>';
const SHIELD = '<span class="beads-shield is-new"><svg class="beads-sprig" viewBox="0 0 40 76" aria-hidden="true"><use href="#beads-sprig"/></svg><svg class="beads-sprig beads-sprig-end" viewBox="0 0 40 76" aria-hidden="true"><use href="#beads-sprig"/></svg></span>';
// keys not yet in strings.js: local fallback (listed in the build report)
const FALLBACK = {
  'beads.string': { ar: 'سلسلة الأيام', en: 'String of days' },
  'beads.count': { ar: 'الأيام المكتملة: {f} من {n}.', en: 'Days filled: {f} of {n}.' },
  'beads.lost': { ar: 'ثلاثة أيام فارغة: ذهبت 3 نجوم.', en: 'Three empty days: 3 stars lost.' },
  'beads.recovered': { ar: 'عادت النجوم وعاد الخط كما كان.', en: 'Stars recovered and the Line is whole again.' },
  'beads.break': { ar: 'الأيام الثلاثة القادمة محمية.', en: 'The next 3 days are protected.' },
  'beads.unbreak': { ar: 'ألغيت الإجازة.', en: 'Break cancelled.' },
};
const tx = k => { const s = t(k); return s === k && FALLBACK[k] ? FALLBACK[k][currentLang()] : s; };

export function mountBeads(root) {
  const beads = [];                       // { f: filled, s: shielded, slot: reserved by a break, lost, r: recovered }
  for (let i = 1; i <= W; i++) beads.push({ f: i < 9 || i > 11, s: i === 15 || i === 16 });
  let pending = 0, recovers = 0;
  root.classList.add('beads');
  root.innerHTML = `
    <svg class="beads-defs" width="0" height="0" aria-hidden="true"><defs><g id="beads-sprig">${SPRIG}</g></defs></svg>
    <div class="beads-band" role="group">
      <div class="beads-scroller"><div class="beads-track" aria-hidden="true"></div></div>
      <p class="beads-caption" id="beads-caption"></p>
    </div>
    <div class="beads-chips" role="group" aria-describedby="beads-caption">
      <button type="button" class="chip" data-act="empty"></button>
      <button type="button" class="chip" data-act="recover"></button>
      <button type="button" class="chip" data-act="break" aria-pressed="false"></button>
      <button type="button" class="chip" data-act="newday"></button>
    </div>
    <p class="beads-live sr-only" aria-live="polite"></p>`;
  const q = s => root.querySelector(s);
  const track = q('.beads-track'), scroller = q('.beads-scroller'), live = q('.beads-live');
  const btn = {}; root.querySelectorAll('[data-act]').forEach(b => { btn[b.dataset.act] = b; });

  const cell = (fresh) => {
    const el = document.createElement('span');
    el.className = 'beads-cell' + (fresh ? ' is-new' : '');
    el.innerHTML = '<span class="beads-seg beads-seg-a"></span><span class="beads-dot"></span><span class="beads-seg beads-seg-b"></span>';
    track.appendChild(el); return el;
  };
  const arrive = el => { if (reduced()) el.classList.remove('is-new'); else requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-new'))); };
  const counted = b => !b.f && !b.s && !b.r && !b.lost && !b.slot;      // an empty day the lazy rule sees
  const runs = () => {                                                     // [start, length] of counted-empty runs
    const out = []; let i = 0;
    while (i < beads.length) { let j = i; while (j < beads.length && counted(beads[j])) j++; if (j > i) out.push([i, j - i]); i = j + (j === i ? 1 : 0); }
    return out;
  };

  function render(delay) {
    const thin = new Set();
    runs().forEach(([s, n]) => { if (n >= 3) for (let i = s; i < s + n - 1; i++) { thin.add('b' + i); thin.add('a' + (i + 1)); } });
    beads.forEach((b, i) => {
      const el = track.children[i], c = el.classList;
      c.toggle('is-empty', !b.f && !b.slot); c.toggle('is-slot', !!b.slot);
      c.toggle('is-thin-a', thin.has('a' + i)); c.toggle('is-thin-b', thin.has('b' + i));
      el.style.setProperty('--d', ((delay && delay.get(i)) || 0) + 'ms');
      let sh = el.querySelector('.beads-shield');
      if (b.s && !(beads[i - 1] && beads[i - 1].s)) {                      // first bead of a shielded group
        let w = 1; while (beads[i + w] && beads[i + w].s) w++;
        if (!sh) { el.insertAdjacentHTML('beforeend', SHIELD); sh = el.lastElementChild; arrive(sh); }
        sh.style.setProperty('--w', w);
      } else if (sh) sh.remove();
    });
    track.style.setProperty('--beads-shift', Math.max(0, beads.length - W));
    btn.recover.disabled = recovers >= 2 || !(beads.some(b => b.lost) || runs().some(r => r[1] >= 3));
    btn.break.setAttribute('aria-pressed', String(pending > 0));
  }
  function announce(msg) {
    const win = beads.slice(-W), f = win.filter(b => b.f).length;
    live.textContent = (msg ? msg + ' ' : '') + tx('beads.count').replace('{f}', String(f)).replace('{n}', String(win.length));
  }
  function reveal(el) {                                                    // phones: the string scrolls
    if (getComputedStyle(scroller).overflowX !== 'auto') return;
    const r = root.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    el.scrollIntoView({ inline: 'end', block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  }

  function push(filled = true) {
    let i;
    if (pending > 0) { i = beads.length - pending; beads[i] = { f: !!filled, s: true }; pending--; track.children[i].classList.add('is-new'); }
    else { i = beads.push({ f: !!filled }) - 1; cell(true); }
    const el = track.children[i]; let msg = '', delay;
    if (counted(beads[i])) {
      let a = i; while (a > 0 && counted(beads[a - 1])) a--;
      if (i - a + 1 === 3) {                                               // the lazy rule: three empties cost stars
        delay = new Map(); let k = 0;
        for (let j = a - 1; j >= 0 && k < 3; j--) if (beads[j].f && !beads[j].s) { beads[j].f = false; beads[j].lost = true; delay.set(j, k++ * 120); }
        if (k) msg = tx('beads.lost');
      }
    }
    render(delay); arrive(el); reveal(el); announce(msg);
  }
  function recover() {
    if (btn.recover.disabled) return;
    recovers++;
    const delay = new Map(); let k = 0;
    runs().forEach(([s, n]) => { if (n >= 3) for (let j = 0; j < n; j++) { beads[s + j].r = true; delay.set(s + j, j * 75); } });
    beads.forEach((b, i) => { if (b.lost) { b.lost = false; b.f = true; delay.set(i, 120 + k++ * 120); } });
    render(delay); announce(tx('beads.recovered'));
  }
  function toggleBreak() {
    if (pending > 0) {                                                     // cancel the unused part of the break
      beads.splice(beads.length - pending); while (track.children.length > beads.length) track.lastElementChild.remove();
      pending = 0; render(); announce(tx('beads.unbreak')); return;
    }
    pending = 3;
    for (let k = 0; k < 3; k++) { beads.push({ slot: true, s: true, f: false }); cell(false); }
    render(); reveal(track.lastElementChild); announce(tx('beads.break'));
  }
  function texts() {
    q('.beads-band').setAttribute('aria-label', tx('beads.string'));
    q('.beads-caption').textContent = t('commit.caption');
    btn.empty.textContent = t('commit.empty'); btn.recover.textContent = t('commit.recover');
    btn.break.textContent = t('commit.break'); btn.newday.textContent = t('commit.newday');
    live.textContent = '';
  }

  btn.empty.addEventListener('click', () => push(false));
  btn.newday.addEventListener('click', () => push(true));
  btn.recover.addEventListener('click', recover);
  btn.break.addEventListener('click', toggleBreak);
  document.addEventListener('bm:lang', texts);
  beads.forEach(() => cell(false));
  texts(); render();
  return { push };
}
