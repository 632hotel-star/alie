import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const layout = JSON.parse(await page.evaluate(() => document.getElementById("film").dataset.layout));
const at = (id, p) => { const s = layout.find((l) => l.id === id); return Math.round((s.start + p * s.len) * 844); };
async function go(y) {
  const cur = await page.evaluate(() => scrollY);
  for (let i = 1; i <= 10; i++) { await page.evaluate((v) => scrollTo(0, v), Math.round(cur + ((y - cur) * i) / 10)); await page.waitForTimeout(60); }
  // poll until the observed values stop changing
  let last = "", stable = 0;
  for (let k = 0; k < 80 && stable < 6; k++) {
    await page.waitForTimeout(250);
    const v = await page.evaluate(() => [...document.querySelectorAll('[data-scene="train"] .scene__title, [data-scene="progress"] .cam__live')].map((e) => getComputedStyle(e).transform + "|" + getComputedStyle(e).opacity).join(" ; "));
    if (v === last) stable++; else { stable = 0; last = v; }
  }
  return last;
}
const y1 = at("train", 0.2), y2 = at("progress", 0.2);
const a = await go(y1);
await go(y2);
const b = await go(y1);
console.log("A (from above):", a); console.log("B (from below):", b, a === b ? "EQUAL" : "DIFFERENT");
await browser.close();
