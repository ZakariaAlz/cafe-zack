import { create } from "zustand";

/** Section anchors in the open world. All 5 wired. */
export type LandmarkId = "grande-poste" | "casbah" | "notre-dame" | "maqam" | "cafe-zack";

/** Whether the player is driving the taxi or walking as the suited agent. */
export type DriveMode = "driving" | "onFoot";

/** Which scene the player is in: the open-world street, or inside Café Zack. */
export type Venue = "street" | "cafe-interior";

/** Fade state driving the black overlay during a venue crossing. */
export type Transition = "idle" | "fading-out" | "fading-in";

type State = {
  /** Landmark the player is currently within trigger radius of (or null). */
  nearby: LandmarkId | null;
  /** Landmark whose panel is open (or null). */
  activePanel: LandmarkId | null;
  setNearby: (id: LandmarkId | null) => void;
  open: (id: LandmarkId) => void;
  close: () => void;
  /** Driving the taxi vs. on foot. The scene writes it; the HUD reads it. */
  mode: DriveMode;
  setMode: (mode: DriveMode) => void;
  /** True when the on-foot agent is close enough to climb into the taxi. */
  nearTaxi: boolean;
  setNearTaxi: (near: boolean) => void;
  /** True while the called taxi is gliding to the on-foot agent. */
  taxiCalling: boolean;
  setTaxiCalling: (calling: boolean) => void;
  /** The café reveal: the smoke veil evaporates while the on-foot agent is in
   * front of Café Zack and re-forms when he wanders off — proximity-driven and
   * reversible, since the open world invites exploration. */
  faceRevealed: boolean;
  setFaceRevealed: (revealed: boolean) => void;

  /** Where the street agent should (re)spawn — set when leaving the café so we
   * drop back outside Café Zack, not at the default world spawn. */
  streetSpawn: [number, number, number] | null;
  /** Street vs. inside Café Zack. The Scene swaps subtrees on this. */
  venue: Venue;
  /** Fade overlay phase during a venue crossing. */
  transition: Transition;
  /** Interior: agent is at the counter (order pad in reach). */
  nearOrderPad: boolean;
  /** Interior: agent is at the door (exit in reach). */
  nearExit: boolean;
  /** Interior: the in-world contact form is active. */
  contactOpen: boolean;
  /** Cross the doorway into the café (no-op mid-transition). The fade phases
   * are advanced by FadeOverlay's animation-end so the swap lands on black. */
  enterCafe: () => void;
  /** Leave the café back to the street (no-op mid-transition). */
  exitCafe: () => void;
  /** FadeOverlay calls this when the black cover is fully opaque: the moment to
   * swap `venue`, then begin fading back in. */
  commitVenueSwap: () => void;
  /** FadeOverlay calls this when the fade-in completes. */
  finishTransition: () => void;
  setNearOrderPad: (near: boolean) => void;
  setNearExit: (near: boolean) => void;
  openContact: () => void;
  closeContact: () => void;
};

/**
 * Shared world state bridging the 3D scene and the 2D panels — the genuinely
 * cross-feature state, so it lives in lib/ (scene writes `nearby` / `mode` /
 * `nearTaxi` from proximity + control checks; panels read them to show prompts
 * and open the right Dialog). Driving is gated on `activePanel` in Vehicle so
 * the taxi doesn't keep moving while a panel is open.
 */
export const useWorld = create<State>((set, get) => ({
  nearby: null,
  activePanel: null,
  setNearby: (id) => set({ nearby: id }),
  open: (id) => set({ activePanel: id }),
  close: () => set({ activePanel: null }),
  mode: "driving",
  setMode: (mode) => set({ mode }),
  nearTaxi: false,
  setNearTaxi: (near) => set({ nearTaxi: near }),
  taxiCalling: false,
  setTaxiCalling: (calling) => set({ taxiCalling: calling }),
  faceRevealed: false,
  setFaceRevealed: (revealed) => set({ faceRevealed: revealed }),

  streetSpawn: null,
  venue: "street",
  transition: "idle",
  nearOrderPad: false,
  nearExit: false,
  contactOpen: false,
  // Enter/exit only kick off the fade-out; commitVenueSwap (fired when the
  // overlay is fully opaque) does the actual venue switch so the change is
  // hidden behind black. Guard against re-entry while a fade is in flight.
  enterCafe: () => {
    if (get().transition !== "idle" || get().venue !== "street") return;
    set({ transition: "fading-out" });
  },
  exitCafe: () => {
    if (get().transition !== "idle" || get().venue !== "cafe-interior") return;
    set({ transition: "fading-out" });
  },
  commitVenueSwap: () =>
    set((s) => {
      const entering = s.venue === "street";
      return {
        venue: entering ? "cafe-interior" : "street",
        // Always inside on foot (you can't drive the R4 indoors); on exit the
        // agent stays a pedestrian standing outside the café.
        mode: "onFoot" as DriveMode,
        // Returning to the street: respawn just outside Café Zack (it sits at
        // [15,0,12] facing -Z), not at the world's default spawn.
        streetSpawn: entering ? s.streetSpawn : [15, 1.2, 5],
        // Clear interior-only UI/proximity flags on either crossing.
        contactOpen: false,
        nearOrderPad: false,
        nearExit: false,
        nearby: null,
        transition: "fading-in",
      };
    }),
  finishTransition: () => set({ transition: "idle" }),
  setNearOrderPad: (near) => set({ nearOrderPad: near }),
  setNearExit: (near) => set({ nearExit: near }),
  openContact: () => set({ contactOpen: true }),
  closeContact: () => set({ contactOpen: false }),
}));

// Expose the store to e2e tests (Playwright) so they can assert on synchronous
// store truth instead of racing lagged DOM-prompt renders under software-GL.
// Only UI state (mode/nearTaxi/nearLandmark) — nothing sensitive; the HUD
// already mirrors all of it publicly.
if (typeof window !== "undefined") {
  (window as unknown as { __world?: typeof useWorld }).__world = useWorld;
}
