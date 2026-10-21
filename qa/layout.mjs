import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto((process.env.BASE || "http://localhost:3100") + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const l = JSON.parse(await page.evaluate(() => document.getElementById("film").dataset.layout));
  const total = await page.evaluate(() => (document.documentElement.scrollHeight / innerHeight).toFixed(2));
  console.log(w, "total page height in svh:", total);
  console.log(l.map((x) => `${x.id}: start ${x.start} len ${x.len} end ${(x.start + x.len).toFixed(2)}`).join("\n"));
  await page.close();
}
await browser.close();
