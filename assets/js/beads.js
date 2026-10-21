/* Beads: the string of days on the Line. A 21-bead window of days. An empty day pushes a hollow bead; on the
   third consecutive empty bead the Line between them thins and the three most recent filled beads lose their
   fill one by one (the lazy rule). Recover restores them (twice per visit). Break reserves the next three beads
   under a laurel shield so empties inside do not count. New day (and the page's Day Ring) push a filled bead.
   Logical layout (no mirroring), transforms and opacity only, reduced motion = instant swaps. */
import { t, currentLang, reduced } from './core.js';

const W = 21;
const SPRIG = '<path d="M20 120C26 80 22 40 30 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path fill="currentColor" d="M21.3 110Q23.4 99 35.6 94.1Q32.1 106.7 21.3 110ZM21.3 110Q11.5 104.4 10.9 91.3Q21.7 98.8 21.3 110ZM23 90.1Q24.4 79.6 35.6 74.5Q32.9 86.5 23 90.1ZM23 90.1Q13.5 85.3 12.3 73.1Q22.8 79.5 23 90.1ZM23.9 70.4Q25 60.6 35.4 55.6Q33.1 66.9 23.9 70.4ZM23.9 70.4Q15 66.2 13.6 54.7Q23.5 60.6 23.9 70.4ZM24.7 51.2Q25.8 42 35.5 37.4Q33.3 48 24.7 51.2ZM24.7 51.2Q16.4 47.2 15.2 36.5Q24.4 42 24.7 51.2ZM25.9 32.5Q27.3 24.1 36.5 20.2Q34 29.9 25.9 32.5ZM25.9 32.5Q18.4 28.5 17.7 18.5Q26 24 25.9 32.5ZM28.2 14.6Q30.2 7 38.9 4.1Q35.9 12.8 28.2 14.6ZM28.2 14.6Q21.7 10.3 21.8 1.1Q29 6.8 28.2 14.6Z"/>';
const SHIELD = '<svg class="beads-shield is-new" viewBox="0 0 120 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><use href="#beads-sprig" transform="translate(14 58) rotate(43) scale(.6) translate(-20 -120)"/><use href="#beads-sprig" transform="translate(106 58) rotate(-43) scale(-.6 .6) translate(-20 -120)"/></svg>';
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
