import { chromium } from "playwright-core";
const nogl = process.argv[2] === "nogl";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: nogl ? ["--disable-3d-apis", "--disable-gpu"] : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
console.log(await page.evaluate(() => ({ gl2: !!document.createElement("canvas").getContext("webgl2"), canvases: document.querySelectorAll("canvas").length })));
await browser.close();
