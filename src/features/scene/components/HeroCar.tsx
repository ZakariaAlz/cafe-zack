"use client";

import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { CAR_LENGTH } from "../lib/cars";
import { fitCarToLength } from "../lib/fitCar";
import { useModel } from "../lib/useModel";

/**
 * The player's car — Peugeot 504 coupé (CC-BY), the agent's ride. Visual only;
 * <Vehicle> owns the RigidBody + CuboidCollider.
 *
 * fitCarToLength normalises the GLB to a real 4.49 m with its wheels at local
 * y=0, regardless of the source scale. The Vehicle's collider floor sits at
 * y=−0.5, so we drop the model there to land the wheels on the road. Forward is
 * −Z to match the chassis frame; flip FACING if the nose points the wrong way.
 */
const FLOOR_OFFSET = -0.5;
// The 504 coupé GLB's nose points +Z, so rotate 180° to match the chassis's
// −Z forward (FORWARD_AXIS in Vehicle).
const FACING = Math.PI;
const MODEL = "car-504-coupe.glb";

export function HeroCar() {
  const { scene } = useModel(MODEL);
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitCarToLength(c, CAR_LENGTH[MODEL]);
    return c;
  }, [scene]);
  return (
    <group position={[0, FLOOR_OFFSET, 0]} rotation={[0, FACING, 0]}>
      <primitive object={cloned} />
    </group>
  );
}
