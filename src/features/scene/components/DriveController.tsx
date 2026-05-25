"use client";

import type { RapierRigidBody } from "@react-three/rapier";
import { type RefObject, useCallback } from "react";
import { useInteractKey } from "../hooks/useInteractKey";
import { useDrive } from "../store/useDrive";

// How close the agent must be to the taxi to climb in.
const ENTER_RADIUS = 3;
// Where the agent is dropped on exit (beside the driver's door, +X of taxi).
const EXIT_OFFSET = 2.2;

/**
 * Owns the E-key enter/exit handshake (PR E). Renders nothing — it just needs
 * both bodies' refs to gate the toggle:
 *
 *  - driving → onFoot: always allowed; teleport the agent beside the taxi.
 *  - onFoot → driving: only when the agent is within ENTER_RADIUS of the taxi.
 *
 * Switching `mode` is what re-points the chase camera and movement input
 * (handled in Scene / Vehicle / Character); this component only decides when.
 */
export function DriveController({
  taxiRef,
  characterRef,
}: {
  taxiRef: RefObject<RapierRigidBody | null>;
  characterRef: RefObject<RapierRigidBody | null>;
}) {
  const onPress = useCallback(() => {
    const taxi = taxiRef.current;
    const agent = characterRef.current;
    if (!taxi || !agent) return;

    const { mode, setMode } = useDrive.getState();
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

  useInteractKey(onPress);
  return null;
}
