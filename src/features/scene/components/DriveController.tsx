"use client";

import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { type RefObject, useCallback } from "react";
import { useWorld } from "@/lib/world-store";
import { useInteractKey } from "../hooks/useInteractKey";

// How close the agent must be to the taxi to climb in.
const ENTER_RADIUS = 3;
// Where the agent is dropped on exit (beside the driver's door, +X of taxi).
const EXIT_OFFSET = 2.2;

/**
 * Owns the F-key enter/exit handshake (PR E). Renders nothing — it needs both
 * bodies' refs to gate the toggle and to feed the HUD:
 *
 *  - driving → onFoot: always allowed; teleport the agent beside the taxi.
 *  - onFoot → driving: only when within ENTER_RADIUS of the taxi.
 *
 * F (not E) so it never collides with E = open-landmark-panel (PanelsRoot).
 * Each frame it also publishes `nearTaxi` to the store so the HUD can show the
 * "F — Drive" prompt; flipped only on boundary crossings to avoid store churn.
 */
export function DriveController({
  taxiRef,
  characterRef,
}: {
  taxiRef: RefObject<RapierRigidBody | null>;
  characterRef: RefObject<RapierRigidBody | null>;
}) {
  useFrame(() => {
    const { mode, nearTaxi, setNearTaxi } = useWorld.getState();
    if (mode !== "onFoot") {
      if (nearTaxi) setNearTaxi(false);
      return;
    }
    const taxi = taxiRef.current;
    const agent = characterRef.current;
    if (!taxi || !agent) return;
    const t = taxi.translation();
    const c = agent.translation();
    const dx = t.x - c.x;
    const dz = t.z - c.z;
    const near = dx * dx + dz * dz <= ENTER_RADIUS * ENTER_RADIUS;
    if (near !== nearTaxi) setNearTaxi(near);
  });

  const onPress = useCallback(() => {
    const taxi = taxiRef.current;
    const agent = characterRef.current;
    if (!taxi || !agent) return;

    const { mode, setMode } = useWorld.getState();
    const t = taxi.translation();

    if (mode === "driving") {
      agent.setTranslation({ x: t.x + EXIT_OFFSET, y: t.y + 0.4, z: t.z }, true);
      agent.setLinvel({ x: 0, y: 0, z: 0 }, true);
      setMode("onFoot");
      return;
    }

    const c = agent.translation();
    const dx = t.x - c.x;
    const dz = t.z - c.z;
    if (dx * dx + dz * dz <= ENTER_RADIUS * ENTER_RADIUS) {
      setMode("driving");
    }
  }, [taxiRef, characterRef]);

  useInteractKey("f", onPress);
  return null;
}
