"use client";

import { CylinderCollider, RigidBody } from "@react-three/rapier";

/**
 * Procedural Mediterranean palm — a tall ribbed trunk + a fan of six fronds
 * angled outward from the apex. Used along the Algiers corniche where the
 * dropped KayKit Forest pack doesn't ship a true palm asset and licensing a
 * Sketchfab one is overkill for the silhouette.
 *
 * Deterministic per `seed` so two palms at the same x don't twin each other.
 */

const TRUNK = "#A57B3F";
const TRUNK_DARK = "#7A5A2B";
const FROND = "#3E7A3B";
const FROND_DARK = "#2D5A2A";

const TRUNK_HEIGHT = 6.5;
const TRUNK_BASE_R = 0.22;
const TRUNK_TIP_R = 0.14;
const FROND_LENGTH = 3.2;
const FROND_COUNT = 7;

function frondAngle(i: number): number {
  return (i / FROND_COUNT) * Math.PI * 2;
}

export function Palm({
  position,
  seed = 0,
  scale = 1,
}: {
  position: [number, number, number];
  /** Tiny per-instance rotation/lean so a row of palms doesn't read as cloned. */
  seed?: number;
  scale?: number;
}) {
  const lean = ((seed * 7919) % 100) / 1000;
  const yaw = ((seed * 4297) % 360) * (Math.PI / 180);

  return (
    <group position={position} rotation={[lean, yaw, lean * 0.7]} scale={scale}>
      {/* Trunk collider — fixed cylinder so you can't walk/drive through the
          palm. The group's uniform scale carries to the collider; the cosmetic
          lean is negligible for blocking. */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider
          args={[TRUNK_HEIGHT / 2, TRUNK_BASE_R * 1.3]}
          position={[0, TRUNK_HEIGHT / 2, 0]}
        />
      </RigidBody>
      {/* trunk — slight taper, ribbed by a stack of two cylinders for read */}
      <mesh position={[0, TRUNK_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[TRUNK_TIP_R, TRUNK_BASE_R, TRUNK_HEIGHT, 10]} />
        <meshStandardMaterial color={TRUNK} roughness={0.95} />
      </mesh>
      {/* dark band near the base — palm fibrous look */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[TRUNK_BASE_R * 1.04, TRUNK_BASE_R * 1.08, 0.4, 10]} />
        <meshStandardMaterial color={TRUNK_DARK} roughness={0.95} />
      </mesh>
      {/* crown — small dark sphere where fronds anchor */}
      <mesh position={[0, TRUNK_HEIGHT + 0.05, 0]} castShadow>
        <sphereGeometry args={[0.28, 10, 8]} />
        <meshStandardMaterial color={FROND_DARK} roughness={0.9} />
      </mesh>
      {/* fronds — narrow elongated boxes drooping at ~25° below horizontal */}
      {Array.from({ length: FROND_COUNT }, (_, i) => frondAngle(i)).map((a) => {
        const dx = Math.cos(a) * (FROND_LENGTH * 0.5);
        const dz = Math.sin(a) * (FROND_LENGTH * 0.5);
        const droop = -Math.PI / 7;
        return (
          <group
            key={`frond-${a.toFixed(4)}`}
            position={[dx, TRUNK_HEIGHT + 0.05, dz]}
            rotation={[droop * Math.sin(a), -a + Math.PI / 2, droop * Math.cos(a)]}
          >
            <mesh position={[0, 0, FROND_LENGTH / 2]} castShadow>
              <boxGeometry args={[0.55, 0.04, FROND_LENGTH]} />
              <meshStandardMaterial color={FROND} roughness={0.85} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
