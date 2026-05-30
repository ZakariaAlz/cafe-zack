import { expect, type Locator, type Page, test } from "@playwright/test";

// Exact text so HUD pills don't collide with the (lowercase) hero hint line.
const stepOut = (p: Page) => p.getByText("Step out", { exact: true });
const driveR4 = (p: Page) => p.getByText("Drive the R4", { exact: true });
const callR4 = (p: Page) => p.getByText("Call the R4", { exact: true });
const arriving = (p: Page) => p.getByText("R4 arriving…", { exact: true });
const enterPoste = (p: Page) => p.getByText("Enter La Grande Poste", { exact: true });

// Press a *toggle* key (F enter/exit) robustly on a loaded software-GL CI
// runner, where two things go wrong:
//   1. The first press can be dropped — F is handled by a window listener in
//      DriveController, which mounts inside the R3F canvas *after* the HUD, so
//      the "from" prompt (store-driven) can show before the listener attaches.
//   2. After a press lands, the prompt's DOM render can lag seconds behind the
//      state change under load.
// The fix: press ONLY while still in the source state (`from` prompt visible).
// Once the toggle takes, `from` disappears and we stop pressing — so a lagging
// render can't trick us into pressing again and flapping back. Then wait for
// the target. Re-presses only happen if a press was genuinely dropped.
async function toggleInto(
  page: Page,
  key: string,
  from: (p: Page) => Locator,
  to: (p: Page) => Locator,
  timeout = 30_000,
) {
  await expect(async () => {
    if (await to(page).isVisible()) return; // arrived
    if (await from(page).isVisible()) await page.keyboard.press(key); // still in source → (re)press
    await expect(to(page)).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout });
}

test("drive · step out · call · re-enter · open landmark panel", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await page.waitForSelector("canvas");
  // Let R3F + Rapier initialise — the HUD (DOM) mounts before the physics
  // bodies exist, so input only takes effect after this settle. Includes
  // headroom for the HDRI Environment background to finish loading.
  await page.waitForTimeout(15000);
  await page.mouse.click(640, 360); // focus for key events
  await expect(stepOut(page)).toBeVisible({ timeout: 25_000 });

  // F → on foot beside the car. Press only while still in "Step out" (driving),
  // so a lagging render can't make us flap back into the car.
  await toggleInto(page, "f", stepOut, driveR4);

  // Walk away (W) — hold until we're out of range and can call it.
  await page.keyboard.down("w");
  await expect(callR4(page)).toBeVisible({ timeout: 15_000 });
  await page.keyboard.up("w");

  // C → summon; the car glides back into range.
  await page.keyboard.press("c");
  await expect(arriving(page)).toBeVisible();
  await expect(driveR4(page)).toBeVisible({ timeout: 15_000 });

  // F → back in. We're on foot beside the car ("Drive the R4"); press only
  // while that prompt holds, until "Step out" (driving) appears.
  await toggleInto(page, "f", driveR4, stepOut);
  await page.keyboard.down("w");
  // Real-time traversal: the car drives to the Poste at a fixed speed, so the
  // wall-clock time to arrive scales with how slowly the software-GL CI runner
  // steps physics. Generous budget (well under the 120s per-test cap) so a slow
  // runner still arrives, while a genuine regression (car never moves) fails.
  await expect(enterPoste(page)).toBeVisible({ timeout: 60_000 });
  await page.keyboard.up("w");

  // E → open the About panel.
  await page.keyboard.press("e");
  await expect(page.getByText("Zakaria Alizouaoui")).toBeVisible();

  expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
});
