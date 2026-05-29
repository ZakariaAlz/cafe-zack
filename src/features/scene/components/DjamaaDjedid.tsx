"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

/**
 * Djamaa el-Djedid (the "New Mosque", 1660) — an Ottoman-era landmark in real
 * Algiers, sat between the harbour and the Casbah. Decorative POI here; no
 * panel, but a visible Algerian icon along the route between Casbah and Café
 * Zack. May graduate to a panel anchor in a later phase.
 */

const POSITION: [number, number, number] = [-10, 0, 4];
const TARGET_HEIGHT = 12;

export function DjamaaDjedid() {
  const { scene } = useModel("djamaa-djedid.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, TARGET_HEIGHT);
    return c;
  }, [scene]);

  return (
    <group position={POSITION}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[3, 6, 3]} position={[0, 6, 0]} />
      </RigidBody>
      <primitive object={cloned} />
    </group>
  );
}
