// Usage: node qa/seq.mjs <name> <w> <h> <sceneId> <p list> [opts: slow cols6 big dpr2 reduced]
// Scene positions come from film.dataset.layout (svh units), so it works for any viewport.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
const [name, W, H, sceneId, ps] = process.argv.slice(2);
const opts = process.argv.slice(7).join(" ");
const glArgs = opts.includes("nogl") ? ["--disable-3d-apis", "--disable-gpu"] : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: glArgs });
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: opts.includes("dpr2") ? 2 : 1, isMobile: +W < 600, hasTouch: +W < 600, reducedMotion: opts.includes("reduced") ? "reduce" : "no-preference" });
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => { if (m.type() === "error" || (m.type() === "warning" && !m.text().includes("preload"))) logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
const layout = JSON.parse((await page.evaluate(() => document.getElementById("film")?.dataset.layout)) || "[]");
const sc = layout.find((l) => l.id === sceneId);
const files = [];
for (const p of ps.split(",")) {
  const y = sc ? Math.round((sc.start + parseFloat(p) * sc.len) * +H) : Math.round(parseFloat(p) * +H);
  const cur = await page.evaluate(() => scrollY);
  const steps = 8;
  for (let i = 1; i <= steps; i++) { await page.evaluate((v) => window.scrollTo(0, v), Math.round(cur + ((y - cur) * i) / steps)); await page.waitForTimeout(80); }
  await page.waitForTimeout(opts.includes("slow") ? 2600 : 1600);
  const f = `qa/shots/${name}-${p}.png`;
  await page.screenshot({ path: f });
  files.push(f);
}
console.log(JSON.stringify({ logs: logs.slice(0, 8), doc: await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]), layout: layout.map((l) => `${l.id}:${l.start}+${l.len}`).join(" ") }));
await browser.close();
const cols = opts.includes("cols6") ? 6 : opts.includes("cols3") ? 3 : 4;
execFileSync("python3", ["-c", `
from PIL import Image
fs=${JSON.stringify(files)}
ims=[Image.open(f) for f in fs]
w,h=ims[0].size
cols=min(len(ims),${cols})
rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(w*cols,h*rows))
for i,im in enumerate(ims): s.paste(im,((i%cols)*w,(i//cols)*h))
sc=${opts.includes("big") ? 0.8 : +W > 800 ? 0.4 : 0.55}
s.resize((int(w*cols*sc),int(h*rows*sc))).save('qa/shots/${name}-sheet.png')
`]);
