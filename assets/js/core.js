/* BetterMe landing: runtime core (no dependencies).
   - language (ar default / en), direction, persisted + ?lang=
   - theme (auto / light / dark), persisted + ?theme=
   - reveal-on-scroll via IntersectionObserver
   - stickyProgress(): 0..1 progress for pinned (position: sticky) scenes, rAF-batched, no scroll listeners in hot paths
*/
export const qs = (s, r = document) => r.querySelector(s);
export const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

/* ---------- language ---------- */
let STRINGS = {};
export function registerStrings(dict) { STRINGS = dict; }
export function currentLang() { return document.documentElement.lang === 'en' ? 'en' : 'ar'; }
export function t(key, lang = currentLang()) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] ?? entry.ar ?? key;
}
export function applyLang(lang, { persist = true } = {}) {
  lang = lang === 'en' ? 'en' : 'ar';
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  qsa('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key, lang);
    if (el.dataset.i18nAttr) el.setAttribute(el.dataset.i18nAttr, val);
    else el.innerHTML = val;
  });
  qsa('[data-lang-toggle]').forEach(b => {
    const other = lang === 'ar' ? 'en' : 'ar';
    b.textContent = other === 'en' ? 'English' : 'العربية';
    b.setAttribute('lang', other);
    b.setAttribute('aria-label', other === 'en' ? 'Switch to English' : 'التبديل إلى العربية');
  });
  document.title = t('meta.title', lang);
  const desc = qs('meta[name="description"]'); if (desc) desc.content = t('meta.description', lang);
  if (persist) store.set('bm-lang', lang);
  document.dispatchEvent(new CustomEvent('bm:lang', { detail: { lang } }));
}
export function initLang() {
  const fromQuery = params.get('lang');
  const lang = fromQuery || store.get('bm-lang') || 'ar';
  applyLang(lang, { persist: !!fromQuery });
  qsa('[data-lang-toggle]').forEach(b => b.addEventListener('click', () => applyLang(currentLang() === 'ar' ? 'en' : 'ar')));
}

/* ---------- theme ---------- */
const mq = window.matchMedia('(prefers-color-scheme: light)');
export function resolvedTheme() {
  const pref = document.documentElement.dataset.theme;
  if (pref === 'light' || pref === 'dark') return pref;
  return mq.matches ? 'light' : 'dark';
}
export function applyTheme(mode, { persist = true } = {}) {
  const html = document.documentElement;
  if (mode === 'light' || mode === 'dark') html.dataset.theme = mode; else delete html.dataset.theme;
  const meta = qs('meta[name="theme-color"]');
  if (meta) meta.content = resolvedTheme() === 'light' ? '#F4F5F8' : '#0A0D16';
  qsa('[data-theme-toggle]').forEach(b => b.setAttribute('aria-pressed', String(resolvedTheme() === 'light')));
  if (persist) store.set('bm-theme', mode || 'auto');
  document.dispatchEvent(new CustomEvent('bm:theme', { detail: { theme: resolvedTheme() } }));
}
export function initTheme() {
  const fromQuery = params.get('theme');
  const saved = store.get('bm-theme');
  applyTheme(fromQuery || (saved && saved !== 'auto' ? saved : null), { persist: !!fromQuery });
  mq.addEventListener('change', () => applyTheme(document.documentElement.dataset.theme || null, { persist: false }));
  qsa('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => applyTheme(resolvedTheme() === 'light' ? 'dark' : 'light')));
}

/* ---------- reveal on scroll ---------- */
export function initReveal(selector = '[data-reveal]') {
  const els = qsa(selector);
  if (!els.length) return;
  if (reduced() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  els.forEach(e => io.observe(e));
}

/* ---------- sticky scene progress ----------
   wrapper: a tall element containing a position: sticky child. progress = how far the wrapper has scrolled
   through the viewport while the child is pinned (0 at pin start, 1 at pin end). Callback runs only while
   the wrapper is near the viewport (IO gate) and only when the value changes (rAF). */
export function stickyProgress(wrapper, onProgress, { scrub = 0.18 } = {}) {
  let active = false, raf = 0, last = -1, target = 0, current = 0;
  const instant = reduced();
  const compute = () => {
    const r = wrapper.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    return span <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / span));
  };
  const tick = () => {
    target = compute();
    current = instant ? target : current + (target - current) * scrub;
    if (Math.abs(current - target) < 0.0005) current = target;
    if (current !== last) { last = current; onProgress(current); }
    raf = active || current !== target ? requestAnimationFrame(tick) : 0;
  };
  const io = new IntersectionObserver(([en]) => {
    active = en.isIntersecting;
    if (active && !raf) raf = requestAnimationFrame(tick);
  }, { rootMargin: '20% 0px 20% 0px' });
  io.observe(wrapper);
  onProgress(compute());
  return () => { io.disconnect(); cancelAnimationFrame(raf); };
}

/* ---------- small utils ---------- */
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = { out: t => 1 - Math.pow(1 - t, 3), inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 };
export function range(a, b, t) { return clamp((t - a) / (b - a)); }
