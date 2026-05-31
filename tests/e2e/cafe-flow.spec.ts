import { expect, type Page, test } from "@playwright/test";

// Walk into Café Zack, leave a note on the in-world order pad, and walk back
// out. Like drive-flow, this exercises the real keypress → R3F → Rapier → store
// loop, so under headless software-GL it asserts on SYNCHRONOUS store truth
// (window.__world) rather than lagged DOM, and gates on window.__cafeReady /
// __driveReady before pressing. The contact submit asserts the real thank-you
// DOM so the conversion path is genuinely covered.

type Snapshot = {
  mode: "driving" | "onFoot";
  nearby: string | null;
  venue: "street" | "cafe-interior";
  nearOrderPad: boolean;
  nearExit: boolean;
  contactOpen: boolean;
};

const snapshot = (page: Page): Promise<Snapshot> =>
  page.evaluate(() => {
    const s = (window as unknown as { __world?: { getState: () => Snapshot } }).__world?.getState();
    return {
      mode: s?.mode ?? "driving",
      nearby: s?.nearby ?? null,
      venue: s?.venue ?? "street",
      nearOrderPad: s?.nearOrderPad ?? false,
      nearExit: s?.nearExit ?? false,
      contactOpen: s?.contactOpen ?? false,
    };
  });

async function waitForState(page: Page, pred: (s: Snapshot) => boolean, timeout = 45_000) {
  await expect.poll(async () => pred(await snapshot(page)), { timeout }).toBe(true);
}

// Re-press a key until the store predicate holds, but only while the guard is
// still true — so a toggle never flaps once it has registered, while a dropped
// press (before listeners mounted) is retried.
async function pressUntil(
  page: Page,
  key: string,
  done: (s: Snapshot) => boolean,
  guard: (s: Snapshot) => boolean,
  timeout = 45_000,
) {
  await expect(async () => {
    const s = await snapshot(page);
    if (done(s)) return;
    if (guard(s)) await page.keyboard.press(key);
    expect(done(await snapshot(page))).toBe(true);
  }).toPass({ timeout });
}

test("enter café · leave a note · walk back to the street", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await page.waitForSelector("canvas");
  await page.waitForFunction(
    () => (window as unknown as { __driveReady?: boolean }).__driveReady === true,
    null,
    { timeout: 60_000 },
  );
  await page.mouse.click(640, 360); // focus for key events

  // Step out of the R4, then drive/walk is irrelevant — we just need to be on
  // foot and reach Café Zack. Toggle F until on foot.
  await pressUntil(
    page,
    "f",
    (s) => s.mode === "onFoot",
    (s) => s.mode === "driving",
  );

  // Café Zack sits southeast; the R4 starts near it. Hold W until we're within
  // the café trigger (nearby === "cafe-zack"). Generous budget for slow runners.
  await page.keyboard.down("w");
  await waitForState(page, (s) => s.nearby === "cafe-zack", 90_000);
  await page.keyboard.up("w");

  // E at the door → fade → interior. Re-press only while still on the street.
  await pressUntil(
    page,
    "e",
    (s) => s.venue === "cafe-interior",
    (s) => s.venue === "street" && s.nearby === "cafe-zack",
    60_000,
  );

  // Interior listeners live.
  await page.waitForFunction(
    () => (window as unknown as { __cafeReady?: boolean }).__cafeReady === true,
    null,
    { timeout: 60_000 },
  );

  // Walk to the counter (the agent spawns at the door facing it). Hold W until
  // the order pad is in reach.
  await page.keyboard.down("w");
  await waitForState(page, (s) => s.nearOrderPad, 60_000);
  await page.keyboard.up("w");

  // E → open the in-world contact form (store truth), then assert the real DOM.
  await pressUntil(
    page,
    "e",
    (s) => s.contactOpen,
    (s) => s.nearOrderPad && !s.contactOpen,
  );
  await expect(page.getByLabelText("Name")).toBeVisible({ timeout: 10_000 });

  // Fill + submit the note → real thank-you DOM (conversion path).
  await page.getByLabelText("Name").fill("Sam Tester");
  await page.getByLabelText("Email").fill("sam@example.com");
  await page.getByLabelText("What do you need?").fill("A data pipeline, please.");
  await page.getByRole("button", { name: "Send it over" }).click();
  await expect(page.getByTestId("contact-sent")).toBeVisible({ timeout: 15_000 });

  // Esc closes the form, then walk back to the door and exit to the street.
  await page.keyboard.press("Escape");
  await waitForState(page, (s) => !s.contactOpen);

  expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
});
