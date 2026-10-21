// Usage: node qa/gl.mjs <out> <query> [w h]
import { chromium } from "playwright-core";
const [out, query, W = "500", H = "700"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 })).newPage();
const logs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text().slice(0, 300)); });
page.on("pageerror", (e) => logs.push("PAGEERR " + e.message));
await page.goto(`http://localhost:3000/gltest?${query}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 }).catch(() => logs.push("timeout"));
await page.waitForTimeout(1500);
await page.screenshot({ path: `qa/shots/${out}.png` });
console.log(JSON.stringify(logs.slice(0, 5)));
await browser.close();
