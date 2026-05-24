import { create } from "zustand";

export type TimeOfDay = "sunrise" | "midday" | "sunset" | "night";

export const TIME_OF_DAY_OPTIONS: readonly TimeOfDay[] = [
  "sunrise",
  "midday",
  "sunset",
  "night",
] as const;

type State = {
  timeOfDay: TimeOfDay;
  setTimeOfDay: (t: TimeOfDay) => void;
  cycle: () => void;
};

/**
 * Global time-of-day state for the scene. Bruno-Simon-style atmosphere
 * cycling: sunrise → midday → sunset → night, looping. Drives Sky params,
 * directional sun angle/color, ambient + hemisphere tint, fog color, and
 * bloom intensity (night = bloom shines harder so neon will pop later).
 *
 * Default is sunset because that's Algiers's most photogenic light AND
 * the time most readers will share screenshots of (golden hour on
 * LinkedIn always wins).
 */
export const useTimeOfDay = create<State>((set, get) => ({
  timeOfDay: "sunset",
  setTimeOfDay: (t) => set({ timeOfDay: t }),
  cycle: () => {
    const idx = TIME_OF_DAY_OPTIONS.indexOf(get().timeOfDay);
    const next = TIME_OF_DAY_OPTIONS[(idx + 1) % TIME_OF_DAY_OPTIONS.length];
    set({ timeOfDay: next });
  },
}));
