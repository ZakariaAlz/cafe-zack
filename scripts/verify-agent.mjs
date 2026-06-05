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

// Software-GL (swiftshader) renders the now-populated scene slowly; give
// screenshots a generous ceiling so a frame can land. Real GPUs are instant.
page.setDefaultTimeout(120000);
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector("canvas");
await page.waitForTimeout(8000);
await page.screenshot({ path: "/tmp/agent-spy-driving.png" });

// Orbit the chase camera ~150° (drag on the canvas) so the car is seen from the
// side/front — lets us check the seated driver, which the rear chase view hides.
await page.mouse.move(640, 360);
await page.mouse.down();
for (let i = 0; i < 16; i++) {
  await page.mouse.move(640 - i * 22, 340 + i * 4);
  await page.waitForTimeout(20);
}
await page.mouse.up();
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/car-side.png" });

await page.mouse.click(640, 360);
await page.waitForTimeout(300);
await page.keyboard.press("f");
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/agent-spy-onfoot.png" });

await page.keyboard.down("w");
await page.waitForTimeout(2000);
await page.keyboard.up("w");
await page.screenshot({ path: "/tmp/agent-spy-walking.png" });

// Teleport the on-foot agent up to the corniche promenade so the camera frames
// the Sablette terrace (parasols/tables/chairs/seated patrons) — it's far north
// of the spawn and never reached by the short walk above.
await page.evaluate(() => {
  const body = window.__playerBody?.current;
  if (body) body.setTranslation({ x: 4, y: 1.2, z: -61 }, true);
});
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/sablette.png" });

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
