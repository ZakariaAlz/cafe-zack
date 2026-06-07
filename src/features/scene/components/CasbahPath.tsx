"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { makePavingTexture } from "../lib/paving";
import { terrainHeight } from "../lib/terrain";

/**
 * Casbah path — a NARROW grey-stone paved lane with slim raised kerbs, running
 * down the alley between the white houses. Built as terrain-draped ribbons (the
 * RoadNetwork technique) so it follows the rolling medina slope instead of
 * clipping it. The lane carries a procedural cobble-sett texture (small grey
 * setts) for a real "pavé" read; the kerbs are pale stone.
 *
 * Decorative: the heightfield terrain owns collision; this is the cosmetic skin.
 */

type V2 = [number, number];

const KERB = "#BCB6A8"; // pale kerb stone
const SEAM = "#5C564C"; // darker centre joint

// Narrow medina proportions: a tight cobble lane, with the pale stone footway
// widened to fill up to the house fronts (alley HALF_WIDTH 5.5) so no bare
// ground shows between the lane and the walls.
const KERB_W = 9.4;
const LANE_W = 2.4;
const PAVE_SCALE = 1.2; // metres per texture tile — small setts

const PATH: V2[] = [
  [30.4, -39.6],
  [34, -54],
  [38.6, -72.2],
];

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

/**
 * A terrain-draped ribbon of `width`, lifted `lift`, with UVs so a tiling
 * texture maps along it (u = arc length, v = across width), both in metres /
 * `paveScale` so setts stay square.
 */
function ribbon(
  points: V2[],
  width: number,
  lift: number,
  paveScale: number,
): THREE.BufferGeometry {
  const dense = densify(points, 1.5);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const half = width / 2;
  let arc = 0;
  for (let i = 0; i < dense.length; i++) {
    const [x, z] = dense[i];
    if (i > 0) arc += Math.hypot(x - dense[i - 1][0], z - dense[i - 1][1]);
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
    const u = arc / paveScale;
    uvs.push(u, 0, u, width / paveScale);
    if (i < dense.length - 1) {
      const a = i * 2;
      const b = i * 2 + 1;
      const cc = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, cc, b, d, cc);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function CasbahPath() {
  const paving = useMemo(
    () => makePavingTexture({ base: "#8E8980", grout: "#5A554C", cells: 5, variation: 0.16 }),
    [],
  );
  const geo = useMemo(
    () => ({
      kerb: ribbon(PATH, KERB_W, 0.14, PAVE_SCALE),
      lane: ribbon(PATH, LANE_W, 0.07, PAVE_SCALE),
      seam: ribbon(PATH, 0.18, 0.1, PAVE_SCALE),
    }),
    [],
  );
  return (
    <group>
      {/* Slim raised kerb (pale stone). */}
      <mesh geometry={geo.kerb} receiveShadow>
        <meshStandardMaterial color={KERB} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* Narrow paved lane — grey cobble setts. */}
      <mesh geometry={geo.lane} receiveShadow>
        <meshStandardMaterial map={paving} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.seam}>
        <meshStandardMaterial color={SEAM} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
