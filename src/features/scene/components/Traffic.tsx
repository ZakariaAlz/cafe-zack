"use client";

import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { AMBIENT_FLEET, CAR_LENGTH, type CarModel } from "../lib/cars";
import { fitCarToLength } from "../lib/fitCar";
import { terrainHeight } from "../lib/terrain";
import { useModel } from "../lib/useModel";

/**
 * Ambient parked traffic — the full CC-BY-plus Algiers fleet (504 coupé/break,
 * 205, 307, Golf Mk1, Beetle, Polo, Wolf + modern variety), each normalised to
 * its REAL length by fitCarToLength so no car towers over the world, and laid
 * out in tidy, NON-OVERLAPPING bays. The old fleet jammed mis-scaled cars on top
 * of each other ("c'est catastrophique"); here every slot is spaced by a full
 * car-width/length + gap, and each car sits on the terrain at terrainHeight.
 *
 * Each car is a fixed RigidBody with an auto cuboid collider, so you bump into
 * parked cars instead of phasing through them.
 */

const GAP = 1.4; // clear space between cars
const MAX_CAR = 5; // widest footprint we space for, so nothing can touch

type Bay = { model: CarModel; position: [number, number, number]; rotationY: number };

/**
 * Lay `count` cars along a kerb. `axis` is the row direction; cars step along it
 * spaced so they never overlap; `facing` is each car's yaw. Cars sit on the
 * terrain. Models cycle through AMBIENT_FLEET from `seed` for variety.
 */
function row(
  start: [number, number],
  axis: "x" | "z",
  count: number,
  step: number,
  facing: number,
  seed: number,
): Bay[] {
  const out: Bay[] = [];
  for (let i = 0; i < count; i++) {
    const x = axis === "x" ? start[0] + i * step : start[0];
    const z = axis === "z" ? start[1] + i * step : start[1];
    const model = AMBIENT_FLEET[(seed + i) % AMBIENT_FLEET.length];
    out.push({ model, position: [x, terrainHeight(x, z), z], rotationY: facing });
  }
  return out;
}

const HALF_PI = Math.PI / 2;
// Parking laid out on the flat downtown shelf around the Grande Poste / spawn
// (x≈30–66, z near 0). Spacing ≥ MAX_CAR + GAP guarantees no overlap regardless
// of which car lands in a slot.
const STEP = MAX_CAR + GAP; // 6.4
const FLEET: Bay[] = [
  // Perpendicular bays in front of the Grande Poste (cars nose-in, facing −Z).
  ...row([40, -8], "x", 5, STEP, 0, 0),
  // Opposite bays across the forecourt, facing +Z.
  ...row([40, 16], "x", 5, STEP, Math.PI, 5),
  // Parallel-parked row along the seaward kerb (cars aligned along Z, nose −Z).
  ...row([66, -22], "z", 6, STEP, 0, 9),
  // A short row up the approach toward the spawn, facing −X.
  ...row([30, 30], "x", 3, STEP, -HALF_PI, 2),
];

function ParkedCar({ model, position, rotationY }: Bay) {
  const { scene } = useModel(model);
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitCarToLength(c, CAR_LENGTH[model]);
    return c;
  }, [scene, model]);
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
          key={`${car.model}-${car.position[0]}-${car.position[2]}`}
          model={car.model}
          position={car.position}
          rotationY={car.rotationY}
        />
      ))}
    </group>
  );
}
