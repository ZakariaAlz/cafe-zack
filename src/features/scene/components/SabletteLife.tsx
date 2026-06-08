"use client";

import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import { playChildGiggle } from "@/features/audio";
import { terrainHeight } from "../lib/terrain";
import { CasbahKid } from "./CasbahKid";
import { WalkingNPC } from "./WalkingNPC";

/**
 * Sablette life — the promenade brought alive: a row of little Algiers kiosks
 * (cotton-candy / tea-&-nuts / snack booths) along the seafront, plus families
 * strolling — a parent walking with a child running circles nearby. Each child
 * GIGGLES when the player walks past (proximity-triggered synth SFX, per-child
 * cooldown so it doesn't spam).
 *
 * All on the flat paved promenade (y≈0). Takes the active player body so it can
 * measure proximity for the giggles.
 */

const Y = 0.05;
const GIGGLE_RADIUS = 5.5; // metres
const GIGGLE_COOLDOWN = 4; // seconds between a child's giggles

type KioskKind = "candy" | "tea" | "snack";
const KIOSK_THEME: Record<KioskKind, { booth: string; awningA: string; awningB: string }> = {
  candy: { booth: "#E7A6C4", awningA: "#F4D0E0", awningB: "#D86FA3" },
  tea: { booth: "#7FAE83", awningA: "#CFE6D2", awningB: "#4E8C5A" },
  snack: { booth: "#C9A36A", awningA: "#EAD9B8", awningB: "#A06B33" },
};

/** A small promenade kiosk: painted counter + striped awning on two posts. */
function Kiosk({
  x,
  z,
  rotationY,
  kind,
}: {
  x: number;
  z: number;
  rotationY: number;
  kind: KioskKind;
}) {
  const t = KIOSK_THEME[kind];
  return (
    <group position={[x, terrainHeight(x, z), z]} rotation={[0, rotationY, 0]}>
      {/* Counter body */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.1, 0.9]} />
        <meshStandardMaterial color={t.booth} roughness={0.8} />
      </mesh>
      {/* Counter top lip */}
      <mesh position={[0, 1.12, 0.05]} castShadow>
        <boxGeometry args={[2.15, 0.08, 1.05]} />
        <meshStandardMaterial color="#EFE8DA" roughness={0.7} />
      </mesh>
      {/* Two posts */}
      {[-0.9, 0.9].map((px) => (
        <mesh key={px} position={[px, 1.6, -0.35]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
          <meshStandardMaterial color="#9A8060" roughness={0.8} />
        </mesh>
      ))}
      {/* Striped awning — alternating slats, tilted toward the sea */}
      <group position={[0, 2.35, 0.1]} rotation={[-0.25, 0, 0]}>
        {[-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].map((sx, i) => (
          <mesh key={sx} position={[sx, 0, 0]} castShadow>
            <boxGeometry args={[0.3, 0.04, 1.3]} />
            <meshStandardMaterial color={i % 2 === 0 ? t.awningA : t.awningB} roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const KIOSKS: { x: number; z: number; rotationY: number; kind: KioskKind }[] = [
  { x: 54, z: 31, rotationY: Math.PI / 2, kind: "candy" },
  { x: 54, z: 39, rotationY: Math.PI / 2, kind: "tea" },
  { x: 54, z: 48, rotationY: Math.PI / 2, kind: "snack" },
  { x: 55, z: 55, rotationY: Math.PI / 2, kind: "candy" },
];

type Family = {
  center: [number, number]; // child loop centre (x,z)
  pitch: number;
  parent: string;
  from: [number, number, number];
  to: [number, number, number];
};
const FAMILIES: Family[] = [
  {
    center: [60, 34],
    pitch: 1.1,
    parent: "npc-walker-f1.glb",
    from: [58, Y, 33],
    to: [63, Y, 36],
  },
  {
    center: [61, 45],
    pitch: 0.95,
    parent: "npc-walker-m1.glb",
    from: [59, Y, 47],
    to: [64, Y, 44],
  },
  {
    center: [58, 52],
    pitch: 1.2,
    parent: "npc-walker-f1.glb",
    from: [56, Y, 50],
    to: [60, Y, 54],
  },
];

export function SabletteLife({ playerRef }: { playerRef: RefObject<RapierRigidBody | null> }) {
  const cooldowns = useRef<number[]>(FAMILIES.map(() => 0));

  useFrame((_, dt) => {
    const body = playerRef.current;
    if (!body) return;
    const p = body.translation();
    for (let i = 0; i < FAMILIES.length; i++) {
      if (cooldowns.current[i] > 0) cooldowns.current[i] -= dt;
      const [cx, cz] = FAMILIES[i].center;
      const dx = p.x - cx;
      const dz = p.z - cz;
      if (dx * dx + dz * dz < GIGGLE_RADIUS * GIGGLE_RADIUS && cooldowns.current[i] <= 0) {
        playChildGiggle(FAMILIES[i].pitch);
        cooldowns.current[i] = GIGGLE_COOLDOWN;
      }
    }
  });

  return (
    <group>
      {KIOSKS.map((k) => (
        <Kiosk key={`kiosk-${k.x}-${k.z}`} {...k} />
      ))}
      {FAMILIES.map((f) => (
        <group key={`fam-${f.center[0]}-${f.center[1]}`}>
          <CasbahKid
            center={[f.center[0], terrainHeight(f.center[0], f.center[1]), f.center[1]]}
            radius={2.2}
            speed={1.8}
            phase={f.pitch}
          />
          <WalkingNPC model={f.parent} from={f.from} to={f.to} speed={0.7} phase={f.pitch} />
        </group>
      ))}
    </group>
  );
}
