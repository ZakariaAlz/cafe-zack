"use client";

import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { type RefObject, useEffect, useRef } from "react";
import { useTimeOfDay } from "@/features/scene/store/useTimeOfDay";
import { useAudio } from "../lib/audio-store";
import { activateZone, stopAll } from "../lib/tracks";
import { pickZone } from "../lib/zones";

/**
 * Reads the player's rigid body each frame, picks the right ambient zone,
 * and crossfades the Howler pool. Lives inside the R3F Canvas so it can
 * use useFrame. The zone choice is also published to the store so HUD bits
 * can react to it (e.g. show what's playing).
 */
export function useAmbientZone(activeRef: RefObject<RapierRigidBody | null>): void {
  const timeOfDay = useTimeOfDay((s) => s.timeOfDay);
  const tickAccum = useRef(0);

  // Stop everything on unmount so tracks don't keep playing if the Canvas
  // is torn down (route change, hot reload).
  useEffect(() => () => stopAll(), []);

  useFrame((_, delta) => {
    // Cheap update — once every ~150 ms is plenty for ambient music.
    tickAccum.current += delta;
    if (tickAccum.current < 0.15) return;
    tickAccum.current = 0;

    const { unlocked, muted, volume, zone, setZone } = useAudio.getState();
    if (!unlocked) return;

    const body = activeRef.current;
    const pos = body?.translation() ?? null;
    const nextZone = pickZone(pos, timeOfDay);
    if (nextZone !== zone) setZone(nextZone);
    activateZone(nextZone, volume, muted);
  });
}
