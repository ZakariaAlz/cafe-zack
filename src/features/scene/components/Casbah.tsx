"use client";

import { useFrame } from "@react-three/fiber";
import { CuboidCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import { useWorld } from "@/lib/world-store";
import { fitModelToHeight } from "../lib/fitModel";
import { landmarkAnchor } from "../lib/terrain";
import { useModel } from "../lib/useModel";

/**
 * The Casbah of Algiers — the Projects anchor at the west edge. A traditional
 * whitewashed Algerian house (low-poly GLB stands in for the dense Casbah
 * quarter — a future LOD pass can swap to the high-poly source).
 *
 * Proximity trigger flips world.nearby → "casbah" so the HUD prompts and E
 * opens the Projects panel.
 */

const POSITION: [number, number, number] = landmarkAnchor("casbah");
const TRIGGER_RADIUS = 11;
// A single house reads ~8 m tall — keeps it under the Maqam silhouette while
// still feeling massed at street level.
const TARGET_HEIGHT = 8;

export function Casbah({ playerRef }: { playerRef: RefObject<RapierRigidBody | null> }) {
  const { scene } = useModel("casbah-house.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, TARGET_HEIGHT);
    return c;
  }, [scene]);
  const inside = useRef(false);

  useFrame(() => {
    const body = playerRef.current;
    if (!body) return;
    const t = body.translation();
    const dx = t.x - POSITION[0];
    const dz = t.z - POSITION[2];
    const near = dx * dx + dz * dz < TRIGGER_RADIUS * TRIGGER_RADIUS;
    if (near !== inside.current) {
      inside.current = near;
      const w = useWorld.getState();
      if (near) w.setNearby("casbah");
      else if (w.nearby === "casbah") w.setNearby(null);
    }
  });

  return (
    <group position={POSITION}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[4, 4, 4]} position={[0, 4, 0]} />
      </RigidBody>
      <primitive object={cloned} />
    </group>
  );
}
