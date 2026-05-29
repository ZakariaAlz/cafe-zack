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
 * an eternal flame. GLB sourced from a community Blender model.
 *
 * The procedural cylinder plinth that used to anchor the box-fronds is gone —
 * the GLB has its own base baked in, and the cylinder was visibly clipping
 * with it. Eternal-flame + point light still live in code so the south
 * anchor reads warm at any time of day.
 *
 * Proximity trigger flips world.nearby → "maqam" so the HUD prompts and E
 * opens the Skills panel.
 */

const POSITION: [number, number, number] = [0, 0, 22];
const TRIGGER_RADIUS = 13;
const TARGET_HEIGHT = 15;

const FLAME = "#FF7A1A";

export function MaqamEchahid({ playerRef }: { playerRef: RefObject<RapierRigidBody | null> }) {
  const { scene } = useModel("maqam-echahid.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, TARGET_HEIGHT, 0);
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
        {/* Footprint collider sized to the rendered GLB so the player bumps
            but can't walk through it. */}
        <CuboidCollider args={[6, 8, 6]} position={[0, 8, 0]} />
      </RigidBody>

      <primitive object={cloned} />

      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[0.5, 1.5, 14]} />
        <meshStandardMaterial
          color={FLAME}
          emissive={FLAME}
          emissiveIntensity={2}
          roughness={0.4}
        />
      </mesh>
      <pointLight position={[0, 1.8, 0]} color={FLAME} intensity={6} distance={12} decay={2} />
    </group>
  );
}
