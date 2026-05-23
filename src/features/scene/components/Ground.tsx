"use client";

/**
 * Ochre street plane — placeholder for the Algiers ground. Real
 * cobblestone / asphalt textures with Polyhaven materials land in Phase 4.
 */
export function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#C2410C" roughness={0.95} metalness={0} />
    </mesh>
  );
}
