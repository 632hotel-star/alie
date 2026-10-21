# BetterMe — الموقع التعريفي الرسمي / Official landing page

موقع ثابت (HTML / CSS / JS) بلا أي اعتماديات أو خطوة بناء. العربية هي اللغة الافتراضية مع نسخة إنجليزية كاملة، ووضع داكن افتراضي مع وضع فاتح تلقائي.

A static site: plain HTML, CSS and JavaScript modules, no build step, no third-party scripts. Arabic (RTL) is the default with a full English version; dark is the designed default with an automatic light mode and a manual toggle.

## قبل النشر / Before publishing

Edit `site.config.js`:

```js
window.BM_CONFIG = {
  appStoreUrl: "",   // the real App Store link. Empty = the CTA shows "Coming to the App Store" and never links anywhere fake
  privacyUrl: "", termsUrl: "", supportEmail: "",   // optional footer links, shown only when set
};
```

Optionally replace `assets/img/og.png` (1200x630) with your own social preview.

## النشر / Deploy

Any static host works (GitHub Pages, Netlify, Vercel, Cloudflare Pages, a plain web server). Upload the repository as is; `index.html` is the entry point. Serve over HTTPS; no server code, no environment variables.

- GitHub Pages: Settings → Pages → deploy from the branch root.
- Local preview: `python3 -m http.server 8080` then open `http://localhost:8080/`. The ES modules need HTTP, so opening the file directly will not run the interactions.

## البنية / Structure

```
index.html            the page (inline SVG symbols: logo geometry, icons, engraving patterns)
site.config.js        store link and optional footer links
assets/css/tokens.css design tokens (palette for both themes, type scale, spacing, motion)
assets/css/site.css   layout and components
assets/css/*.css      section modules (stage, agon, beads)
assets/js/core.js     language and direction switch, theme, reveal observer, scroll progress helpers
assets/js/strings.js  the bilingual dictionary (Arabic and English side by side per key)
assets/js/brand.js    the brand geometry traced from the logo and the five-state engraved figure
assets/js/main.js     page orchestration
assets/js/*.js        section modules: procession, dayring, beads, stage, agon, compare
assets/fonts/         self-hosted Google Fonts subsets (Reem Kufi, IBM Plex Sans Arabic, Cormorant Garamond, Cinzel, Manrope)
assets/img/           logo (SVG and PNG), favicons, grain tile, statue mask, wordmark
tools/                one-time helpers used during the build
```

## القواعد المتبعة / Conventions

- `?lang=en` or `?lang=ar` forces a language; `?theme=light` or `?theme=dark` forces a theme. Both persist in `localStorage`.
- Copy lives only in `assets/js/strings.js`; markup uses `data-i18n="key"`. Digits are always Latin 0-9.
- No phone mockups or app screenshots, no free vs paid split, no invented numbers, ratings or testimonials, no fake links.
- Motion respects `prefers-reduced-motion`; there are no scroll listeners and no loops.

Icons: Phosphor Icons (MIT). Fonts: Google Fonts (OFL).
