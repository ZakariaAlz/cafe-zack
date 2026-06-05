"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { spawnAbove } from "../lib/terrain";
import { useTimeOfDay } from "../store/useTimeOfDay";

/**
 * Streetlamps lining the downtown roads (the "phares / lumières"). Each pole is
 * a SOLID fixed RigidBody — the car bumps into it instead of driving through —
 * and the head glows, warm and bright at night, dim by day. Anchored to the
 * terrain so they stand upright on the slope.
 */

const POLE = "#3A3A40";
const LAMP = "#FFE9A8";

// Hand-placed along the downtown front-de-mer + forecourt kerbs (x≈40–58).
const ANCHORS: [number, number][] = [
  [40, -30],
  [50, -30],
  [40, -12],
  [50, -12],
  [42, 6],
  [54, 6],
  [48, 24],
  [58, 24],
  [56, 38],
];

function Lamp({ x, z, lit }: { x: number; z: number; lit: number }) {
  const pos = useMemo(() => spawnAbove(x, z, 0), [x, z]);
  return (
    <group position={pos}>
      {/* Solid pole — fixed body with a thin collider the car can't pass. */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.18, 1.75, 0.18]} position={[0, 1.75, 0]} />
        <mesh position={[0, 1.75, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 3.5, 8]} />
          <meshStandardMaterial color={POLE} roughness={0.6} metalness={0.4} />
        </mesh>
      </RigidBody>
      {/* Arm + glowing head (visual only). */}
      <mesh position={[0.45, 3.5, 0]}>
        <boxGeometry args={[0.9, 0.09, 0.09]} />
        <meshStandardMaterial color={POLE} roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0.85, 3.44, 0]}>
        <boxGeometry args={[0.24, 0.16, 0.24]} />
        <meshStandardMaterial
          color={LAMP}
          emissive={LAMP}
          emissiveIntensity={lit}
          roughness={0.4}
        />
      </mesh>
      {lit > 1 && (
        <pointLight position={[0.85, 3.3, 0]} color={LAMP} intensity={6} distance={12} decay={2} />
      )}
    </group>
  );
}

export function Streetlamps() {
  const isNight = useTimeOfDay((s) => s.timeOfDay === "night");
  const lit = isNight ? 2.2 : 0.6;
  return (
    <group>
      {ANCHORS.map(([x, z]) => (
        <Lamp key={`${x}:${z}`} x={x} z={z} lit={lit} />
      ))}
    </group>
  );
}
