/* BetterMe landing: scroll-driven page. No clicks are needed to understand anything. */
import { registerStrings, initLang, initTheme, initReveal, t, qs, qsa, reduced, stickyProgress, scrollProgress } from './core.js';
import { STRINGS } from './strings.js';
registerStrings(STRINGS); initLang(); initTheme();

const cfg = window.BM_CONFIG || {};
function renderCtas() {
  const url = (cfg.appStoreUrl || '').trim();
  qsa('[data-store-link]').forEach(a => { if (url) { a.href = url; a.rel = 'noopener'; a.target = '_blank'; } else { a.href = '#close'; a.removeAttribute('target'); } });
  qs('#close-cta').innerHTML = url
    ? `<a class="btn btn-primary btn-lg" href="${url}" rel="noopener" target="_blank"><svg aria-hidden="true"><use href="#i-apple-logo"/></svg><span>${t('cta.store')}</span></a>`
    : `<p class="btn btn-primary btn-lg" aria-disabled="true"><svg aria-hidden="true"><use href="#i-apple-logo"/></svg><span>${t('cta.soon')}</span></p>`;
  const links = qs('#footer-links'); const items = [];
  if (cfg.privacyUrl) items.push(`<a href="${cfg.privacyUrl}" rel="noopener">${t('footer.privacy')}</a>`);
  if (cfg.termsUrl) items.push(`<a href="${cfg.termsUrl}" rel="noopener">${t('footer.terms')}</a>`);
  if (cfg.supportEmail) items.push(`<a href="mailto:${cfg.supportEmail}">${t('footer.support')}</a>`);
  links.innerHTML = items.join(''); links.hidden = !items.length; links.setAttribute('aria-label', t('footer.links'));
}
renderCtas(); document.addEventListener('bm:lang', renderCtas);

/* nav turns solid once the hero scrolls away */
new IntersectionObserver(([en]) => qs('#nav').classList.toggle('is-solid', !en.isIntersecting), { rootMargin: '-80px 0px 0px 0px' }).observe(qs('.nav-sentinel'));

/* pinned scenes: wrapper height from data-pin (vh); progress written to --p */
const counters = qsa('[data-count]'), rest = qs('[data-rest]');
qsa('.scene[data-pin]').forEach(sec => {
  if (reduced()) { sec.style.setProperty('--p', '1'); counters.forEach(c => c.textContent = c.dataset.count); return; }
  sec.style.height = `${sec.dataset.pin}vh`;
  stickyProgress(sec, p => {
    sec.style.setProperty('--p', p.toFixed(4));
    if (sec.id === 'train') {
      counters.forEach(c => { const row = c.closest('.ledger-row'); const a = parseFloat(row.style.getPropertyValue('--a')), b = parseFloat(row.style.getPropertyValue('--b')); const k = Math.min(1, Math.max(0, (p - a) / (b - a))); c.textContent = String(Math.round(Number(c.dataset.count) * (0.6 + 0.4 * k))); });
      if (rest) rest.textContent = String(Math.max(0, Math.round(60 - 60 * Math.min(1, Math.max(0, (p - .45) / .15)))));
    }
  });
});
/* the close draws the logo as it arrives */
if (!reduced()) scrollProgress(qs('#close'), p => qs('#close').style.setProperty('--p', p.toFixed(4)), { pen: .75 }); else qs('#close').style.setProperty('--p', '1');
initReveal();
