"use client";

import { useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useModel } from "../lib/useModel";

/**
 * Single running kid for the Casbah quarter. The GLB ships a Mixamo-style
 * Biped rig (people_freepack `bip *` naming) with one running clip grafted
 * from the pack's sidecar Animations folder. Each instance gets its own
 * SkeletonUtils.clone so independent positions/rotations don't fight.
 *
 * Movement is a simple parametric loop around `center` at `radius`, with the
 * kid's facing rotated to match the tangent of the circle so the run cycle
 * always points where they're going. No physics — purely visual NPC.
 */
export function CasbahKid({
  center,
  radius = 4,
  speed = 1.4,
  phase = 0,
  scale = 0.014,
}: {
  center: [number, number, number];
  /** Loop radius in metres. */
  radius?: number;
  /** Radians per second around the loop. */
  speed?: number;
  /** Starting offset around the loop (radians) so multiple kids don't overlap. */
  phase?: number;
  /** Source FBX authors in cm; 0.01 lands a 1.2 m kid; 0.014 reads slightly older. */
  scale?: number;
}) {
  const { scene, animations } = useModel("casbah-kid.glb");
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const modelRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, modelRef);
  const t = useRef(phase);

  // The clip is the only animation in the GLB — fire whatever's loaded.
  useEffect(() => {
    const names = Object.keys(actions);
    if (names.length === 0) return;
    const run = actions[names[0]];
    if (run) run.reset().fadeIn(0.2).play();
    return () => {
      run?.fadeOut(0.2);
    };
  }, [actions]);

  useFrame((_, delta) => {
    t.current += delta * speed;
    const g = groupRef.current;
    if (!g) return;
    const x = center[0] + Math.cos(t.current) * radius;
    const z = center[2] + Math.sin(t.current) * radius;
    g.position.set(x, center[1], z);
    // Face the tangent: derivative of (cos, sin) is (-sin, cos), so heading
    // angle is atan2(cos, -sin) = -t + pi/2 (rotated to face along the move).
    g.rotation.y = -t.current - Math.PI / 2;
  });

  return (
    <group ref={groupRef}>
      <group ref={modelRef} scale={scale}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}
