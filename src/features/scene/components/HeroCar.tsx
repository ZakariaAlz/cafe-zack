"use client";

import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { useModel } from "../lib/useModel";

/**
 * The player's car — Peugeot 504 coupé (CC-BY, ~148 KB), the international
 * agent's ride. Visual only; <Vehicle> owns the RigidBody + CuboidCollider.
 *
 * The GLB is ~4.74 m long, centred in X/Z with its wheels at the model's local
 * y=0. The Vehicle's collider floor sits at y=−0.5, so we drop the model there
 * to land the wheels on the road. Forward is −Z to match the chassis frame;
 * flip FACING if the nose points the wrong way (verified in the headless smoke).
 */
const FLOOR_OFFSET = -0.5;
const SCALE = 1;
// The 504 coupé GLB's nose points +Z, so rotate 180° to match the chassis's
// −Z forward (FORWARD_AXIS in Vehicle).
const FACING = Math.PI;

export function HeroCar() {
  const { scene } = useModel("car-504-coupe.glb");
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  return (
    <group position={[0, FLOOR_OFFSET, 0]} rotation={[0, FACING, 0]} scale={SCALE}>
      <primitive object={cloned} />
    </group>
  );
}
