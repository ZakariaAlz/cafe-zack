/**
 * Headless aerial overview of the Algiers amphitheatre — drives the debug
 * `window.__overview` hook in ChaseCamera to lift the camera off the chase rig
 * and frame the whole terrain/roads/monuments from a few vantages.
 *
 *   bun run scripts/overview.mjs   (needs `bun dev` on :3001)
 */
import { chromium } from "playwright";

const URL = "http://localhost:3001/";
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
page.setDefaultTimeout(120000);
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector("canvas");
await page.mouse.click(640, 360);
await page.waitForTimeout(5000);

const SHOTS = [
  // The amphitheatre seen from out over the bay, looking inland at the city
  // rising up the slope — the classic Algiers view.
  { name: "bay", pos: [120, 55, 10], look: [-10, 6, -5] },
  // Ground-level Sablette: from the promenade looking out over the seated
  // patrons / strollers toward the sea (+X).
  { name: "sablette", pos: [50, 6, 40], look: [66, 1.5, 42] },
];

for (const s of SHOTS) {
  await page.evaluate((v) => {
    window.__overview = { pos: v.pos, look: v.look };
  }, s);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `/tmp/overview-${s.name}.png` });
}

await page.evaluate(() => {
  window.__overview = undefined;
});

console.log("\n=== overview ===");
console.log("Wrote /tmp/overview-{bay,aerial,north}.png");
console.log("Console errors:", errors.length);
for (const e of errors) console.log("  •", e);
await browser.close();
process.exit(errors.length > 0 ? 1 : 0);
