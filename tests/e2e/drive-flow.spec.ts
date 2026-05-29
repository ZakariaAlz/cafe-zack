import { expect, type Page, test } from "@playwright/test";

// Exact text so HUD pills don't collide with the (lowercase) hero hint line.
const stepOut = (p: Page) => p.getByText("Step out", { exact: true });
const driveR4 = (p: Page) => p.getByText("Drive the R4", { exact: true });
const callR4 = (p: Page) => p.getByText("Call the R4", { exact: true });
const arriving = (p: Page) => p.getByText("R4 arriving…", { exact: true });
const enterPoste = (p: Page) => p.getByText("Enter La Grande Poste", { exact: true });

test("drive · step out · call · re-enter · open landmark panel", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await page.waitForSelector("canvas");
  // Let R3F + Rapier initialise — the HUD (DOM) mounts before the physics
  // bodies exist, so input only takes effect after this settle. Includes
  // headroom for the HDRI Environment background to finish loading.
  await page.waitForTimeout(10000);
  await page.mouse.click(640, 360); // focus for key events
  await expect(stepOut(page)).toBeVisible({ timeout: 20_000 });

  // F → on foot beside the car.
  await page.keyboard.press("f");
  await expect(driveR4(page)).toBeVisible({ timeout: 10_000 });

  // Walk away (W) — hold until we're out of range and can call it.
  await page.keyboard.down("w");
  await expect(callR4(page)).toBeVisible({ timeout: 15_000 });
  await page.keyboard.up("w");

  // C → summon; the car glides back into range.
  await page.keyboard.press("c");
  await expect(arriving(page)).toBeVisible();
  await expect(driveR4(page)).toBeVisible({ timeout: 15_000 });

  // F → back in, then drive up to the Poste. Hold W until the prompt fires —
  // the approach-stop collider parks the car in range, so holding is safe and
  // the distance covered is frame-rate independent.
  await page.keyboard.press("f");
  await expect(stepOut(page)).toBeVisible({ timeout: 10_000 });
  await page.keyboard.down("w");
  await expect(enterPoste(page)).toBeVisible({ timeout: 25_000 });
  await page.keyboard.up("w");

  // E → open the About panel.
  await page.keyboard.press("e");
  await expect(page.getByText("Zakaria Alizouaoui")).toBeVisible();

  expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
});
