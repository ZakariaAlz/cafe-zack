# Café Zack — 3D Walk-In Interior (#5b)

**Status:** approved (design decisions locked via brainstorming, user said "complete everything")
**Branch:** `feat/scene-cafe-interior`
**Date:** 2026-05-31

## Goal

Turn "arriving at Café Zack" from a 2D proximity dialog into a physical
**3D walk-in interior**: cross the doorway → fade → a warm, furnished café you
can walk around in → a **diegetic 3D contact form** on the counter that POSTs to
the existing edge route → walk back out to the street. The café is the site's
conversion point and emotional destination; this is the "you arrived somewhere"
payoff.

The future **2D café game (#7)** is explicitly **out of scope**; this iteration
leaves a clean seam (the `venue` switch + fade) where #7 will later plug in.

## Locked decisions (from brainstorming)

| Question | Decision |
|---|---|
| Scope this iteration | 3D walk-in interior; 2D game (#7) deferred to its own trigger |
| Contact moment | Diegetic — a physical object in the room |
| Input mechanism | Approach **A**: drei `<Html transform occlude>` form anchored to the order-pad mesh — *looks* like a 3D-on-mesh form, *is* the proven HTML form underneath |
| Enter model | **Separate interior scene** — fade to black, swap subtree, street unmounts |
| Done bar | Full vertical slice: enter → furnished room + free walk → working 3D contact form (POSTs to edge route) → exit |
| Assets | KayKit Restaurant Bits (GLTF variants already on disk; no Blender step) |

## Architecture

### Single Canvas, venue-switched subtree

`Scene.tsx` keeps its **one `<Canvas>`** (shared WebGL context, audio, store).
`SceneContent` branches on a new store field `venue`:

- `venue === "street"` → today's open-world subtree, **unchanged** (zero
  regression; it simply does not render while inside).
- `venue === "cafe-interior"` → new `<CafeInterior>` subtree: its own
  `<Physics>`, room shell, furniture, lighting, the agent body, an interior
  chase camera, and the contact order-pad.

Rationale: the street scene is untouched, the interior is a self-contained,
independently-testable vertical slice, and `venue` is the single source of truth
the camera and the future #7 game both read.

### Store additions (`src/lib/world-store.ts`)

```
venue: "street" | "cafe-interior"          // default "street"
transition: "idle" | "fading-out" | "fading-in"
nearOrderPad: boolean                        // interior: at the counter
nearExit: boolean                            // interior: at door_A
contactOpen: boolean                         // the in-world form is active
enterCafe(): void   // street → fading-out → (swap) → fading-in → idle
exitCafe(): void    // reverse; restores agent to café street spot
setNearOrderPad(b), setNearExit(b), openContact(), closeContact()
```

The existing `window.__world` test hook already exposes the store; these fields
ride along for e2e assertions. A new `window.__cafeReady` flag (set by
`CafeInterior` on mount, mirroring `__driveReady`) lets tests gate on the
interior's listeners being live before acting.

### Components (new, under `src/features/scene/components/`)

- **`CafeInterior.tsx`** — the interior subtree: room shell + furniture +
  lighting + agent body + `InteriorCamera` + `OrderPad`. Owns `nearOrderPad` /
  `nearExit` proximity in `useFrame`. Sets `window.__cafeReady`.
- **`CafeRoom.tsx`** — procedural shell (walls/floor/ceiling, cream plaster
  `#E4D6B8`, wood floor, emissive street-facing windows) + Rapier fixed
  colliders. We own the shell for clean lighting + collision.
- **`CafeFurniture.tsx`** — places KayKit GLBs via `useModel`: counter
  (`foodstand`/`shelf`/`wallShelf`), `coffeemachine`, 3–4 `table*` with
  `chair_A`/`chair_B`/`chair_stool`, dressing (`cup`, `plate_food`, `cake`,
  `dishrack_plates`), `sign` over the counter, `frame` wall art, `door_A` as the
  interior entrance.
- **`OrderPad.tsx`** — the diegetic contact object: a small lit clipboard mesh
  on the counter + a drei `<Html transform occlude>` panel anchored to it
  hosting `<ContactForm>`. Visible-but-inert until `contactOpen`.
- **`InteriorCamera.tsx`** — warm interior chase cam (tighter seat); on
  `contactOpen`, eases to a framed over-the-shoulder shot of the pad.
- **`FadeOverlay.tsx`** (DOM, `src/features/scene/components/` or a HUD slice) —
  full-screen black div driven by `transition`; CSS opacity fade. The natural
  hook point for the future #7 transition.

### Contact form reuse (no duplicated validation)

`ContactPanel.tsx` currently hard-wires the form into a Radix `<Dialog>`. Refactor:

- Extract the form body (fields, submit, sent/failed states, `react-hook-form` +
  `zod` `contactSchema`, POST to `/api/contact`) into a presentational
  **`ContactForm.tsx`** — no dialog chrome.
- `ContactPanel` becomes `<Dialog>` + `<ContactForm>` (street/fallback path
  preserved, unchanged behavior).
- `OrderPad` renders the same `<ContactForm>` inside `<Html>`.

One source of truth for the form; the edge route and schema are untouched.

## Data flow

1. Street: agent near Café Zack → `nearby === "cafe-zack"` (existing). HUD prompt
   changes to **"E — enter Café Zack"**. (Today E opens the dialog; now E at the
   café door calls `enterCafe()`.)
2. `enterCafe()`: `transition = "fading-out"` → overlay opaque (~400ms) →
   set `venue = "cafe-interior"`, spawn agent inside at `door_A`, reset camera →
   `transition = "fading-in"` → overlay clears → `idle`.
3. Interior: WASD walk (existing controls). Near counter → `nearOrderPad` → HUD
   "E — leave a note" → E → `openContact()` → camera frames pad, form active.
   Submit → POST → in-world thank-you. Esc → `closeContact()`.
4. Near `door_A` → `nearExit` → HUD "E — back to the street" → E → `exitCafe()`
   (reverse fade), agent restored to the café's street position, `venue="street"`.

## Error handling

- Form errors: unchanged from today (zod field errors; network failure shows the
  existing "failed" state). Edge route untouched.
- Asset load failure: `useModel` is Suspense-wrapped; `CafeInterior` mounts under
  a `<Suspense fallback={null}>` so a missing GLB degrades to an empty room, not
  a crash.
- Double-trigger guard: `enterCafe`/`exitCafe` no-op while `transition !== "idle"`.

## Testing strategy (applies the drive-flow lessons)

- **Unit (vitest/happy-dom):**
  - store: `enterCafe`/`exitCafe`/transition reducers, proximity setters, the
    double-trigger guard.
  - `ContactForm`: renders fields, validates (empty → errors), success state.
    (Reuses the ResizeObserver/matchMedia polyfills already in
    `tests/unit/setup.ts`.)
- **E2e (Playwright, prod build, software-GL):**
  - Extend `drive-flow` or add `cafe-flow.spec.ts`: drive→café door→**enter**→
    walk to counter→open note→submit→exit.
  - Assert on **store truth via `window.__world`** (venue/contactOpen/nearby),
    NOT lagged DOM prompts. Gate on `window.__cafeReady` before pressing.
  - Reuse the `toggleInto` / `waitForState` helpers and the CI prod-build server
    that made drive-flow reliable. The final form-submit asserts the real
    thank-you DOM so the full path is genuinely exercised.

## Out of scope (explicit)

- The 2D café game (#7) and the 3D→2D transition.
- New Blender-authored assets (KayKit GLTFs already on disk suffice).
- Reworking the street world, audio zones, or the edge contact route.

## File-level change list

New: `CafeInterior.tsx`, `CafeRoom.tsx`, `CafeFurniture.tsx`, `OrderPad.tsx`,
`InteriorCamera.tsx`, `FadeOverlay.tsx`, `ContactForm.tsx`, `cafe-flow.spec.ts`,
+ unit tests; manifest entries for the new KayKit GLBs.
Modified: `world-store.ts` (venue/transition/proximity), `Scene.tsx` (venue
branch + FadeOverlay), `ContactPanel.tsx` (use `ContactForm`), `CafeZack.tsx`
(E → `enterCafe` at the door), `messages/en.json` + `fr.json` (new prompts),
`manifest.json`.
```
