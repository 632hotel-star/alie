import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const layout = JSON.parse(await page.evaluate(() => document.getElementById("film").dataset.layout));
const s = layout.find((l) => l.id === "train");
const y = Math.round((s.start + 0.2 * s.len) * 844);
await page.evaluate((v) => scrollTo(0, v), y);
for (let k = 0; k < 14; k++) {
  await page.waitForTimeout(500);
  console.log(k, JSON.stringify(await page.evaluate(() => ({ y: Math.round(scrollY), stp: +__film.st.progress.toFixed(4), master: +__film.master.progress().toFixed(4), title: getComputedStyle(document.querySelector('[data-scene="train"] .scene__title')).opacity, trainFrame: getComputedStyle(document.querySelector('[data-scene="train"]')).opacity + '/' + getComputedStyle(document.querySelector('[data-scene="train"]')).visibility }))));
}
await browser.close();
