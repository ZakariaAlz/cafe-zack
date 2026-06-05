"use client";

import { useMemo } from "react";
import { INLAND_X, WORLD_HALF_Z } from "../lib/terrain";

/**
 * The Sahel hills / Mont Bouzaréah backdrop — the ~407 m heights that frame
 * Algiers behind the amphitheatre (see docs/algiers-worldmap.md). A non-walkable
 * low-poly ridge of faceted peaks beyond the inland edge of the playable
 * terrain (west, x < INLAND_X), wrapping a little north and south so the city
 * reads as nestled in the hills with the bay opening east.
 *
 * Two rows — a near ridge and a hazier far ridge (lighter, atmospheric
 * perspective) — give depth. Visual only; the player can't reach it, and the
 * heightfield walls off the playable area, so no collider.
 */

const NEAR = "#7C8A7E"; // dry green-grey hillside
const FAR = "#97A6B0"; // hazier blue-grey distance

type Peak = { x: number; z: number; radius: number; height: number; color: string };

// Deterministic peaks (no random → stable across HMR). The near ridge sits just
// past the inland edge; the far ridge is taller, paler, and further back.
function ridge(rowX: number, color: string, radius: number, hMin: number, hMax: number): Peak[] {
  const peaks: Peak[] = [];
  const span = WORLD_HALF_Z + 60;
  let i = 0;
  for (let z = -span; z <= span; z += radius * 1.3) {
    // Deterministic pseudo-variation from the index so peaks aren't uniform.
    const j = Math.sin(i * 12.9898) * 43758.5453;
    const frac = j - Math.floor(j);
    peaks.push({
      x: rowX + (frac - 0.5) * radius,
      z,
      radius: radius * (0.8 + frac * 0.5),
      height: hMin + frac * (hMax - hMin),
      color,
    });
    i++;
  }
  return peaks;
}

export function Bouzareah() {
  const peaks = useMemo(
    () => [...ridge(INLAND_X - 35, NEAR, 26, 26, 44), ...ridge(INLAND_X - 80, FAR, 36, 40, 64)],
    [],
  );

  return (
    <group>
      {peaks.map((p) => (
        <mesh key={`${p.x.toFixed(1)}:${p.z.toFixed(1)}`} position={[p.x, p.height / 2 - 6, p.z]}>
          {/* 5-sided faceted cones read as chunky low-poly mountains. */}
          <coneGeometry args={[p.radius, p.height, 5]} />
          <meshStandardMaterial color={p.color} roughness={1} metalness={0} flatShading />
        </mesh>
      ))}
      {/* Mirror a sparse southern spur so the bowl wraps the south end too. */}
      {peaks.slice(0, 4).map((p) => (
        <mesh
          key={`s-${p.x.toFixed(1)}`}
          position={[p.z * 0.4, p.height / 2 - 6, WORLD_HALF_Z + 70 + p.x * 0.1]}
          rotation={[0, Math.PI, 0]}
        >
          <coneGeometry args={[p.radius, p.height * 0.8, 5]} />
          <meshStandardMaterial color={FAR} roughness={1} metalness={0} flatShading />
        </mesh>
      ))}
    </group>
  );
}
