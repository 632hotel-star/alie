// Usage: node qa/shot.mjs <name> <width> <height> <url> <scroll fractions comma list of film progress 0..1> [gl=1]
import { chromium } from "playwright-core";
import fs from "node:fs";
const [name, W, H, url = "http://localhost:3000", fr = "0", opts = ""] = process.argv.slice(2);
const exe = fs.existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome") ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined;
const browser = await chromium.launch({ executablePath: exe, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: opts.includes("dpr2") ? 2 : 1, isMobile: +W < 600, hasTouch: +W < 600, reducedMotion: opts.includes("reduced") ? "reduce" : "no-preference" });
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(opts.includes("fast") ? 500 : 3800);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (const f of fr.split(",")) {
  const y = Math.round(parseFloat(f) * total);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `qa/shots/${name}-${f}.png` });
}
const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, total: document.documentElement.scrollHeight, vh: innerHeight }));
console.log(JSON.stringify({ overflow, logs: logs.slice(0, 12) }));
await browser.close();
