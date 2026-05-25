import { expect, type Page, test } from "@playwright/test";

// Exact text so HUD pills don't collide with the (lowercase) hero hint line.
const stepOut = (p: Page) => p.getByText("Step out", { exact: true });
const driveTaxi = (p: Page) => p.getByText("Drive the R4", { exact: true });
const callTaxi = (p: Page) => p.getByText("Call the R4", { exact: true });
const arriving = (p: Page) => p.getByText("R4 arriving…", { exact: true });
const enterPoste = (p: Page) => p.getByText("Enter La Grande Poste", { exact: true });

test("drive · step out · call · re-enter · open landmark panel", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await page.waitForSelector("canvas");
  // R3F + Rapier init before the physics-driven HUD reacts to input.
  await page.waitForTimeout(4000);
  await page.mouse.click(640, 360); // focus for key events

  // Starts driving.
  await expect(stepOut(page)).toBeVisible();

  // F → on foot beside the taxi.
  await page.keyboard.press("f");
  await expect(driveTaxi(page)).toBeVisible();

  // Walk away (W = forward = -Z) → out of range → can call.
  await page.keyboard.down("w");
  await page.waitForTimeout(1800);
  await page.keyboard.up("w");
  await expect(callTaxi(page)).toBeVisible();

  // C → summon; the cab glides in (~1.3s) and we're back in range.
  await page.keyboard.press("c");
  await expect(arriving(page)).toBeVisible();
  await expect(driveTaxi(page)).toBeVisible({ timeout: 5000 });

  // F → back in, then drive up to the Grande Poste and open the panel.
  await page.keyboard.press("f");
  await expect(stepOut(page)).toBeVisible();
  await page.keyboard.down("w");
  await page.waitForTimeout(4000);
  await page.keyboard.up("w");
  await expect(enterPoste(page)).toBeVisible();

  await page.keyboard.press("e");
  await expect(page.getByText("Zakaria Alizouaoui")).toBeVisible();

  expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
});
