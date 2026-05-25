import { create } from "zustand";

/** Section anchors in the open world. Only Grande Poste is wired so far. */
export type LandmarkId = "grande-poste";

type State = {
  /** Landmark the player is currently within trigger radius of (or null). */
  nearby: LandmarkId | null;
  /** Landmark whose panel is open (or null). */
  activePanel: LandmarkId | null;
  setNearby: (id: LandmarkId | null) => void;
  open: (id: LandmarkId) => void;
  close: () => void;
};

/**
 * Shared world state bridging the 3D scene and the 2D panels — the one piece
 * of genuinely cross-feature state, so it lives in lib/ (scene writes
 * `nearby` from a proximity check; panels read it to show the prompt and open
 * the right Dialog). Driving is gated on `activePanel` in Vehicle so the taxi
 * doesn't keep moving while a panel is open.
 */
export const useWorld = create<State>((set) => ({
  nearby: null,
  activePanel: null,
  setNearby: (id) => set({ nearby: id }),
  open: (id) => set({ activePanel: id }),
  close: () => set({ activePanel: null }),
}));
