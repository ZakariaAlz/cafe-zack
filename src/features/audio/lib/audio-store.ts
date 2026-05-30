"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Which ambient track is currently the dominant zone. */
export type Zone = "street" | "cafe" | "night";

type AudioState = {
  /** User-facing mute toggle. Persisted across sessions. */
  muted: boolean;
  /** Master volume, 0..1. Persisted across sessions. */
  volume: number;
  /** True once the browser audio context has been unlocked by a user gesture. */
  unlocked: boolean;
  /** Active ambient zone. Driven by useAmbientZone from the player position. */
  zone: Zone;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  unlock: () => void;
  setZone: (z: Zone) => void;
};

export const useAudio = create<AudioState>()(
  persist(
    (set) => ({
      // Start muted — ambient music kicks in only when the visitor opts in via
      // MusicHUD. Avoids the "broken record" jump-scare on first load while
      // the chip-tune pack is still placeholder.
      muted: true,
      volume: 0.6,
      unlocked: false,
      zone: "street",
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),
      unlock: () => set({ unlocked: true }),
      setZone: (z) => set({ zone: z }),
    }),
    {
      name: "cafe-zack-audio",
      // Don't persist the runtime-only fields.
      partialize: (s) => ({ muted: s.muted, volume: s.volume }),
    },
  ),
);
