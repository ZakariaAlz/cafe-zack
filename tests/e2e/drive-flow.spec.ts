import { expect, type Page, test } from "@playwright/test";

// This e2e drives the real keypress → R3F → Rapier → store loop in a browser.
// Under headless software-GL on CI it is timing-sensitive, so we assert on
// SYNCHRONOUS store truth (exposed at window.__world) rather than lagged DOM
// prompt renders, and we only act once the F/C listeners are actually mounted
// (window.__driveReady) — on slow CI the DriveController can attach well after
// the canvas first paints. The final panel assertion still checks real DOM so
// the full path (drive → arrive → open landmark) is genuinely exercised.

type Snapshot = {
  mode: "driving" | "onFoot";
  nearTaxi: boolean;
  taxiCalling: boolean;
  nearby: string | null;
};

// Read store truth from the page. Cast inside the browser context (the test's
// Window type isn't augmented) — keeps Biome's no-shadow-globals rule happy.
const snapshot = (page: Page): Promise<Snapshot> =>
  page.evaluate(() => {
    const w = window as unknown as { __world?: { getState: () => Snapshot } };
    const s = w.__world?.getState();
    return {
      mode: s?.mode ?? "driving",
      nearTaxi: s?.nearTaxi ?? false,
      taxiCalling: s?.taxiCalling ?? false,
      nearby: s?.nearby ?? null,
    };
  });

// Wait for a predicate over store truth to hold. Polls in-page so it never
// races a render.
async function waitForState(page: Page, pred: (s: Snapshot) => boolean, timeout = 45_000) {
  await expect.poll(async () => pred(await snapshot(page)), { timeout }).toBe(true);
}

// Press a toggle key (F) until the store mode reaches `to`. Re-press ONLY while
// still in `from`: the store flips synchronously inside the key handler, so once
// the press registers the next poll sees `to` and stops — no flap. A genuinely
// dropped press (e.g. before the listener attached) is retried.
async function toggleMode(
  page: Page,
  key: string,
  from: Snapshot["mode"],
  to: Snapshot["mode"],
  timeout = 45_000,
) {
  await expect(async () => {
    const m = (await snapshot(page)).mode;
    if (m === to) return;
    if (m === from) await page.keyboard.press(key);
    expect((await snapshot(page)).mode).toBe(to);
  }).toPass({ timeout });
}

test("drive · step out · call · re-enter · open landmark panel", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await page.waitForSelector("canvas");
  // Wait until the F/C listeners are actually live (DriveController mounted),
  // not merely until the canvas painted — this is the gap that flaked on CI.
  await page.waitForFunction(
    () => (window as unknown as { __driveReady?: boolean }).__driveReady === true,
    null,
    { timeout: 60_000 },
  );
  await page.mouse.click(640, 360); // focus for key events

  // Start in the car.
  await waitForState(page, (s) => s.mode === "driving");

  // F → on foot beside the car; the frame loop then flags us near the taxi.
  await toggleMode(page, "f", "driving", "onFoot");
  await waitForState(page, (s) => s.nearTaxi);

  // Walk away (W) until out of taxi range — now the car can be summoned.
  await page.keyboard.down("w");
  await waitForState(page, (s) => !s.nearTaxi);
  await page.keyboard.up("w");

  // C → summon; the car glides back into range (taxiCalling → near again).
  await page.keyboard.press("c");
  await waitForState(page, (s) => s.taxiCalling || s.nearTaxi);
  await waitForState(page, (s) => s.nearTaxi && !s.taxiCalling);

  // F → back in the car.
  await toggleMode(page, "f", "onFoot", "driving");

  // Drive up to La Grande Poste — the approach-stop collider parks the car in
  // range, so holding W is safe and arrival is frame-rate independent. Real-time
  // traversal, so a generous budget for slow runners (well under the test cap).
  await page.keyboard.down("w");
  await waitForState(page, (s) => s.nearby === "grande-poste", 90_000);
  await page.keyboard.up("w");

  // E → open the About panel (real DOM — proves the full path opened the panel).
  await page.keyboard.press("e");
  await expect(page.getByText("Zakaria Alizouaoui")).toBeVisible({ timeout: 10_000 });

  expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
});
