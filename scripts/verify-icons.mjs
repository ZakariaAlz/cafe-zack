/**
 * Headless visual smoke for the Algerian icon swap. Boots the page, drives the
 * car around the loop to capture each landmark, and asserts zero console
 * errors.
 *
 *   bun run scripts/verify-icons.mjs
 *
 * Bundled chromium with swiftshader (no system Chrome per CLAUDE.md).
 */

import { chromium } from "playwright";

const URL = "http://localhost:3001/";

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();

const errors = [];
const bbox = [];
page.on("console", (m) => {
  const text = m.text();
  if (m.type() === "error") errors.push(text);
  if (text.includes("bbox")) bbox.push(text);
});
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector("canvas");
await page.waitForTimeout(5000);
await page.mouse.click(640, 360);
await page.waitForTimeout(300);

await page.screenshot({ path: "/tmp/icons-01-spawn.png" });

// Step out of the car immediately (F) so movement is character-relative.
await page.keyboard.press("f");
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/icons-02-onfoot.png" });

// Walk south (S=backward in keyboard mapping → +Z = south). The character
// turns to face south, so the chase camera ends up north of the character
// looking south, framing the Maqam.
await page.keyboard.down("s");
await page.waitForTimeout(3500);
await page.keyboard.up("s");
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/icons-03-maqam.png" });

// Walk west (A) toward the Casbah.
await page.keyboard.down("a");
await page.waitForTimeout(4000);
await page.keyboard.up("a");
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/icons-04-casbah.png" });

// Walk further northwest to clear sightlines toward Djamaa Djedid at [-10, 0, 4].
await page.keyboard.down("w");
await page.keyboard.down("d");
await page.waitForTimeout(2500);
await page.keyboard.up("w");
await page.keyboard.up("d");
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/icons-05-djamaa.png" });

console.log("\n=== verify-icons ===");
console.log("Screenshots: /tmp/icons-01..04*.png");
console.log("Console errors:", errors.length);
for (const e of errors) console.log("  •", e);
console.log("BBox logs:", bbox.length);
for (const b of bbox) console.log("  •", b);

await browser.close();
process.exit(errors.length > 0 ? 1 : 0);
