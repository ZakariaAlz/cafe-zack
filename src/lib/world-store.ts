import { create } from "zustand";

/** Section anchors in the open world. 4 of 5 wired so far. */
export type LandmarkId = "grande-poste" | "casbah" | "notre-dame" | "maqam";

/** Whether the player is driving the taxi or walking as the suited agent. */
export type DriveMode = "driving" | "onFoot";

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
};

/**
 * Shared world state bridging the 3D scene and the 2D panels — the genuinely
 * cross-feature state, so it lives in lib/ (scene writes `nearby` / `mode` /
 * `nearTaxi` from proximity + control checks; panels read them to show prompts
 * and open the right Dialog). Driving is gated on `activePanel` in Vehicle so
 * the taxi doesn't keep moving while a panel is open.
 */
export const useWorld = create<State>((set) => ({
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
}));
