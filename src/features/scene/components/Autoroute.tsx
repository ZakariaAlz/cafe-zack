"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { AMBIENT_FLEET, CAR_LENGTH, type CarModel } from "../lib/cars";
import { fitCarToLength } from "../lib/fitCar";
import { terrainHeight } from "../lib/terrain";
import { useModel } from "../lib/useModel";

/**
 * The coastal autoroute — a flat seafront highway (the Algiers corniche), one of
 * the five anchor zones, with cars actually DRIVING along it instead of parked.
 * Runs straight along Z on the flat coastal shelf (y≈0, north of the Sablette,
 * clear of the sea at x=70). The surface is procedural (asphalt + shoulders +
 * lane lines) — a rigid highway-tile GLB renders as a thick boxy slab here, the
 * same problem the Casbah hit, so flat painted lanes read far cleaner.
 *
 * Cars loop: each advances along its lane and wraps at the ends. Car native
 * forward is −Z (rotationY 0 in Traffic), so southbound (−Z) keeps yaw 0 and
 * northbound (+Z) faces yaw π.
 */

const ROAD_X = 63; // coastal centreline (shore is x=70; road spans 58–68)
const ROAD_WIDTH = 10;
const Z_MIN = -28;
const Z_MAX = 22;
const Z_LEN = Z_MAX - Z_MIN;

const ASPHALT = "#2B2B30";
const SHOULDER = "#CDC6B4";
const YELLOW = "#F0CC55";
const WHITE = "#D8D8D0";

type CarLane = { model: CarModel; laneX: number; dir: 1 | -1; speed: number; phase: number };

const LANES: CarLane[] = [
  { model: AMBIENT_FLEET[0], laneX: 60.4, dir: -1, speed: 9, phase: 0 },
  { model: AMBIENT_FLEET[3], laneX: 61.8, dir: -1, speed: 11, phase: 0.4 },
  { model: AMBIENT_FLEET[6], laneX: 64.2, dir: 1, speed: 10, phase: 0.2 },
  { model: AMBIENT_FLEET[1], laneX: 65.6, dir: 1, speed: 12.5, phase: 0.65 },
  { model: AMBIENT_FLEET[4], laneX: 61.8, dir: -1, speed: 10, phase: 0.85 },
  { model: AMBIENT_FLEET[2], laneX: 64.2, dir: 1, speed: 9.5, phase: 0.35 },
];

/**
 * A terrain-draped strip along Z at centre-x `cx`, sampled every 2 m so it
 * tracks the slight coastal rise instead of being buried by it (the bug a flat
 * plane hit at the north end).
 */
function drapedStrip(cx: number, width: number, lift: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const half = width / 2;
  const rows: number[] = [];
  for (let z = Z_MIN; z <= Z_MAX; z += 2) rows.push(z);
  for (let i = 0; i < rows.length; i++) {
    const z = rows[i];
    const lx = cx - half;
    const rx = cx + half;
    positions.push(lx, terrainHeight(lx, z) + lift, z);
    positions.push(rx, terrainHeight(rx, z) + lift, z);
    if (i < rows.length - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function Strip({
  x,
  width,
  color,
  lift,
}: {
  x: number;
  width: number;
  color: string;
  lift: number;
}) {
  const geo = useMemo(() => drapedStrip(x, width, lift), [x, width, lift]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

function MovingCar({ model, laneX, dir, speed, phase }: CarLane) {
  const { scene } = useModel(model);
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitCarToLength(c, CAR_LENGTH[model]);
    return c;
  }, [scene, model]);
  const ref = useRef<THREE.Group>(null);
  const z = useRef(Z_MIN + phase * Z_LEN);

  useFrame((_, dt) => {
    z.current += dir * speed * Math.min(dt, 0.05);
    if (z.current > Z_MAX) z.current -= Z_LEN;
    if (z.current < Z_MIN) z.current += Z_LEN;
    const g = ref.current;
    if (!g) return;
    g.position.set(laneX, terrainHeight(laneX, z.current) + 0.1, z.current);
    g.rotation.y = dir > 0 ? Math.PI : 0;
  });

  return (
    <group ref={ref}>
      <primitive object={cloned} />
    </group>
  );
}

export function Autoroute() {
  // Dashed centre + lane lines along the road, as short strips.
  const dashes = useMemo(() => {
    const out: { key: string; z: number }[] = [];
    let i = 0;
    for (let z = Z_MIN + 1; z < Z_MAX; z += 4) {
      out.push({ key: `d${i}`, z });
      i++;
    }
    return out;
  }, []);

  return (
    <group>
      {/* Raised stone shoulders, dark asphalt, painted edge + centre lines. */}
      <Strip x={ROAD_X} width={ROAD_WIDTH + 3} color={SHOULDER} lift={0.05} />
      <Strip x={ROAD_X} width={ROAD_WIDTH} color={ASPHALT} lift={0.08} />
      <Strip x={ROAD_X - ROAD_WIDTH / 2 + 0.3} width={0.18} color={WHITE} lift={0.1} />
      <Strip x={ROAD_X + ROAD_WIDTH / 2 - 0.3} width={0.18} color={WHITE} lift={0.1} />
      {/* Dashed yellow centre line, each dash dropped onto the terrain. */}
      {dashes.map((d) => (
        <mesh
          key={d.key}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[ROAD_X, terrainHeight(ROAD_X, d.z) + 0.12, d.z]}
        >
          <planeGeometry args={[0.22, 2]} />
          <meshStandardMaterial color={YELLOW} roughness={0.6} />
        </mesh>
      ))}
      {LANES.map((l) => (
        <MovingCar key={`car-${l.model}-${l.laneX}-${l.phase}`} {...l} />
      ))}
    </group>
  );
}
