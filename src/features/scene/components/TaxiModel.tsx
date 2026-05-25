"use client";

import type { ThreeElements } from "@react-three/fiber";

/**
 * Procedural vintage taxi (PR C) — a Peugeot 504-style three-box sedan built
 * from primitives instead of a downloaded model. The 504 is famously boxy
 * (distinct hood / upright cabin / flat trunk), which reads cleanly in
 * low-poly, and going procedural keeps us at $0 with full control over the
 * Algiers-yellow livery and the lit roof sign.
 *
 * Visual only — no physics. The parent <Vehicle> owns the RigidBody and an
 * explicit CuboidCollider, so the wheels and bumpers that poke past the body
 * here don't bloat the collision box.
 *
 * Local frame matches the collider: origin at the chassis centre, forward is
 * -Z, and y = -0.4 is the collider bottom (where the car rests on the road),
 * so the wheels are sized to touch ground at that line.
 */

// Algiers taxi livery + shared trims.
const BODY = "#F5C842"; // taxi yellow
const GLASS = "#10171E"; // dark tinted greenhouse (no green lenses — see CLAUDE.md)
const TIRE = "#15161A";
const HUBCAP = "#C8CDD2";
const CHROME = "#D9DDE2";

// Geometry constants tuned so wheel bottoms land on the collider floor (-0.4).
const WHEEL_RADIUS = 0.36;
const WHEEL_WIDTH = 0.26;
const WHEEL_Y = -0.04; // centre; bottom = WHEEL_Y - WHEEL_RADIUS = -0.40
const AXLE_X = 0.74;
const FRONT_Z = -1.0;
const REAR_Z = 1.05;

const PI_2 = Math.PI / 2;

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* tyre — cylinder laid on its side so it rolls about the X axis */}
      <mesh rotation={[0, 0, PI_2]} castShadow>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 20]} />
        <meshStandardMaterial color={TIRE} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* chrome hubcap on the outboard face */}
      <mesh
        position={[Math.sign(position[0]) * (WHEEL_WIDTH / 2 + 0.01), 0, 0]}
        rotation={[0, 0, PI_2]}
      >
        <cylinderGeometry args={[WHEEL_RADIUS * 0.45, WHEEL_RADIUS * 0.45, 0.04, 16]} />
        <meshStandardMaterial color={HUBCAP} roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

export function TaxiModel(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      {/* lower body / door section — the long central slab */}
      <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.5, 3.0]} />
        <meshStandardMaterial color={BODY} roughness={0.45} metalness={0.25} />
      </mesh>

      {/* hood (front, -Z) — sits a touch lower than the cabin */}
      <mesh position={[0, 0.27, -1.0]} castShadow>
        <boxGeometry args={[1.42, 0.16, 1.0]} />
        <meshStandardMaterial color={BODY} roughness={0.45} metalness={0.25} />
      </mesh>

      {/* trunk (rear, +Z) — short flat deck */}
      <mesh position={[0, 0.28, 1.08]} castShadow>
        <boxGeometry args={[1.42, 0.18, 0.78]} />
        <meshStandardMaterial color={BODY} roughness={0.45} metalness={0.25} />
      </mesh>

      {/* greenhouse glass — one dark box; yellow pillars + roof framed over it */}
      <mesh position={[0, 0.49, 0.05]}>
        <boxGeometry args={[1.3, 0.46, 1.42]} />
        <meshStandardMaterial
          color={GLASS}
          roughness={0.1}
          metalness={0.6}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* roof — flat yellow cap on top of the greenhouse */}
      <mesh position={[0, 0.74, 0.05]} castShadow>
        <boxGeometry args={[1.34, 0.08, 1.42]} />
        <meshStandardMaterial color={BODY} roughness={0.45} metalness={0.25} />
      </mesh>

      {/* A/C corner pillars — thin yellow uprights so the glass reads as framed */}
      {[
        [AXLE_X - 0.08, -0.62],
        [-(AXLE_X - 0.08), -0.62],
        [AXLE_X - 0.08, 0.72],
        [-(AXLE_X - 0.08), 0.72],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.49, z]} castShadow>
          <boxGeometry args={[0.07, 0.48, 0.08]} />
          <meshStandardMaterial color={BODY} roughness={0.45} metalness={0.25} />
        </mesh>
      ))}

      {/* chrome bumpers, front and rear */}
      <mesh position={[0, -0.06, -1.54]} castShadow>
        <boxGeometry args={[1.48, 0.13, 0.16]} />
        <meshStandardMaterial color={CHROME} roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0, -0.06, 1.54]} castShadow>
        <boxGeometry args={[1.48, 0.13, 0.16]} />
        <meshStandardMaterial color={CHROME} roughness={0.2} metalness={0.9} />
      </mesh>

      {/* grille — dark slatted block centred on the nose */}
      <mesh position={[0, 0.18, -1.52]}>
        <boxGeometry args={[0.7, 0.18, 0.06]} />
        <meshStandardMaterial color="#2A2D33" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* round headlights flanking the grille */}
      {[AXLE_X - 0.12, -(AXLE_X - 0.12)].map((x) => (
        <mesh key={`hl:${x}`} position={[x, 0.18, -1.52]} rotation={[PI_2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.06, 16]} />
          <meshStandardMaterial
            color="#FFF6D8"
            emissive="#FFE9A8"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* rear taillights */}
      {[AXLE_X - 0.1, -(AXLE_X - 0.1)].map((x) => (
        <mesh key={`tl:${x}`} position={[x, 0.18, 1.52]}>
          <boxGeometry args={[0.26, 0.14, 0.06]} />
          <meshStandardMaterial
            color="#C81E1E"
            emissive="#FF2A2A"
            emissiveIntensity={0.5}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* lit roof "taxi" sign */}
      <mesh position={[0, 0.88, 0.05]} castShadow>
        <boxGeometry args={[0.5, 0.2, 0.62]} />
        <meshStandardMaterial
          color="#FAF7F2"
          emissive="#F5C842"
          emissiveIntensity={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* wheels — four corners */}
      <Wheel position={[AXLE_X, WHEEL_Y, FRONT_Z]} />
      <Wheel position={[-AXLE_X, WHEEL_Y, FRONT_Z]} />
      <Wheel position={[AXLE_X, WHEEL_Y, REAR_Z]} />
      <Wheel position={[-AXLE_X, WHEEL_Y, REAR_Z]} />
    </group>
  );
}
