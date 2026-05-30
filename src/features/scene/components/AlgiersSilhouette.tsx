"use client";

import { useMemo } from "react";

/**
 * Themed perimeter silhouette per district — replaces the original 9
 * generic boxes with low-poly blocks that hint at real Algiers:
 *
 *  - North (Grande Poste / haussmannian): tall cream + ochre facades with
 *    flat roofs and roof balustrades
 *  - East (Notre-Dame d'Afrique): cream domed structures + minaret hints
 *  - South-east + south: lower cream + sandstone blocks (boulevards),
 *    plus a Maqam-Echahid trio echoing the south anchor on the horizon
 *  - West (Casbah): dense stack of whitewashed cubes climbing the hill,
 *    plus a citadel watchtower
 *  - Far north (corniche): low waterfront block + sea wall hint
 *
 * Deterministic per-position — no random, so the silhouette is stable
 * across HMR. No shadows; perimeter geometry doesn't need to cast.
 */

const CREAM = "#EBDFBE";
const CREAM_DARK = "#D6C7A4";
const OCHRE = "#C28F66";
const OCHRE_DARK = "#A37A56";
const WHITE = "#F5EDDB";
const WHITE_DARK = "#E5DBC4";
const DOME = "#E8DCC4";
const STONE = "#C5BFA8";
const RUST = "#8C5638";

type Block = {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
};

type DomeBlock = {
  position: [number, number, number];
  radius: number;
  color: string;
};

// Deterministic — listing by hand keeps the silhouette under our control.
const NORTH: Block[] = [
  // Tall haussmann-ish facades flanking the Grande Poste at the back
  { position: [-9, 7, -28], size: [5.5, 14, 3.5], color: CREAM },
  { position: [-4, 6, -32], size: [4, 12, 4], color: CREAM_DARK },
  { position: [4, 6.5, -32], size: [4.5, 13, 4], color: OCHRE },
  { position: [9, 7, -28], size: [5.5, 14, 3.5], color: CREAM },
  // Roof balustrade hints (thin strips on top of the tall ones)
  { position: [-9, 14.3, -28], size: [5.7, 0.6, 3.7], color: WHITE },
  { position: [9, 14.3, -28], size: [5.7, 0.6, 3.7], color: WHITE },
];

const EAST: Block[] = [
  // Notre-Dame side: cream blocks rising up the hill
  { position: [22, 6, -22], size: [5, 12, 4], color: CREAM },
  { position: [28, 4, -16], size: [4.5, 8, 3.5], color: CREAM_DARK },
  { position: [30, 7, -28], size: [4.5, 14, 4], color: WHITE },
  { position: [26, 5, -8], size: [4.5, 10, 3.5], color: OCHRE_DARK },
];

const EAST_DOMES: DomeBlock[] = [
  { position: [22, 12, -22], radius: 2.7, color: DOME },
  { position: [30, 14, -28], radius: 2.4, color: DOME },
];

const WEST: Block[] = [
  // Casbah — dense whitewashed cubes climbing the slope, varied heights
  { position: [-26, 3, -8], size: [3.4, 6, 3], color: WHITE },
  { position: [-29, 4, -12], size: [3.4, 8, 3], color: WHITE_DARK },
  { position: [-30, 5, -18], size: [3.6, 10, 3.4], color: WHITE },
  { position: [-27, 4, -22], size: [3.2, 8, 3.2], color: CREAM_DARK },
  { position: [-31, 6, -25], size: [3.4, 12, 3.4], color: WHITE_DARK },
  { position: [-24, 5, -28], size: [3.4, 10, 3.2], color: WHITE },
  // Citadel watchtower at the back
  { position: [-29, 8, -30], size: [3, 16, 3], color: STONE },
];

const SOUTH: Block[] = [
  // South of the world, beyond the Maqam — wide low cream + sandstone
  { position: [-12, 4, 60], size: [6, 8, 4], color: CREAM },
  { position: [-5, 5, 64], size: [5, 10, 4], color: CREAM_DARK },
  { position: [5, 5, 64], size: [5, 10, 4], color: OCHRE },
  { position: [12, 4, 60], size: [6, 8, 4], color: CREAM },
  // Maqam-style trio echoing the south anchor on the horizon
  { position: [-3, 8, 70], size: [0.9, 16, 0.9], color: RUST },
  { position: [0, 8, 70], size: [0.9, 16, 0.9], color: RUST },
  { position: [3, 8, 70], size: [0.9, 16, 0.9], color: RUST },
];

const NORTH_BAY: Block[] = [
  // Far-north waterfront — low blocks beyond the corniche, hint at the
  // shoreline architecture on the other side of the bay
  { position: [-20, 2.5, -110], size: [10, 5, 4], color: CREAM_DARK },
  { position: [-5, 3, -115], size: [12, 6, 4], color: CREAM },
  { position: [10, 2.5, -110], size: [8, 5, 4], color: WHITE_DARK },
  { position: [22, 3, -113], size: [10, 6, 4], color: CREAM_DARK },
];

const MINARET = {
  position: [12, 0, -12] as [number, number, number],
  height: 16,
  color: WHITE,
};

function BoxBlock({ block }: { block: Block }) {
  return (
    <mesh position={block.position}>
      <boxGeometry args={block.size} />
      <meshStandardMaterial color={block.color} roughness={0.85} />
    </mesh>
  );
}

function Dome({ block }: { block: DomeBlock }) {
  return (
    <mesh position={block.position}>
      <sphereGeometry args={[block.radius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={block.color} roughness={0.7} />
    </mesh>
  );
}

export function AlgiersSilhouette() {
  const all = useMemo(() => [...NORTH, ...EAST, ...WEST, ...SOUTH, ...NORTH_BAY], []);

  return (
    <group>
      {all.map((b) => (
        <BoxBlock key={`${b.position[0]}:${b.position[1]}:${b.position[2]}`} block={b} />
      ))}
      {EAST_DOMES.map((d) => (
        <Dome key={`dome:${d.position[0]}:${d.position[2]}`} block={d} />
      ))}

      {/* East minaret tucked behind Notre-Dame side */}
      <mesh position={[MINARET.position[0], MINARET.height / 2, MINARET.position[2] - 18]}>
        <cylinderGeometry args={[0.45, 0.5, MINARET.height, 12]} />
        <meshStandardMaterial color={MINARET.color} roughness={0.6} />
      </mesh>
      <mesh position={[MINARET.position[0], MINARET.height + 0.6, MINARET.position[2] - 18]}>
        <coneGeometry args={[0.7, 1.4, 12]} />
        <meshStandardMaterial color={MINARET.color} roughness={0.6} />
      </mesh>
    </group>
  );
}
