/**
 * Headless browser smoke for the 1940s Spy GLB swap. Boots the page,
 * clicks once to unlock audio + focus, presses F to dismount, screenshots
 * the result, and asserts no console errors were emitted.
 *
 *   bun run scripts/verify-agent.mjs
 *
 * Per CLAUDE.md: use Playwright's bundled chromium with swiftshader
 * (no system Chrome available).
 */

import { chromium } from "playwright";

const URL = "http://localhost:3001/";

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector("canvas");
await page.waitForTimeout(5000);
await page.screenshot({ path: "/tmp/agent-spy-driving.png" });

await page.mouse.click(640, 360);
await page.waitForTimeout(300);
await page.keyboard.press("f");
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/agent-spy-onfoot.png" });

await page.keyboard.down("w");
await page.waitForTimeout(2000);
await page.keyboard.up("w");
await page.screenshot({ path: "/tmp/agent-spy-walking.png" });

// Sprint (Shift+W) exercises the run gait branch — currently the graceful
// fallback (Walking at 1.7×) until the Running clip is grafted into the GLB.
await page.keyboard.down("Shift");
await page.keyboard.down("w");
await page.waitForTimeout(2000);
await page.keyboard.up("w");
await page.keyboard.up("Shift");
await page.screenshot({ path: "/tmp/agent-spy-running.png" });

console.log("\n=== verify-agent ===");
console.log("Screenshots written to /tmp/agent-spy-{driving,onfoot,walking,running}.png");
console.log("Console errors:", errors.length);
for (const e of errors) console.log("  •", e);

await browser.close();

process.exit(errors.length > 0 ? 1 : 0);
