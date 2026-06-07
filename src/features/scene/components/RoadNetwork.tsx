"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { LANDMARK_XZ, terrainHeight } from "../lib/terrain";

/**
 * The road graph — the dossier itinerary draped over the amphitheatre. Roads are
 * ribbon meshes that follow terrainHeight along their length (a few cm above the
 * surface), so they climb and descend the slope instead of clipping into it.
 *
 * Purely decorative: the heightfield terrain owns ALL driving collision, so the
 * car climbs/descends on the ground beneath; the asphalt is a cosmetic skin.
 * Endpoints are anchored to the landmark positions, so the network tracks them.
 */

const ASPHALT = "#2B2B30";
const LINE = "#F0CC55";
const SIDEWALK = "#CDC6B4"; // pale kerb stone — matches the Casbah path

type V2 = [number, number];

const GP = LANDMARK_XZ["grande-poste"];
const ND = LANDMARK_XZ["notre-dame"];
const CAS = LANDMARK_XZ.casbah;
const MAQ = LANDMARK_XZ.maqam;
const CAFE = LANDMARK_XZ["cafe-zack"];

// Dossier §3: the front-de-mer spine (Notre-Dame → downtown → Sablette/Café),
// the climb into the Casbah, and the climb up to Maqam Echahid.
const PATHS: { points: V2[]; width: number }[] = [
  {
    points: [
      [ND[0], ND[1]],
      [44, -45],
      [GP[0], GP[1]],
      [52, 22],
      [CAFE[0], CAFE[1]],
    ],
    width: 8,
  },
  {
    points: [
      [GP[0], GP[1]],
      [38, -14],
      [CAS[0], CAS[1]],
    ],
    width: 6,
  },
  {
    points: [
      [52, 22],
      [24, 38],
      [MAQ[0], MAQ[1]],
    ],
    width: 6,
  },
];

/** Subdivide a polyline so the ribbon samples terrain along its whole length. */
function densify(points: V2[], step: number): V2[] {
  const out: V2[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[i + 1];
    const segLen = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.round(segLen / step));
    for (let s = 0; s < n; s++) out.push([x0 + ((x1 - x0) * s) / n, z0 + ((z1 - z0) * s) / n]);
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Build a flat ribbon of `width` that rides the terrain at `terrainHeight + lift`. */
function ribbon(points: V2[], width: number, lift: number): THREE.BufferGeometry {
  const dense = densify(points, 2.5);
  const positions: number[] = [];
  const indices: number[] = [];
  const half = width / 2;
  for (let i = 0; i < dense.length; i++) {
    const [x, z] = dense[i];
    const prev = dense[Math.max(0, i - 1)];
    const next = dense[Math.min(dense.length - 1, i + 1)];
    let tx = next[0] - prev[0];
    let tz = next[1] - prev[1];
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl;
    tz /= tl;
    const px = -tz; // perpendicular in XZ
    const pz = tx;
    const lx = x + px * half;
    const lz = z + pz * half;
    const rx = x - px * half;
    const rz = z - pz * half;
    positions.push(lx, terrainHeight(lx, lz) + lift, lz);
    positions.push(rx, terrainHeight(rx, rz) + lift, rz);
    if (i < dense.length - 1) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function RoadNetwork() {
  const roads = useMemo(
    () =>
      // Sidewalk RAISED above the asphalt (lift 0.16 > 0.07) so it reads as a
      // real kerb, not a strip painted under the road; wider footpath (+3.6).
      PATHS.map((p, i) => ({
        key: `road-${i}`,
        kerb: ribbon(p.points, p.width + 3.6, 0.16),
        asphalt: ribbon(p.points, p.width, 0.07),
        line: ribbon(p.points, 0.3, 0.1),
      })),
    [],
  );

  return (
    <group>
      {roads.map((r) => (
        <group key={r.key}>
          <mesh geometry={r.kerb} receiveShadow>
            <meshStandardMaterial color={SIDEWALK} roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={r.asphalt} receiveShadow>
            <meshStandardMaterial color={ASPHALT} roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={r.line}>
            <meshStandardMaterial color={LINE} roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
