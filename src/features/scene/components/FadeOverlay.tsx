"use client";

import { useEffect } from "react";
import { useWorld } from "@/lib/world-store";

/**
 * Full-screen black cover that drives the café enter/exit crossing. It is plain
 * DOM (a sibling of the Canvas), so the venue subtree swap happens *behind* an
 * opaque screen and is never visible.
 *
 * Flow:
 *   idle → enterCafe()/exitCafe() sets `fading-out`; the cover CSS-fades to
 *   opaque. After FADE_MS we commitVenueSwap() (street/interior subtrees swap
 *   under the black) → `fading-in` → cover fades back to clear → after FADE_MS
 *   finishTransition() → idle.
 *
 * The phases are advanced by a timer rather than the DOM `transitionend` event:
 * transitionend is unreliable (it never fires if the element just mounted, was
 * already at the target opacity, or — notably — under headless software-GL in
 * CI), which would strand the state machine mid-fade. A timer matched to the CSS
 * duration is deterministic. This is also the seam where the future 3D→2D café
 * game (#7) will hook its own transition.
 */
const FADE_MS = 300;

export function FadeOverlay() {
  const transition = useWorld((s) => s.transition);
  const commitVenueSwap = useWorld((s) => s.commitVenueSwap);
  const finishTransition = useWorld((s) => s.finishTransition);

  useEffect(() => {
    if (transition === "idle") return;
    const id = setTimeout(() => {
      if (transition === "fading-out") commitVenueSwap();
      else if (transition === "fading-in") finishTransition();
    }, FADE_MS);
    return () => clearTimeout(id);
  }, [transition, commitVenueSwap, finishTransition]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-50 bg-black transition-opacity duration-300 ease-in-out"
      style={{
        // Opaque while fading out AND during the swap instant (fading-in starts
        // opaque, then animates to clear).
        opacity: transition === "fading-out" ? 1 : 0,
        pointerEvents: transition === "idle" ? "none" : "auto",
      }}
    />
  );
}
