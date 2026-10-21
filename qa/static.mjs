// Reduced-motion run: stills in sequence, full-page screenshot, per-scene crops.
import { chromium } from "playwright-core";
const [W = "390", H = "844"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: +W, height: +H }, reducedMotion: "reduce", isMobile: +W < 600, hasTouch: +W < 600 })).newPage();
const logs = [];
page.on("pageerror", (e) => logs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") logs.push(m.text().slice(0, 200)); });
await page.goto((process.env.BASE || "http://localhost:3000") + "/?qa=1", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => ({ static: document.getElementById("film").dataset.static, h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, scenes: [...document.querySelectorAll(".scene")].map((s) => ({ id: s.dataset.scene, top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height), vis: getComputedStyle(s).visibility, op: getComputedStyle(s).opacity })) }));
console.log(JSON.stringify(info));
const ids = info.scenes.map((s) => s.id);
for (const s of info.scenes) {
  await page.evaluate((y) => scrollTo(0, y), s.top);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `qa/shots/static-${s.id}.png` });
}
console.log(logs.slice(0, 5));
await browser.close();
import { execFileSync } from "node:child_process";
execFileSync("python3", ["-c", `
from PIL import Image
ids=${JSON.stringify(ids)}
ims=[Image.open(f'qa/shots/static-{i}.png') for i in ids]
w,h=ims[0].size
cols=5
rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(w*cols,h*rows))
for i,im in enumerate(ims): s.paste(im,((i%cols)*w,(i//cols)*h))
sc=${+W > 800 ? 0.3 : 0.5}
s.resize((int(w*cols*sc),int(h*rows*sc))).save('qa/shots/static-sheet.png')
`]);
