"use client";

import { RigidBody } from "@react-three/rapier";

/**
 * Ochre street plane — placeholder for the Algiers ground. Real
 * cobblestone / asphalt textures with Polyhaven materials land in Phase 4.
 *
 * Wrapped in a fixed RigidBody so the Rapier vehicle has something to
 * drive on. The visual mesh is a 1-unit-thick box (top surface flush with
 * y=0) instead of a plane, so the cuboid collider has actual volume.
 */
export function Ground() {
  return (
    <RigidBody type="fixed" colliders="cuboid" friction={1.2}>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[60, 1, 60]} />
        <meshStandardMaterial color="#C2410C" roughness={0.95} metalness={0} />
      </mesh>
    </RigidBody>
  );
}
