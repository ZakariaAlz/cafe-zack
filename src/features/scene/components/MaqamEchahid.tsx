"use client";

import { useFrame } from "@react-three/fiber";
import { CuboidCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import { useWorld } from "@/lib/world-store";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

/**
 * Maqam Echahid (Martyrs' Memorial) — the Skills anchor at the south terminus.
 * Real monument: three towering concrete palm fronds meeting at an apex over
 * an eternal flame. GLB sourced from a community Blender model; the procedural
 * plinth, eternal flame, and point light stay (the GLB is bare geometry).
 *
 * Proximity trigger flips world.nearby → "maqam" so the HUD prompts and E
 * opens the Skills panel.
 */

const POSITION: [number, number, number] = [0, 0, 22];
const TRIGGER_RADIUS = 13;
// Matches the procedural fronds' apex (~15 m) so silhouettes carry the same
// presence on the skyline. Sits on top of the 1 m plinth (groundY = 1).
const TARGET_HEIGHT = 15;
const PLINTH_TOP = 1;

const CONCRETE_DARK = "#9A958C";
const FLAME = "#FF7A1A";

export function MaqamEchahid({ playerRef }: { playerRef: RefObject<RapierRigidBody | null> }) {
  const { scene } = useModel("maqam-echahid.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, TARGET_HEIGHT, PLINTH_TOP);
    return c;
  }, [scene]);
  const inside = useRef(false);

  useFrame(() => {
    const body = playerRef.current;
    if (!body) return;
    const dx = body.translation().x - POSITION[0];
    const dz = body.translation().z - POSITION[2];
    const near = dx * dx + dz * dz < TRIGGER_RADIUS * TRIGGER_RADIUS;
    if (near !== inside.current) {
      inside.current = near;
      const w = useWorld.getState();
      if (near) w.setNearby("maqam");
      else if (w.nearby === "maqam") w.setNearby(null);
    }
  });

  return (
    <group position={POSITION}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[4, 8, 4]} position={[0, 8, 0]} />
        <CuboidCollider args={[6.5, 0.6, 6.5]} position={[0, 0.6, 0]} />
      </RigidBody>

      <mesh position={[0, 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[6, 6.6, 1, 36]} />
        <meshStandardMaterial color={CONCRETE_DARK} roughness={0.9} />
      </mesh>

      <primitive object={cloned} />

      <mesh position={[0, 1.8, 0]}>
        <coneGeometry args={[0.5, 1.5, 14]} />
        <meshStandardMaterial
          color={FLAME}
          emissive={FLAME}
          emissiveIntensity={2}
          roughness={0.4}
        />
      </mesh>
      <pointLight position={[0, 2.4, 0]} color={FLAME} intensity={6} distance={12} decay={2} />
    </group>
  );
}
