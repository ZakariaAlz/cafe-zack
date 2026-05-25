import { create } from "zustand";

export type DriveMode = "driving" | "onFoot";

type State = {
  /** Whether the player is driving the taxi or walking as the suited agent. */
  mode: DriveMode;
  setMode: (mode: DriveMode) => void;
};

/**
 * Scene-local control mode (PR E). Lives in the scene feature — unlike
 * `useWorld` in lib/, this never leaves the 3D layer: it just decides which
 * body WASD drives and which the chase camera follows.
 *
 * Starts in `driving` (the taxi is the hero vehicle); press E near the taxi to
 * exit on foot, E again to get back in. The enter/exit gating lives in
 * <DriveController>, which has both bodies' refs to do the distance check.
 */
export const useDrive = create<State>((set) => ({
  mode: "driving",
  setMode: (mode) => set({ mode }),
}));
