// Renders transparent posters of the 3D props for the no-WebGL / reduced-motion fallback.
import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const shots = [
  ["mannequin", "prop=mannequin&rotY=0.32&hi=chest&load=1&bg=none", 600, 760],
  ["box-front", "prop=box&rotY=-0.55&rotX=0.2&bg=none", 760, 560],
  ["box-back", "prop=box&rotY=3.14159&rotX=0.02&bg=none", 760, 560],
];
for (const [name, q, w, h] of shots) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })).newPage();
  await page.goto(`${process.env.BASE || "http://localhost:3000"}/gltest?${q}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `qa/shots/poster-${name}.png`, omitBackground: true });
  await page.close();
}
await browser.close();
