"use client";

import { RigidBody } from "@react-three/rapier";

/**
 * Algiers ground plane. Was a 60×60 plateau (the user described it as
 * "a plateau in the sky"); now a 320×320 disc so the horizon recedes and
 * the world reads as open. Top surface stays flush with y=0 so all
 * existing landmark positions and physics tuning are unchanged.
 *
 * Real cobblestone / asphalt PBR materials land in a follow-up pass.
 */
export function Ground() {
  return (
    <RigidBody type="fixed" colliders="cuboid" friction={1.2}>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[320, 1, 320]} />
        <meshStandardMaterial color="#C2410C" roughness={0.95} metalness={0} />
      </mesh>
    </RigidBody>
  );
}
