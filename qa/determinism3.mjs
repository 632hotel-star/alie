import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const layout = JSON.parse(await page.evaluate(() => document.getElementById("film").dataset.layout));
const s = layout.find((l) => l.id === "train");
const y = Math.round((s.start + 0.2 * s.len) * 844);
const t0 = Date.now();
const cur = 0;
for (let i = 1; i <= 10; i++) { await page.evaluate((v) => scrollTo(0, v), Math.round(cur + ((y - cur) * i) / 10)); await page.waitForTimeout(60); }
for (let k = 0; k < 24; k++) {
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({ y: Math.round(scrollY), stp: +__film.st.progress.toFixed(4), master: +__film.master.progress().toFixed(4), title: getComputedStyle(document.querySelector('[data-scene="train"] .scene__title')).opacity, gl: !!document.querySelector("canvas.gl-canvas") }));
  console.log(Date.now() - t0, JSON.stringify(r));
}
await browser.close();
