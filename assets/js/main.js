/* BetterMe landing: page orchestration. Modules are mounted into empty roots; failures are isolated. */
import { registerStrings, initLang, initTheme, initReveal, applyLang, t, qs, qsa, reduced, scrollProgress, stickyProgress, clamp } from './core.js';
import { STRINGS } from './strings.js';
import { mountProcession } from './procession.js';
import { mountDayRing } from './dayring.js';
import { mountCompare } from './compare.js';

registerStrings(STRINGS);
initLang();
initTheme();

const cfg = window.BM_CONFIG || {};
const html = document.documentElement;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const desktop = () => window.matchMedia('(min-width: 1024px)').matches;

/* ---------- CTA + footer from config (nothing invented) ---------- */
function renderCtas() {
  const url = (cfg.appStoreUrl || '').trim();
  qsa('[data-store-link]').forEach(a => {
    if (url) { a.href = url; a.rel = 'noopener'; a.target = '_blank'; }
    else { a.href = '#close'; a.removeAttribute('target'); }
  });
  const box = qs('#close-cta');
  if (url) box.innerHTML = `<a class="btn btn-primary btn-lg" href="${url}" rel="noopener" target="_blank"><svg aria-hidden="true"><use href="#i-apple-logo"/></svg><span>${t('cta.store')}</span></a>`;
  else box.innerHTML = `<span class="btn btn-primary btn-lg" aria-disabled="true" role="note"><svg aria-hidden="true"><use href="#i-apple-logo"/></svg><span>${t('cta.soon')}</span></span>`;
  const links = qs('#footer-links'); const items = [];
  if (cfg.privacyUrl) items.push(`<a href="${cfg.privacyUrl}" rel="noopener">${t('footer.privacy')}</a>`);
  if (cfg.termsUrl) items.push(`<a href="${cfg.termsUrl}" rel="noopener">${t('footer.terms')}</a>`);
  if (cfg.supportEmail) items.push(`<a href="mailto:${cfg.supportEmail}">${t('footer.support')}</a>`);
  links.innerHTML = items.join(''); links.hidden = !items.length; links.setAttribute('aria-label', t('footer.links'));
}
renderCtas();
document.addEventListener('bm:lang', renderCtas);

/* ---------- nav ---------- */
const nav = qs('#nav');
new IntersectionObserver(([en]) => nav.classList.toggle('is-solid', !en.isIntersecting), { rootMargin: '-64px 0px 0px 0px' }).observe(qs('.nav-sentinel'));

/* ---------- hero ---------- */
const hero = qs('#hero'), heroFigure = qs('#hero-figure'), heroStar = qs('#hero-star'), heroArt = qs('.hero-art');
let starLit = false;
function igniteStar() {
  if (starLit) return; starLit = true;
  hero.classList.add('is-lit'); heroStar.setAttribute('aria-pressed', 'true');
  drawTail();
}
heroStar.addEventListener('click', igniteStar);
requestAnimationFrame(() => { hero.classList.add('is-ready'); });
setTimeout(igniteStar, reduced() ? 300 : 4000);
// the tail: from the bust's base to the spine, then down to the section edge (desktop only)
const tail = qs('.hero-tail');
function drawTail() {
  if (!desktop()) { tail.style.display = 'none'; return; }
  const sr = hero.getBoundingClientRect(), ar = heroArt.getBoundingClientRect();
  const spineX = parseFloat(getComputedStyle(html).getPropertyValue('--spine-x')) || 24;
  const rtl = html.dir === 'rtl';
  const bustX = ar.left - sr.left + ar.width * 0.52, top = ar.top - sr.top + ar.height * 0.9;
  const sx = rtl ? sr.width - spineX : spineX;
  const W = sr.width, H = Math.max(24, sr.height - top);
  tail.style.display = 'block'; tail.style.top = `${top}px`; tail.style.height = `${H}px`; tail.style.left = '0'; tail.style.width = `${W}px`;
  tail.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const r = Math.min(24, H / 2);
  const dir = sx > bustX ? 1 : -1;
  tail.querySelector('path').setAttribute('d', `M${bustX} 0 V ${H - 1 - r} Q ${bustX} ${H - 1} ${bustX + dir * r} ${H - 1} H ${sx}`);
  hero.classList.add('has-tail');
}
addEventListener('resize', () => { if (starLit) drawTail(); });
document.addEventListener('bm:lang', () => { if (starLit) drawTail(); });
// raking light: desktop, fine pointer only, quantised
if (finePointer && !reduced()) {
  let raf = 0, la = 135;
  heroFigure.addEventListener('pointermove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = heroArt.getBoundingClientRect();
      const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      const q = Math.round((a + 90) / 4) * 4;
      if (q !== la) { la = q; heroArt.style.setProperty('--la', `${la}deg`); }
    });
  });
}

/* ---------- scenes: the spine draws as the pen (60% of the viewport) passes ---------- */
if (!reduced()) qsa('.scene').forEach(el => scrollProgress(el, p => el.style.setProperty('--p', p.toFixed(4))));
else qsa('.scene').forEach(el => el.style.setProperty('--p', '1'));

/* ---------- 2. procession ---------- */
mountProcession(qs('#procession-root'), [0, 1, 2, 3, 4].map(i => ({ label: i === 0 ? 'proc.idle' : i === 4 ? 'proc.golden' : 'proc.level', n: i + 1 })), { pin: desktop() && finePointer && !reduced() });

/* ---------- 3. stage (built as a separate module) ---------- */
import('./stage.js').then(m => m.mountStage(qs('#stage-root'))).catch(err => { console.warn('stage module unavailable', err); qs('#stage').hidden = true; });

/* ---------- 4. commit: day ring + beads ---------- */
let beads = null;
import('./beads.js').then(m => { beads = m.mountBeads(qs('#beads-root')); }).catch(err => { console.warn('beads module unavailable', err); qs('#beads-root').hidden = true; });
mountDayRing(qs('#dayring-root'), [
  { icon: 'barbell', label: 'ring.workout' }, { icon: 'bowl-food', label: 'ring.meals' }, { icon: 'drop', label: 'ring.water' },
  { icon: 'pill', label: 'ring.supps' }, { icon: 'footprints', label: 'ring.steps' }, { icon: 'check-circle', label: 'ring.checkin' },
], { onStar: () => { if (beads && beads.push) beads.push(true); } });

/* ---------- 5. agon ---------- */
import('./agon.js').then(m => m.mountAgon(qs('#agon-root'))).catch(err => { console.warn('agon module unavailable', err); qs('#agon').hidden = true; });

/* ---------- 6. carved line ---------- */
mountCompare(qs('#compare-root'), { onCut: p => qs('#carved').style.setProperty('--cut', p) });

/* ---------- 7. agora steles ---------- */
qsa('.stele-btn').forEach(b => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', String(on)); b.closest('.stele').classList.toggle('is-yours', on);
  const imp = b.closest('.stele').classList.contains('stele-import');
  b.querySelector('span').textContent = on ? t('agora.yours') : t(imp ? 'agora.importBtn' : 'agora.download');
}));
document.addEventListener('bm:lang', () => qsa('.stele-btn[aria-pressed="true"] span').forEach(s => { s.textContent = t('agora.yours'); }));

/* ---------- 8. close: the line arrives ---------- */
const close = qs('#close');
new IntersectionObserver((entries, io) => { if (entries[0].isIntersecting) { close.classList.add('is-in'); io.disconnect(); } }, { threshold: .35 }).observe(qs('#close-mark'));

initReveal();
