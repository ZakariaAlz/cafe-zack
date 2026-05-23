"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

/**
 * Stand-in for the suited Agent character. Real RPM + Mixamo rig lands in Phase 2.
 * Dimensions chosen to read as a human silhouette at the default camera distance.
 */
export function PlaceholderCharacter() {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.3;
  });

  return (
    <mesh ref={ref} position={[0, 0.85, 0]} castShadow>
      <boxGeometry args={[0.55, 1.7, 0.3]} />
      <meshStandardMaterial color="#0A0A0A" roughness={0.45} metalness={0.05} />
    </mesh>
  );
}
