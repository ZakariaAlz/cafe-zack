"use client";

import { useWorld } from "@/lib/world-store";

/**
 * Full-screen black cover that drives the café enter/exit crossing. It is plain
 * DOM (a sibling of the Canvas), so the venue subtree swap happens *behind* an
 * opaque screen and is never visible.
 *
 * Flow, all on CSS opacity transition-end:
 *   idle → enterCafe()/exitCafe() sets `fading-out` → cover animates to opaque →
 *   on end we commitVenueSwap() (street/interior subtrees swap under the black)
 *   which sets `fading-in` → cover animates back to clear → on end finishTransition().
 *
 * This is also the natural seam where the future 3D→2D café game (#7) will hook
 * its own transition.
 */
export function FadeOverlay() {
  const transition = useWorld((s) => s.transition);
  const commitVenueSwap = useWorld((s) => s.commitVenueSwap);
  const finishTransition = useWorld((s) => s.finishTransition);

  return (
    <div
      aria-hidden
      onTransitionEnd={() => {
        if (transition === "fading-out") commitVenueSwap();
        else if (transition === "fading-in") finishTransition();
      }}
      className="fixed inset-0 z-50 bg-black transition-opacity duration-300 ease-in-out"
      style={{
        opacity: transition === "fading-out" ? 1 : 0,
        pointerEvents: transition === "idle" ? "none" : "auto",
      }}
    />
  );
}
