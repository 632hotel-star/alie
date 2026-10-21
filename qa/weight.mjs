import { chromium } from "playwright-core";
import zlib from "node:zlib";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
const rows = [];
page.on("response", async (r) => {
  try { const b = await r.body(); rows.push({ url: r.url().replace("http://localhost:3100", ""), type: r.request().resourceType(), raw: b.length, gz: zlib.gzipSync(b).length, t: Date.now() }); } catch {}
});
const t0 = Date.now();
await page.goto("http://localhost:3100/?qa=1", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const first = rows.splice(0);
const sum = (a, f) => a.reduce((s, r) => s + f(r), 0);
const by = (a) => { const o = {}; a.forEach((r) => { o[r.type] = (o[r.type] || 0) + r.gz; }); return o; };
console.log("INITIAL gz bytes by type", by(first), "total", sum(first, (r) => r.gz));
console.log("INITIAL js files:", first.filter((r) => r.type === "script").map((r) => `${r.url.split("/").pop().slice(0, 40)} ${(r.gz / 1024).toFixed(1)}kB`).join(", "));
// walk down the page like a visitor
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let i = 1; i <= 40; i++) { await page.evaluate((y) => scrollTo(0, y), Math.round((total * i) / 40)); await page.waitForTimeout(350); }
await page.waitForTimeout(3000);
console.log("AFTER SCROLL extra gz by type", by(rows), "total", sum(rows, (r) => r.gz));
console.log("extra scripts:", rows.filter((r) => r.type === "script").map((r) => `${r.url.split("/").pop().slice(0, 40)} ${(r.gz / 1024).toFixed(1)}kB`).join(", "));
const big = rows.concat(first).sort((a, b) => b.gz - a.gz).slice(0, 8).map((r) => `${r.url.slice(0, 60)} ${(r.gz / 1024).toFixed(0)}kB`);
console.log("largest:", big);
const lcp = await page.evaluate(() => new Promise((res) => { new PerformanceObserver((l) => res(l.getEntries().at(-1).startTime)).observe({ type: "largest-contentful-paint", buffered: true }); setTimeout(() => res(null), 500); }));
console.log("LCP(ms)", lcp);
await browser.close();
