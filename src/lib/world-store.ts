import { create } from "zustand";

/** Section anchors in the open world. All 5 wired. */
export type LandmarkId = "grande-poste" | "casbah" | "notre-dame" | "maqam" | "cafe-zack";

/** Whether the player is driving a vehicle or walking as the suited agent. */
export type DriveMode = "driving" | "onFoot";
/** Which vehicle the agent is currently driving when `mode === "driving"`. */
export type Vehicle = "r4" | "scooter";

type State = {
  /** Landmark the player is currently within trigger radius of (or null). */
  nearby: LandmarkId | null;
  /** Landmark whose panel is open (or null). */
  activePanel: LandmarkId | null;
  setNearby: (id: LandmarkId | null) => void;
  open: (id: LandmarkId) => void;
  close: () => void;
  /** Driving a vehicle vs. on foot. The scene writes it; the HUD reads it. */
  mode: DriveMode;
  setMode: (mode: DriveMode) => void;
  /** Which vehicle the agent is in (or was last in) when driving. */
  vehicle: Vehicle;
  setVehicle: (v: Vehicle) => void;
  /** True when the on-foot agent is close enough to climb into a vehicle. */
  nearTaxi: boolean;
  setNearTaxi: (near: boolean) => void;
  /** True when the on-foot agent is close enough to mount the scooter. */
  nearScooter: boolean;
  setNearScooter: (near: boolean) => void;
  /** True while the called taxi is gliding to the on-foot agent. */
  taxiCalling: boolean;
  setTaxiCalling: (calling: boolean) => void;
  /** The café reveal: once the on-foot agent reaches Café Zack, the sunglasses
   * come off (one-way — the face stays revealed). */
  faceRevealed: boolean;
  revealFace: () => void;
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
  vehicle: "r4",
  setVehicle: (v) => set({ vehicle: v }),
  nearTaxi: false,
  setNearTaxi: (near) => set({ nearTaxi: near }),
  nearScooter: false,
  setNearScooter: (near) => set({ nearScooter: near }),
  taxiCalling: false,
  setTaxiCalling: (calling) => set({ taxiCalling: calling }),
  faceRevealed: false,
  revealFace: () => set({ faceRevealed: true }),
}));
