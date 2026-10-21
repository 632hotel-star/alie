# Deployment

## Vercel (recommended)

1. Import the repository in Vercel (framework preset: Next.js, no build overrides).
2. Add the environment variables from `.env.example` in Project Settings → Environment Variables:
   `NEXT_PUBLIC_SITE_URL` (the final https URL), `NEXT_PUBLIC_BRAND_NAME`, and later `NEXT_PUBLIC_APP_STORE_URL`.
3. Deploy. Attach the custom domain in Project Settings → Domains and set `NEXT_PUBLIC_SITE_URL` to it so Open Graph tags, `robots.txt` and `sitemap.xml` point at the right host.

## Static hosting (Netlify, Cloudflare Pages, S3, GitHub Pages)

```bash
NEXT_OUTPUT=export npm run build     # writes ./out
```

Upload `./out`. Everything is prerendered; no server features are used.

## Any Node host

```bash
npm run build
npm start        # PORT=3000 by default; use `next start -p 8080` to change
```

## Launch checklist

- [ ] Set `NEXT_PUBLIC_APP_STORE_URL` the day the app is really live. The header, hero and finale CTA switch to "حمّل من App Store" by themselves.
- [ ] Until then, optionally set `NEXT_PUBLIC_CONTACT_EMAIL` to turn the CTA into "سجّل اهتمامك".
- [ ] Have the owner and a lawyer review `/privacy` and `/terms` (they are honest drafts, marked as such on the page).
- [ ] Add the stage 1 artwork (see README) and the section illustrations listed in `ASSETS_AND_LICENSES.md`.
- [ ] Re-check the brand name. It is a working name and is centralised in one variable.
- [ ] Test on a real iPhone (Safari and Low Power Mode) before announcing. See the limits in `PERFORMANCE.md`.

## Caching

Static assets under `/fonts`, `/characters`, `/brand`, `/posters` are immutable by content; give them a long `Cache-Control` at your CDN (Vercel does this for `/_next/static` automatically; add a header rule for the others if you like).
