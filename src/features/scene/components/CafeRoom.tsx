"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";

/**
 * Procedural shell for the Café Zack interior — floor, four walls, ceiling, and
 * two emissive "street" windows on the front wall. Built by hand (rather than
 * from the kit) so we own the lighting surfaces and the collision exactly.
 *
 * Local space is centred on the room: X ∈ [-W/2, W/2], Z ∈ [-D/2, D/2], floor
 * at Y=0. The counter sits at the back (−Z), the door at the front (+Z). Warm
 * cream plaster + wood floor to match the café's exterior palette.
 */

const W = 8; // width  (X)
const D = 6; // depth  (Z)
const H = 3.2; // height (Y)
const T = 0.2; // wall thickness

const PLASTER = "#E4D6B8";
const PLASTER_DARK = "#D2C09A";
const FLOOR = "#6B4A2E";
const GLOW = "#FFD79A";

export function CafeRoom() {
  return (
    <group>
      {/* floor */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={FLOOR} roughness={0.85} />
      </mesh>
      {/* ceiling */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={PLASTER_DARK} roughness={0.95} />
      </mesh>

      {/* physics: floor + four walls keep the agent inside */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[W / 2, 0.1, D / 2]} position={[0, -0.1, 0]} />
        {/* back wall (−Z) */}
        <CuboidCollider args={[W / 2, H / 2, T / 2]} position={[0, H / 2, -D / 2]} />
        {/* front wall (+Z) */}
        <CuboidCollider args={[W / 2, H / 2, T / 2]} position={[0, H / 2, D / 2]} />
        {/* left wall (−X) */}
        <CuboidCollider args={[T / 2, H / 2, D / 2]} position={[-W / 2, H / 2, 0]} />
        {/* right wall (+X) */}
        <CuboidCollider args={[T / 2, H / 2, D / 2]} position={[W / 2, H / 2, 0]} />
      </RigidBody>

      {/* visible walls */}
      <mesh position={[0, H / 2, -D / 2]} receiveShadow>
        <boxGeometry args={[W, H, T]} />
        <meshStandardMaterial color={PLASTER} roughness={0.95} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} receiveShadow>
        <boxGeometry args={[T, H, D]} />
        <meshStandardMaterial color={PLASTER} roughness={0.95} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} receiveShadow>
        <boxGeometry args={[T, H, D]} />
        <meshStandardMaterial color={PLASTER} roughness={0.95} />
      </mesh>
      {/* front wall, split around the doorway so light reads from outside */}
      {[-(W / 4) - 0.5, W / 4 + 0.5].map((x) => (
        <mesh key={`front${x}`} position={[x, H / 2, D / 2]} receiveShadow>
          <boxGeometry args={[W / 2 - 1, H, T]} />
          <meshStandardMaterial color={PLASTER} roughness={0.95} />
        </mesh>
      ))}
      {/* lintel above the doorway */}
      <mesh position={[0, H - 0.4, D / 2]}>
        <boxGeometry args={[2, 0.8, T]} />
        <meshStandardMaterial color={PLASTER} roughness={0.95} />
      </mesh>

      {/* two warm street-facing windows flanking the door */}
      {[-2.4, 2.4].map((x) => (
        <mesh key={`win${x}`} position={[x, 1.7, D / 2 - T]}>
          <boxGeometry args={[1.4, 1.4, 0.05]} />
          <meshStandardMaterial
            color={GLOW}
            emissive={GLOW}
            emissiveIntensity={0.9}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
