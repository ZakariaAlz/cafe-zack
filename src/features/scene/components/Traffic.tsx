"use client";

import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useModel } from "../lib/useModel";

/**
 * Ambient parked traffic — the CC-BY Algiers car fleet (504 break, 504 coupé,
 * Golf Mk1) scattered along the road edges so the streets read as lived-in.
 * Each car is a fixed RigidBody with an auto cuboid collider, so you bump into
 * parked cars instead of phasing through them (matching the world-solidity
 * pass). Models are real-scale with wheels at the GLB's local y=0, so they sit
 * straight on the road at y=0.
 *
 * Placements hug the kerbs of the "+" road network (main road along Z at x≈±3.3,
 * cross street at z=−12 along X) and a few landmark forecourts, steering clear
 * of the intersection where the player car spawns.
 */

const MODELS = ["car-504-break.glb", "car-504-coupe.glb"] as const;

type Parked = {
  model: (typeof MODELS)[number];
  position: [number, number, number];
  rotationY: number;
};

// The two iconic 504s only (both <220 KB) — kept the heavier Golf out of the
// instanced fleet so the populated scene stays light for software-GL/CI and
// low-end GPUs. rotationY 0/π aligns a car along the main road (Z); ±π/2 along
// the cross street (X). Values nudged a few degrees so the row isn't a grid.
const HALF_PI = Math.PI / 2;
const FLEET: Parked[] = [
  // Main road — west kerb (x≈−3.4), facing south (+Z, rotationY=π)
  { model: "car-504-break.glb", position: [-3.4, 0, -20], rotationY: Math.PI + 0.04 },
  { model: "car-504-coupe.glb", position: [-3.4, 0, 4], rotationY: Math.PI + 0.02 },
  { model: "car-504-break.glb", position: [-3.4, 0, 20], rotationY: Math.PI },
  // Main road — east kerb (x≈+3.4), facing north (−Z, rotationY=0)
  { model: "car-504-coupe.glb", position: [3.4, 0, -14], rotationY: 0.03 },
  { model: "car-504-break.glb", position: [3.4, 0, 8], rotationY: -0.02 },
  { model: "car-504-coupe.glb", position: [3.4, 0, 22], rotationY: 0 },
  // Cross street — north kerb (z≈−15), facing east (+X, rotationY=−π/2)
  { model: "car-504-break.glb", position: [-16, 0, -15], rotationY: -HALF_PI + 0.03 },
  { model: "car-504-coupe.glb", position: [12, 0, -15], rotationY: -HALF_PI - 0.02 },
  // Cross street — south kerb (z≈−9), facing west (−X, rotationY=+π/2)
  { model: "car-504-coupe.glb", position: [-18, 0, -9], rotationY: HALF_PI },
  { model: "car-504-break.glb", position: [-11, 0, -9], rotationY: HALF_PI + 0.03 },
  { model: "car-504-coupe.glb", position: [16, 0, -9], rotationY: HALF_PI },
];

function ParkedCar({ model, position, rotationY }: Parked) {
  const { scene } = useModel(model);
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RigidBody type="fixed" colliders="cuboid">
        <primitive object={cloned} />
      </RigidBody>
    </group>
  );
}

type Moving = {
  model: (typeof MODELS)[number];
  /** Lane endpoints; the car loops from→to and wraps back at the road edge. */
  from: [number, number, number];
  to: [number, number, number];
  /** Metres per second. */
  speed: number;
  /** Start offset along the lane [0..1]. */
  phase: number;
};

// A few slow cars driving the lanes — one each way on the main road, one on the
// cross street. Lanes sit inside the parked rows (x≈±1.6 / z≈−12) and the
// endpoints run past the road ends so the wrap-around lands off-screen.
const MOVING: Moving[] = [
  { model: "car-504-coupe.glb", from: [-1.7, 0, 30], to: [-1.7, 0, -30], speed: 5, phase: 0 },
  { model: "car-504-break.glb", from: [1.7, 0, -30], to: [1.7, 0, 30], speed: 4.2, phase: 0.45 },
  { model: "car-504-coupe.glb", from: [26, 0, -12.2], to: [-26, 0, -12.2], speed: 4.6, phase: 0.2 },
];

// The 504 GLB faces +Z at rotationY=0; aligning rotation.y to the heading makes
// it drive nose-first.
const HEADING = new THREE.Vector3();

function MovingCar({ model, from, to, speed, phase }: Moving) {
  const { scene } = useModel(model);
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const ref = useRef<THREE.Group>(null);
  const t = useRef(phase);
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const len = useMemo(() => start.distanceTo(end), [start, end]);
  const yaw = useMemo(() => {
    HEADING.subVectors(end, start);
    return Math.atan2(HEADING.x, HEADING.z);
  }, [start, end]);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g || len === 0) return;
    t.current += (speed * delta) / len;
    if (t.current > 1) t.current -= 1; // wrap at the road edge (off-screen)
    g.position.lerpVectors(start, end, t.current);
    g.rotation.y = yaw;
  });

  return (
    <group ref={ref}>
      <primitive object={cloned} />
    </group>
  );
}

export function Traffic() {
  return (
    <group>
      {FLEET.map((car) => (
        <ParkedCar
          key={`${car.position[0]}:${car.position[2]}`}
          model={car.model}
          position={car.position}
          rotationY={car.rotationY}
        />
      ))}
      {MOVING.map((car) => (
        <MovingCar
          key={`move-${car.from[0]}:${car.from[2]}:${car.to[2]}`}
          model={car.model}
          from={car.from}
          to={car.to}
          speed={car.speed}
          phase={car.phase}
        />
      ))}
    </group>
  );
}
