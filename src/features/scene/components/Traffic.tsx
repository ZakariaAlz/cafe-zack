"use client";

import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
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
    </group>
  );
}
