import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 220)}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => logs.push(`[requestfailed] ${r.url()}`));
await page.goto((process.env.BASE || "http://localhost:3100") + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let i = 1; i <= 30; i++) { await page.evaluate((y) => scrollTo(0, y), Math.round((total * i) / 30)); await page.waitForTimeout(300); }
for (let i = 29; i >= 0; i--) { await page.evaluate((y) => scrollTo(0, y), Math.round((total * i) / 30)); await page.waitForTimeout(200); }
await page.waitForTimeout(1500);
console.log(logs.length ? logs.join("\n") : "no console output");
const mem = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + " MB heap" : "n/a");
console.log(mem);
await browser.close();
