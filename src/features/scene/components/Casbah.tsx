"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";

/**
 * The Casbah of Algiers — the Projects anchor. The real Casbah is a dense
 * stack of whitewashed cubic houses climbing the hillside above the port, so
 * it reads procedurally as a tight cluster of cream cubes of varied heights
 * (rising toward the back), some double-stacked, with small dark windows, a
 * citadel watchtower, and an arched doorway facing the road.
 *
 * Structure-only for now: visual + a single footprint collider so the car
 * bumps it. Proximity trigger + Projects panel come next (mirroring the
 * GrandePoste/About wiring). Deterministic layout via a seeded RNG so it never
 * flickers between renders. A real .glb can replace the <group> later.
 */

const POSITION: [number, number, number] = [-22, 0, -12];
const WHITES = ["#EDE6D4", "#E7DFCB", "#F1ECDB", "#E0D6BE", "#EAE2CF"];
const WINDOW = "#241A12";
const DOOR = "#2E2116";

/** mulberry32 — tiny deterministic PRNG so the cluster is stable + reproducible. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type House = {
  key: string;
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  window?: [number, number, number];
};

function buildCasbah(): House[] {
  const rand = mulberry32(42);
  const houses: House[] = [];
  const cell = 2.3;

  for (let ix = -3; ix <= 3; ix++) {
    for (let iz = -3; iz <= 3; iz++) {
      if (rand() < 0.18) continue; // leave gaps — the Casbah's alleys
      const x = ix * cell + (rand() - 0.5) * 0.5;
      const z = iz * cell + (rand() - 0.5) * 0.5;
      const rise = (3 - iz) * 0.55; // taller toward the back (-z), like the hillside
      const h = 2.4 + rise + rand() * 1.2;
      const w = cell * 0.78 + rand() * 0.3;
      const d = cell * 0.78 + rand() * 0.3;
      const color = WHITES[Math.floor(rand() * WHITES.length)];

      const house: House = { key: `h${ix}.${iz}`, pos: [x, h / 2, z], size: [w, h, d], color };
      if (rand() < 0.6) {
        house.window = [x + (rand() - 0.5) * 0.3, h * 0.5 + rand() * 0.5, z + d / 2 + 0.01];
      }
      houses.push(house);

      // some houses carry a smaller stacked box — the layered Casbah look
      if (rand() < 0.3) {
        const ch = 0.9 + rand() * 1.1;
        houses.push({
          key: `c${ix}.${iz}`,
          pos: [x + (rand() - 0.5) * 0.4, h + ch / 2, z + (rand() - 0.5) * 0.4],
          size: [w * 0.7, ch, d * 0.7],
          color: WHITES[Math.floor(rand() * WHITES.length)],
        });
      }
    }
  }
  return houses;
}

export function Casbah() {
  const houses = useMemo(buildCasbah, []);

  return (
    <group position={POSITION}>
      {/* single footprint collider — the car bumps the cluster as one block */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[7.5, 4, 7.5]} position={[0, 4, 0]} />
      </RigidBody>

      {houses.map((h) => (
        <group key={h.key}>
          <mesh position={h.pos} castShadow receiveShadow>
            <boxGeometry args={h.size} />
            <meshStandardMaterial color={h.color} roughness={0.92} />
          </mesh>
          {h.window && (
            <mesh position={h.window}>
              <boxGeometry args={[0.34, 0.5, 0.05]} />
              <meshStandardMaterial color={WINDOW} roughness={0.7} />
            </mesh>
          )}
        </group>
      ))}

      {/* Ottoman citadel watchtower at the back */}
      <mesh position={[0, 4.6, -4]} castShadow receiveShadow>
        <boxGeometry args={[3, 9.2, 3]} />
        <meshStandardMaterial color="#E2D8C0" roughness={0.9} />
      </mesh>
      <mesh position={[0, 9.4, -4]} castShadow>
        <boxGeometry args={[3.3, 0.4, 3.3]} />
        <meshStandardMaterial color="#D6C9AC" roughness={0.85} />
      </mesh>

      {/* arched doorway facing the road (+z) */}
      <mesh position={[0, 1.1, 7.0]}>
        <boxGeometry args={[1.2, 2.2, 0.3]} />
        <meshStandardMaterial color={DOOR} roughness={0.8} />
      </mesh>
    </group>
  );
}
