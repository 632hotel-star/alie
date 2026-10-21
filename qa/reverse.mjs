// Reversibility: visit film positions downward, then upward, and compare screenshots at each position.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
const [W = "390", H = "844", n = "14"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: +W, height: +H }, isMobile: +W < 600, hasTouch: +W < 600 })).newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const pos = Array.from({ length: +n }, (_, i) => Math.round(((i + 0.5) / +n) * total));
async function goTo(y) {
  const cur = await page.evaluate(() => scrollY);
  const steps = 10;
  for (let i = 1; i <= steps; i++) { await page.evaluate((v) => window.scrollTo(0, v), Math.round(cur + ((y - cur) * i) / steps)); await page.waitForTimeout(70); }
  await page.waitForTimeout(+(process.env.WAIT || 2600));
}
for (let i = 0; i < pos.length; i++) { await goTo(pos[i]); await page.screenshot({ path: `qa/shots/rv-down-${i}.png` }); }
for (let i = pos.length - 1; i >= 0; i--) { await goTo(pos[i]); await page.screenshot({ path: `qa/shots/rv-up-${i}.png` }); }
await browser.close();
const out = execFileSync("python3", ["-c", `
from PIL import Image, ImageChops
import numpy as np
for i in range(${n}):
    a=Image.open(f'qa/shots/rv-down-{i}.png').convert('RGB'); b=Image.open(f'qa/shots/rv-up-{i}.png').convert('RGB')
    d=np.asarray(ImageChops.difference(a,b)).astype(float)
    print(i, 'mean diff %.3f' % d.mean(), 'pixels>40: %d' % int((d.max(axis=2)>40).sum()))
`]).toString();
console.log(out); console.log("errors:", errs.slice(0, 5));
