/**
 * Headless smoke for the amphitheatre terrain rebuild. Boots the worktree dev
 * server (port 3005), clicks once to unlock + focus, lets physics settle, then
 * screenshots and asserts no console errors. Also reads the on-foot agent body
 * height to confirm it rests ON the slope (not buried / not fallen through).
 *
 *   bun run scripts/verify-terrain.mjs
 */
import { chromium } from "playwright";

const URL = "http://localhost:3005/";
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
page.setDefaultTimeout(120000);

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(URL, { waitUntil: "domcontentloaded" });
// Wait for the canvas to mount.
await page.waitForSelector("canvas", { timeout: 120000 });
await page.mouse.click(640, 360);

// Let the physics world settle the bodies onto the trimesh terrain.
await page.waitForTimeout(6000);

// Step out of the car (F) so the character body is active, then settle.
await page.keyboard.press("KeyF");
await page.waitForTimeout(3000);

const agentY = await page.evaluate(() => {
  const ref = window.__playerBody;
  const body = ref?.current;
  if (!body) return null;
  const t = body.translation();
  return { x: +t.x.toFixed(2), y: +t.y.toFixed(2), z: +t.z.toFixed(2) };
});

await page.screenshot({ path: "/tmp/terrain-smoke.png" });
// A second angle: drag to orbit the camera up so the slope is visible.
await page.mouse.move(640, 360);
await page.mouse.down();
await page.mouse.move(640, 200, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/terrain-smoke-2.png" });

console.log("agent body:", JSON.stringify(agentY));
console.log("console errors:", errors.length);
for (const e of errors.slice(0, 10)) console.log("  ✗", e);

await browser.close();
process.exit(errors.length === 0 ? 0 : 1);
