"use client";

import { useFrame } from "@react-three/fiber";
import { CuboidCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import { useWorld } from "@/lib/world-store";

/**
 * Notre-Dame d'Afrique — the Services anchor. The real basilica is a
 * Neo-Byzantine landmark on the cliff above the bay, defined by its big
 * oxidized dome on a drum, a bell tower, and an apse. Built procedurally as
 * cream stone + a grey-green dome with a gold cross, with a proximity trigger
 * (same pattern as the other landmarks) that opens the Services panel on E.
 *
 * Placed east, off the cross street. Shadows off — like the other distant
 * landmarks it sits outside the directional light's shadow camera.
 */

const POSITION: [number, number, number] = [22, 0, -10];
const TRIGGER_RADIUS = 11;

const STONE = "#E6DDC8";
const STONE_DARK = "#D6C9AC";
const DOME = "#8A9A95"; // oxidized copper-grey
const OCHRE = "#C2410C";
const GOLD = "#C9A24B";
const RECESS = "#221A12";

export function NotreDameDAfrique({ playerRef }: { playerRef: RefObject<RapierRigidBody | null> }) {
  const inside = useRef(false);

  useFrame(() => {
    const body = playerRef.current;
    if (!body) return;
    const t = body.translation();
    const dx = t.x - POSITION[0];
    const dz = t.z - POSITION[2];
    const near = dx * dx + dz * dz < TRIGGER_RADIUS * TRIGGER_RADIUS;
    if (near !== inside.current) {
      inside.current = near;
      const w = useWorld.getState();
      if (near) w.setNearby("notre-dame");
      else if (w.nearby === "notre-dame") w.setNearby(null);
    }
  });

  return (
    <group position={POSITION}>
      {/* footprint + low step collider so the car pulls up and bumps it */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[3.6, 5, 5]} position={[0, 5, 0]} />
        <CuboidCollider args={[5, 0.45, 4.6]} position={[0, 0.45, -0.5]} />
      </RigidBody>

      {/* plinth + steps */}
      <mesh position={[0, 0.25, -0.5]} receiveShadow>
        <boxGeometry args={[10, 0.5, 9]} />
        <meshStandardMaterial color={STONE} roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.15 + i * 0.16, 4.4 + i * 0.5]}>
          <boxGeometry args={[6 - i * 0.6, 0.16, 0.5]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
        </mesh>
      ))}

      {/* nave body */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[6, 5, 9]} />
        <meshStandardMaterial color={STONE} roughness={0.85} />
      </mesh>

      {/* cornice band */}
      <mesh position={[0, 5.6, 0]}>
        <boxGeometry args={[6.4, 0.4, 9.4]} />
        <meshStandardMaterial color={OCHRE} roughness={0.7} />
      </mesh>

      {/* semicircular apse at the rear (+Z) */}
      <mesh position={[0, 3, 4.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[2.6, 2.6, 5, 24, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={STONE} roughness={0.85} />
      </mesh>

      {/* drum + dome at the crossing */}
      <mesh position={[0, 6.2, -0.5]}>
        <cylinderGeometry args={[2.3, 2.3, 1.4, 28]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.8} />
      </mesh>
      <mesh position={[0, 6.9, -0.5]} castShadow>
        <sphereGeometry args={[2.45, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={DOME} roughness={0.5} metalness={0.35} />
      </mesh>
      {/* lantern + cross */}
      <mesh position={[0, 9.4, -0.5]}>
        <cylinderGeometry args={[0.4, 0.4, 0.7, 12]} />
        <meshStandardMaterial color={STONE} roughness={0.7} />
      </mesh>
      <mesh position={[0, 10.2, -0.5]}>
        <boxGeometry args={[0.1, 1.0, 0.1]} />
        <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 10.15, -0.5]}>
        <boxGeometry args={[0.5, 0.1, 0.1]} />
        <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* facade (front, -Z): arched entrance + rose window */}
      <mesh position={[0, 1.9, -4.55]}>
        <boxGeometry args={[1.7, 2.8, 0.4]} />
        <meshStandardMaterial color={RECESS} roughness={1} />
      </mesh>
      <mesh position={[0, 4.2, -4.55]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.12, 12, 24]} />
        <meshStandardMaterial color={OCHRE} roughness={0.6} />
      </mesh>

      {/* square bell tower at the front corner */}
      <group position={[3.6, 0, -3.6]}>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[1.8, 8, 1.8]} />
          <meshStandardMaterial color={STONE} roughness={0.85} />
        </mesh>
        <mesh position={[0, 8.3, 0]}>
          <boxGeometry args={[2, 0.4, 2]} />
          <meshStandardMaterial color={OCHRE} roughness={0.7} />
        </mesh>
        <mesh position={[0, 9.1, 0]} castShadow>
          <coneGeometry args={[1.3, 1.6, 4]} />
          <meshStandardMaterial color={DOME} roughness={0.5} metalness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
