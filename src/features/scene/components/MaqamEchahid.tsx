"use client";

import { useFrame } from "@react-three/fiber";
import { CuboidCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import { useWorld } from "@/lib/world-store";

/**
 * Maqam Echahid (Martyrs' Memorial) — the Skills anchor. The real monument is
 * three towering concrete palm fronds curving up to meet at an apex, over an
 * eternal flame. Built procedurally as three tapered slabs leaning inward (at
 * 120°) to a shared cap, with an emissive flame + point light at the base.
 *
 * Southern terminus of the main road, mirroring the Grande Poste to the north.
 * Proximity trigger opens the Skills panel on E (same pattern as the others).
 */

const POSITION: [number, number, number] = [0, 0, 22];
const TRIGGER_RADIUS = 13;

const CONCRETE = "#B0ABA2";
const CONCRETE_DARK = "#9A958C";
const FLAME = "#FF7A1A";

// Three fronds at 120°; each leans from a base point on the platform up to a
// shared apex. atan2(baseR, rise) is the tilt from vertical about Z.
const BASE_R = 3.5;
const APEX_Y = 15;
const TILT = Math.atan2(BASE_R, APEX_Y - 1);

export function MaqamEchahid({ playerRef }: { playerRef: RefObject<RapierRigidBody | null> }) {
  const inside = useRef(false);

  useFrame(() => {
    const body = playerRef.current;
    if (!body) return;
    const dx = body.translation().x - POSITION[0];
    const dz = body.translation().z - POSITION[2];
    const near = dx * dx + dz * dz < TRIGGER_RADIUS * TRIGGER_RADIUS;
    if (near !== inside.current) {
      inside.current = near;
      const w = useWorld.getState();
      if (near) w.setNearby("maqam");
      else if (w.nearby === "maqam") w.setNearby(null);
    }
  });

  return (
    <group position={POSITION}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[4, 8, 4]} position={[0, 8, 0]} />
        <CuboidCollider args={[6.5, 0.6, 6.5]} position={[0, 0.6, 0]} />
      </RigidBody>

      {/* circular crypt base */}
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[6, 6.6, 1, 36]} />
        <meshStandardMaterial color={CONCRETE_DARK} roughness={0.9} />
      </mesh>

      {/* three leaning fronds */}
      {[0, 120, 240].map((deg) => (
        <group key={deg} rotation={[0, (deg * Math.PI) / 180, 0]}>
          <mesh position={[BASE_R / 2, (APEX_Y + 1) / 2, 0]} rotation={[0, 0, TILT]} castShadow>
            <boxGeometry args={[2.2, APEX_Y + 0.6, 0.85]} />
            <meshStandardMaterial color={CONCRETE} roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* apex cap where the fronds meet */}
      <mesh position={[0, APEX_Y, 0]} castShadow>
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.85} />
      </mesh>

      {/* eternal flame */}
      <mesh position={[0, 1.8, 0]}>
        <coneGeometry args={[0.5, 1.5, 14]} />
        <meshStandardMaterial
          color={FLAME}
          emissive={FLAME}
          emissiveIntensity={2}
          roughness={0.4}
        />
      </mesh>
      <pointLight position={[0, 2.4, 0]} color={FLAME} intensity={6} distance={12} decay={2} />
    </group>
  );
}
