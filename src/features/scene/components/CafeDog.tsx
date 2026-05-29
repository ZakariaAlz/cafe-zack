"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

/**
 * A static German Shepherd sitting beside Café Zack's door — an easter egg
 * pet for the cinematic moment. The mesh ships with no baked animations on
 * this static FBX export, so we approximate "alive" with a slow scale
 * oscillation on Y (breathing) and a tiny head-tilt sway.
 *
 * Café Zack anchor lives at `[15, 0, 12]`; the dog sits a couple of metres
 * to its left so the player approaching from the road sees both the storefront
 * and the dog framing the entrance.
 */
const POSITION: [number, number, number] = [12, 0, 14];

export function CafeDog() {
  const { scene } = useModel("dog-shepherd.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, 0.85, 0);
    return c;
  }, [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const phase = useRef(0);

  // Cast shadow + lighten reflectivity so the fur doesn't read as wet plastic.
  useEffect(() => {
    cloned.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        const mat = obj.material as THREE.MeshStandardMaterial | undefined;
        if (mat) {
          mat.roughness = 0.85;
          mat.metalness = 0;
        }
      }
    });
  }, [cloned]);

  useFrame((_, delta) => {
    phase.current += delta;
    const g = groupRef.current;
    if (!g) return;
    g.scale.y = 1 + Math.sin(phase.current * 2) * 0.02;
    g.rotation.y = -Math.PI / 4 + Math.sin(phase.current * 0.5) * 0.05;
  });

  return (
    <group ref={groupRef} position={POSITION}>
      <primitive object={cloned} />
    </group>
  );
}
