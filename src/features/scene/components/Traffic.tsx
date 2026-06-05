"use client";

import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToLength } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

/**
 * Ambient Algiers traffic — the CC-BY 504s, every instance run through
 * `fitModelToLength` so they all land at one consistent size (CAR_LENGTH)
 * regardless of each GLB's wildly different native scale (the break GLB ships
 * ~3× the coupé's size). Parked cars fill the RoadNetwork parking lots and a
 * few kerbs as fixed RigidBodies with auto cuboid colliders; a couple of
 * visual-only cars drive the lanes.
 */

const CAR_LENGTH = 4.3; // metres — one size for every car
const MODELS = ["car-504-coupe.glb", "car-504-break.glb"] as const;

function useFitCar(model: string) {
  const { scene } = useModel(model);
  return useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToLength(c, CAR_LENGTH);
    return c;
  }, [scene]);
}

type Parked = {
  model: (typeof MODELS)[number];
  position: [number, number, number];
  rotationY: number;
};

// Cars fill the three RoadNetwork parking lots (perpendicular bays) + a couple
// of kerbs. rotationY orients each along its bay/road.
const HALF_PI = Math.PI / 2;
const FLEET: Parked[] = [
  // La Grande Poste lot — centre [10.5, −22], width 12, facing the plaza (+Z)
  { model: "car-504-coupe.glb", position: [6.6, 0, -22], rotationY: 0 },
  { model: "car-504-break.glb", position: [9.2, 0, -22], rotationY: 0.02 },
  { model: "car-504-coupe.glb", position: [11.9, 0, -22], rotationY: -0.02 },
  { model: "car-504-break.glb", position: [14.4, 0, -22], rotationY: 0 },
  // Café Zack lot — centre [18, 7], width 8
  { model: "car-504-coupe.glb", position: [15.6, 0, 7], rotationY: 0.03 },
  { model: "car-504-break.glb", position: [18.2, 0, 7], rotationY: 0 },
  { model: "car-504-coupe.glb", position: [20.6, 0, 7], rotationY: -0.02 },
  // Corniche lot — centre [−26, −71], width 16, facing the sea
  { model: "car-504-break.glb", position: [-32, 0, -71], rotationY: Math.PI },
  { model: "car-504-coupe.glb", position: [-28.5, 0, -71], rotationY: Math.PI - 0.02 },
  { model: "car-504-break.glb", position: [-25, 0, -71], rotationY: Math.PI },
  { model: "car-504-coupe.glb", position: [-21.5, 0, -71], rotationY: Math.PI + 0.03 },
  // A couple parked at the kerb on the main boulevard
  { model: "car-504-coupe.glb", position: [-3.6, 0, 2], rotationY: Math.PI },
  { model: "car-504-break.glb", position: [3.6, 0, 16], rotationY: -HALF_PI },
];

function ParkedCar({ model, position, rotationY }: Parked) {
  const cloned = useFitCar(model);
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
  from: [number, number, number];
  to: [number, number, number];
  speed: number;
  phase: number;
};

// Two slow cars driving the boulevard lanes (one each way); they loop and wrap
// at the road edge off-screen.
const MOVING: Moving[] = [
  { model: "car-504-coupe.glb", from: [-1.7, 0, 30], to: [-1.7, 0, -30], speed: 5, phase: 0 },
  { model: "car-504-coupe.glb", from: [1.7, 0, -30], to: [1.7, 0, 30], speed: 4.3, phase: 0.5 },
];

const HEADING = new THREE.Vector3();

function MovingCar({ model, from, to, speed, phase }: Moving) {
  const cloned = useFitCar(model);
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
    if (t.current > 1) t.current -= 1;
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
          key={`move-${car.from[0]}:${car.from[2]}`}
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
