"use client";

import { useAnimations } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";
import { WalkingNPC } from "./WalkingNPC";

/**
 * La Sablette — a beach-café terrace on the corniche promenade (z≈−63, facing
 * the sea at −Z). Parasols, tables and chairs from the CC-BY beach pack, all
 * normalized to a sensible real-world height via `fitModelToHeight` (their
 * native scales vary wildly), with a couple of agents seated at the tables and
 * pedestrians strolling the promenade.
 *
 * Builds on the existing <Beach> (sand / sea / sea-wall / palms). Decorative —
 * no colliders on the furniture (you can walk through a parasol); add later if
 * it matters.
 */

const PROMENADE_Z = -63;

/** Load a beach GLB, normalize it to `height`, drop it at `position`. */
function BeachProp({
  model,
  height,
  position,
  rotationY = 0,
}: {
  model: string;
  height: number;
  position: [number, number, number];
  rotationY?: number;
}) {
  const { scene } = useModel(model);
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, height);
    return c;
  }, [scene, height]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

/** A seated agent (Business_Man `sitting_idle`) at a café chair. SCALE/seat
 *  height are eye-tuned; nudge if he floats above or sinks into the chair. */
function BeachSitter({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const { scene, animations } = useModel("agent-businessman.glb");
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const ref = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, ref);
  useEffect(() => {
    const sit = actions.sitting_idle;
    if (sit) sit.reset().fadeIn(0.3).play();
    return () => {
      sit?.fadeOut(0.2);
    };
  }, [actions]);
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={0.9}>
      <group ref={ref}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

// Terrace cluster: four parasols along the promenade, each over a table with a
// pair of chairs facing the sea (−Z).
const TABLES_X = [-9, 0, 9, 18];

export function Sablette() {
  return (
    <group>
      {TABLES_X.map((x) => (
        <group key={x} position={[x, 0, PROMENADE_Z]}>
          <BeachProp model="beach-parasol.glb" height={2.6} position={[0, 0, 0]} />
          <BeachProp model="beach-table.glb" height={0.72} position={[0, 0, 0.2]} />
          <BeachProp
            model="beach-chair.glb"
            height={0.8}
            position={[-0.8, 0, 0.9]}
            rotationY={0.2}
          />
          <BeachProp
            model="beach-chair.glb"
            height={0.8}
            position={[0.8, 0, 0.9]}
            rotationY={-0.2}
          />
        </group>
      ))}

      {/* A couple of patrons seated at the first two tables. */}
      <BeachSitter position={[-9.8, 0, PROMENADE_Z + 0.9]} rotationY={Math.PI} />
      <BeachSitter position={[0.8, 0, PROMENADE_Z + 0.9]} rotationY={Math.PI - 0.2} />

      {/* Strollers on the promenade. */}
      <WalkingNPC
        model="npc-walker-f1.glb"
        from={[-22, 0.02, -64]}
        to={[24, 0.02, -64]}
        speed={1.1}
      />
      <WalkingNPC
        model="npc-walker-m1.glb"
        from={[20, 0.02, -65]}
        to={[-18, 0.02, -65]}
        speed={1.25}
        phase={0.5}
      />
      <WalkingNPC
        model="npc-walker-m2.glb"
        from={[-6, 0.02, -63.5]}
        to={[14, 0.02, -63.5]}
        speed={1.0}
        phase={0.3}
      />
    </group>
  );
}
