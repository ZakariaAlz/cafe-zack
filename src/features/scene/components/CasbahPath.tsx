"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { terrainHeight } from "../lib/terrain";

/**
 * Casbah path — a paved cobble lane with raised stone sidewalks running down the
 * alley between the white houses. Built as terrain-draped ribbons (the same
 * technique as RoadNetwork): each ribbon samples terrainHeight along its whole
 * length so it follows the rolling medina slope instead of clipping it the way a
 * rigid road-tile mesh does. Three stacked ribbons read as sidewalk → path →
 * centre seam.
 *
 * Decorative: the heightfield terrain owns collision; this is the cosmetic skin.
 */

type V2 = [number, number];

const SIDEWALK = "#CDC6B4"; // pale kerb stone
const COBBLE = "#8A7F70"; // warm paved lane
const SEAM = "#6E6456"; // darker centre joint

const PATH: V2[] = [
  [30.4, -39.6],
  [34, -54],
  [38.6, -72.2],
];

/** Subdivide so the ribbon samples terrain finely along its length. */
function densify(points: V2[], step: number): V2[] {
  const out: V2[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[i + 1];
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.round(len / step));
    for (let s = 0; s < n; s++) out.push([x0 + ((x1 - x0) * s) / n, z0 + ((z1 - z0) * s) / n]);
  }
  out.push(points[points.length - 1]);
  return out;
}

/** A flat ribbon of `width` riding the terrain at `terrainHeight + lift`. */
function ribbon(points: V2[], width: number, lift: number): THREE.BufferGeometry {
  const dense = densify(points, 1.5);
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
    const px = -tz;
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

export function CasbahPath() {
  const geo = useMemo(
    () => ({
      sidewalk: ribbon(PATH, 6.4, 0.05),
      path: ribbon(PATH, 4, 0.09),
      seam: ribbon(PATH, 0.25, 0.12),
    }),
    [],
  );
  return (
    <group>
      <mesh geometry={geo.sidewalk} receiveShadow>
        <meshStandardMaterial color={SIDEWALK} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.path} receiveShadow>
        <meshStandardMaterial color={COBBLE} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.seam}>
        <meshStandardMaterial color={SEAM} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
