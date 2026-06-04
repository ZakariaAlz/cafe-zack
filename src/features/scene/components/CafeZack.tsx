"use client";

import { useFrame } from "@react-three/fiber";
import { CuboidCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useMemo, useRef } from "react";
import { useWorld } from "@/lib/world-store";

/**
 * Café Zack — the Contact anchor and the site's destination. The only warm,
 * inviting interior in a world of monuments: cream walls, a glowing storefront,
 * a striped awning, a lit sign, and string lights, with a warm point light
 * pooling out front. Proximity opens the Contact panel; the face-reveal
 * cinematic (sunglasses off) lands in a follow-up.
 *
 * Placed southeast, off the cross street. The storefront faces -Z (the
 * approach). Built warm on purpose — it should feel like arriving somewhere.
 */

const POSITION: [number, number, number] = [15, 0, 12];
const TRIGGER_RADIUS = 9;

const WALL = "#E4D6B8";
const WALL_DARK = "#D2C09A";
const AWNING = "#C2410C";
const GLOW = "#FFD79A"; // warm interior light
const SIGN = "#FFE7B8";
const WOOD = "#5A3A22";

export function CafeZack({ playerRef }: { playerRef: RefObject<RapierRigidBody | null> }) {
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
      if (near) w.setNearby("cafe-zack");
      else if (w.nearby === "cafe-zack") w.setNearby(null);
    }
    // The café reveal: the face veil evaporates while the agent is in front of
    // the café on foot, and re-forms when he leaves or drives off. Reversible
    // and proximity-driven — only written on a change so we don't thrash state.
    const w = useWorld.getState();
    const shouldReveal = near && w.mode === "onFoot";
    if (shouldReveal !== w.faceRevealed) w.setFaceRevealed(shouldReveal);
  });

  // String lights along the storefront eave.
  const lights = useMemo(() => [-2.6, -1.7, -0.8, 0.1, 1, 1.9, 2.6], []);

  return (
    <group position={POSITION}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[3.6, 2.2, 3]} position={[0, 2.2, 0.4]} />
      </RigidBody>

      {/* building shell */}
      <mesh position={[0, 2, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[7, 4, 5]} />
        <meshStandardMaterial color={WALL} roughness={0.9} />
      </mesh>
      {/* parapet */}
      <mesh position={[0, 4.1, 0.5]}>
        <boxGeometry args={[7.2, 0.4, 5.2]} />
        <meshStandardMaterial color={WALL_DARK} roughness={0.85} />
      </mesh>

      {/* glowing storefront windows (front, -Z) */}
      {[-1.9, 1.9].map((x) => (
        <mesh key={`win${x}`} position={[x, 1.7, -2.02]}>
          <boxGeometry args={[2.4, 2.2, 0.08]} />
          <meshStandardMaterial
            color={GLOW}
            emissive={GLOW}
            emissiveIntensity={1.3}
            roughness={0.3}
          />
        </mesh>
      ))}
      {/* glass door, warm */}
      <mesh position={[0, 1.2, -2.02]}>
        <boxGeometry args={[1.3, 2.4, 0.08]} />
        <meshStandardMaterial
          color={GLOW}
          emissive={GLOW}
          emissiveIntensity={0.9}
          roughness={0.3}
        />
      </mesh>
      {/* door + window frames (wood) */}
      <mesh position={[0, 0.05, -2.05]}>
        <boxGeometry args={[7, 0.3, 0.2]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>

      {/* striped awning over the storefront, tilted out */}
      <mesh position={[0, 3, -2.55]} rotation={[-0.45, 0, 0]} castShadow>
        <boxGeometry args={[7.2, 0.18, 1.6]} />
        <meshStandardMaterial color={AWNING} roughness={0.7} />
      </mesh>

      {/* lit sign board above the awning */}
      <mesh position={[0, 3.7, -2.2]}>
        <boxGeometry args={[3.4, 0.7, 0.15]} />
        <meshStandardMaterial
          color={SIGN}
          emissive={SIGN}
          emissiveIntensity={0.8}
          roughness={0.4}
        />
      </mesh>

      {/* string lights along the eave */}
      {lights.map((x) => (
        <mesh key={`bulb${x}`} position={[x, 2.95, -2.7]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.2} />
        </mesh>
      ))}

      {/* two bistro tables out front */}
      {[-2.2, 2.2].map((x) => (
        <group key={`table${x}`} position={[x, 0, -3.6]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
            <meshStandardMaterial color={WOOD} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.08, 16]} />
            <meshStandardMaterial color={WALL_DARK} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* warm pool of light spilling onto the street */}
      <pointLight position={[0, 2.4, -3]} color={GLOW} intensity={8} distance={14} decay={2} />
    </group>
  );
}
