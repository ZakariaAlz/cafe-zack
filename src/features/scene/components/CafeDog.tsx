"use client";

import { useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useModel } from "../lib/useModel";

/**
 * German Shepherd walking a small perimeter loop in front of Café Zack.
 * Uses the rig-with-grafted-walk-anim pipeline (RSG dogs pack "Walk Loop"
 * grafted on top of the static mesh) so the dog actually walks instead of
 * standing still.
 *
 * Loop is a four-corner rectangle traced via a phase parameter — at speed
 * 1.3 the cycle takes ~14 s, matching the cadence of a real dog patrolling
 * a small area. Cloned scene + the longest animation (the walk loop)
 * follows the same pattern as WalkingNPC.
 */
const ANCHOR: [number, number, number] = [12, 0, 14];
const HALF = 2.5; // half-width of the perimeter square

export function CafeDog() {
  const { scene, animations } = useModel("dog-shepherd.glb");
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const modelRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, modelRef);
  const phase = useRef(0);

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

  useEffect(() => {
    const longest = Object.values(actions)
      .filter((a): a is THREE.AnimationAction => Boolean(a))
      .sort((a, b) => b.getClip().duration - a.getClip().duration)[0];
    if (longest) longest.reset().fadeIn(0.2).play();
    return () => {
      longest?.fadeOut(0.2);
    };
  }, [actions]);

  useFrame((_, delta) => {
    phase.current = (phase.current + delta * 0.18) % 1;
    const g = groupRef.current;
    if (!g) return;
    // Trace the rectangle: 4 sides x 0.25 of phase each.
    const p = phase.current * 4;
    let dx = 0;
    let dz = 0;
    let yaw = 0;
    if (p < 1) {
      // Side A: SW → SE  (+x at -z)
      dx = -HALF + p * (HALF * 2);
      dz = -HALF;
      yaw = Math.PI / 2;
    } else if (p < 2) {
      // Side B: SE → NE  (+z at +x)
      dx = HALF;
      dz = -HALF + (p - 1) * (HALF * 2);
      yaw = 0;
    } else if (p < 3) {
      // Side C: NE → NW  (-x at +z)
      dx = HALF - (p - 2) * (HALF * 2);
      dz = HALF;
      yaw = -Math.PI / 2;
    } else {
      // Side D: NW → SW  (-z at -x)
      dx = -HALF;
      dz = HALF - (p - 3) * (HALF * 2);
      yaw = Math.PI;
    }
    g.position.set(ANCHOR[0] + dx, ANCHOR[1], ANCHOR[2] + dz);
    g.rotation.y = yaw;
  });

  return (
    <group ref={groupRef}>
      <group ref={modelRef} scale={0.014}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}
