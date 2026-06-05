"use client";

import { useAnimations } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useWorld } from "@/lib/world-store";
import { useModel } from "../lib/useModel";

/**
 * The agent seated at the wheel — so you see yourself driving rather than an
 * empty car. Renders inside the <Vehicle> RigidBody (car physics frame: forward
 * −Z, left −X for a left-hand-drive Algiers car), plays the Business_Man's
 * `sitting_idle` clip, and is only visible while driving (on foot the full
 * Character takes over).
 *
 * SEAT/SCALE are tuned by eye against the 504 coupé interior — nudge if the
 * driver sits too high/low or clips the roof.
 */
const SCALE = 0.52;
// Driver seat in the car's local frame: left (−X), seat height, forward.
const SEAT: [number, number, number] = [-0.36, -0.16, -0.45];
// Face forward (−Z), same heading as the car.
const FACING = Math.PI;

export function DriverAgent() {
  const { scene, animations } = useModel("agent-businessman.glb");
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const modelRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, modelRef);
  const mode = useWorld((s) => s.mode);

  useEffect(() => {
    const sit = actions.sitting_idle;
    if (sit) sit.reset().fadeIn(0.3).play();
    return () => {
      sit?.fadeOut(0.2);
    };
  }, [actions]);

  return (
    <group position={SEAT} rotation={[0, FACING, 0]} scale={SCALE} visible={mode === "driving"}>
      <group ref={modelRef}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}
