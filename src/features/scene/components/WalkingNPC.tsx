"use client";

import { useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useModel } from "../lib/useModel";

/**
 * A pedestrian NPC. Loads any of the piped `npc-walker-*.glb` files (or any
 * GLB whose longest animation is its walk clip), clones the scene per
 * instance, plays the walk loop, and ping-pongs along a straight line
 * between two world-space points.
 *
 * The faking is intentional: real path-finding is overkill for ambient
 * background life. As long as the loops are short and the speed matches the
 * walk clip's cadence (~1.0 s for `locom_*_basicWalk_30f`), the eye reads
 * "people going about their business" without any AI.
 *
 * For more variety: vary `from/to`, `speed`, and `phase` per instance;
 * different rigs (m1/f1/m2) for the casual/female/businessman silhouettes.
 */

const TMP_DIR = new THREE.Vector3();

export function WalkingNPC({
  model,
  from,
  to,
  speed = 1.2,
  phase = 0,
  scale = 0.01,
}: {
  /** GLB filename under public/models/optimized/ (e.g. "npc-walker-m1.glb"). */
  model: string;
  from: [number, number, number];
  to: [number, number, number];
  /** Metres per second along the path. */
  speed?: number;
  /** Starting offset along the loop [0..1] — 0 starts at `from`, 0.5 at `to`. */
  phase?: number;
  /** people_freepack rigs author in cm; 0.01 lands a 1.7 m adult. */
  scale?: number;
}) {
  const { scene, animations } = useModel(model);
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const modelRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, modelRef);
  const t = useRef(phase);

  // The piped GLBs ship three anim entries; the long one is the actual walk
  // clip (the others are 0.07 s residuals from the import). Pick the longest.
  useEffect(() => {
    const longest = Object.values(actions)
      .filter((a): a is THREE.AnimationAction => Boolean(a))
      .sort((a, b) => b.getClip().duration - a.getClip().duration)[0];
    if (longest) longest.reset().fadeIn(0.2).play();
    return () => {
      longest?.fadeOut(0.2);
    };
  }, [actions]);

  // Precompute path length so `speed` is in metres per second, not "units per
  // second along a unit-length lerp." useMemo so we don't recalc each frame.
  const pathLength = useMemo(() => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dz = to[2] - from[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, [from, to]);
  const heading = useMemo(() => {
    const dx = to[0] - from[0];
    const dz = to[2] - from[2];
    return Math.atan2(dx, dz);
  }, [from, to]);

  useFrame((_, delta) => {
    if (pathLength === 0) return;
    // ping-pong parameter in [0..2]; mapped to [0..1..0] for "go and come back"
    t.current = (t.current + (delta * speed) / pathLength) % 2;
    const u = t.current < 1 ? t.current : 2 - t.current;
    const goingForward = t.current < 1;

    const g = groupRef.current;
    if (!g) return;
    g.position.set(
      from[0] + (to[0] - from[0]) * u,
      from[1] + (to[1] - from[1]) * u,
      from[2] + (to[2] - from[2]) * u,
    );
    g.rotation.y = goingForward ? heading : heading + Math.PI;
    void TMP_DIR;
  });

  return (
    <group ref={groupRef}>
      <group ref={modelRef} scale={scale}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}
