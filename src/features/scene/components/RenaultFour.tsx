"use client";

import type { ThreeElements } from "@react-three/fiber";

/**
 * Inspecteur Tahar's Renault 4 (Phase 2) — the suited agent's ride, replacing
 * the generic yellow cab. The 4L is tall, narrow and boxy with a long flat
 * roof, an airy greenhouse on slim pillars, round headlights in a flat grille,
 * thin metal bumpers, skinny steel wheels and a near-vertical rear hatch — all
 * easy, recognisable procedural shapes. A roof rack lands the dusty, hard-worn
 * Algerian-4L character.
 *
 * Visual only; <Vehicle> owns the RigidBody + explicit CuboidCollider. Local
 * frame: origin at chassis centre, forward -Z, y = -0.4 is the collider floor
 * (where the wheels meet the road). A licensed .glb can replace this wholesale
 * via useGLTF later — the collider/physics stay.
 */

const BODY = "#8FA6B1"; // faded R4 pale blue
const GLASS = "#10171E";
const TIRE = "#1A1B1F";
const HUB = "#B6BABF";
const BUMPER = "#9AA0A6"; // dull metal, not chrome
const GRILLE = "#34373C";
const RACK = "#34373C";

const WHEEL_RADIUS = 0.34;
const WHEEL_WIDTH = 0.2;
const WHEEL_Y = -0.06; // bottom = -0.40, the collider floor
const AXLE_X = 0.7;
const FRONT_Z = -1.05;
const REAR_Z = 1.15;

const PI_2 = Math.PI / 2;

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* skinny tall tyre */}
      <mesh rotation={[0, 0, PI_2]} castShadow>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 18]} />
        <meshStandardMaterial color={TIRE} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* plain steel hubcap (R4s wore bare steel wheels) */}
      <mesh
        position={[Math.sign(position[0]) * (WHEEL_WIDTH / 2 + 0.01), 0, 0]}
        rotation={[0, 0, PI_2]}
      >
        <cylinderGeometry args={[WHEEL_RADIUS * 0.4, WHEEL_RADIUS * 0.4, 0.04, 14]} />
        <meshStandardMaterial color={HUB} roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
}

export function RenaultFour(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      {/* lower hull — narrow body */}
      <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.5, 3.1]} />
        <meshStandardMaterial color={BODY} roughness={0.6} metalness={0.15} />
      </mesh>

      {/* flat hood (front, -Z) */}
      <mesh position={[0, 0.27, -1.0]} castShadow>
        <boxGeometry args={[1.32, 0.14, 1.05]} />
        <meshStandardMaterial color={BODY} roughness={0.6} metalness={0.15} />
      </mesh>

      {/* tall, airy greenhouse on slim pillars */}
      <mesh position={[0, 0.52, 0.12]}>
        <boxGeometry args={[1.26, 0.54, 1.95]} />
        <meshStandardMaterial
          color={GLASS}
          roughness={0.12}
          metalness={0.6}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* long flat roof */}
      <mesh position={[0, 0.83, 0.12]} castShadow>
        <boxGeometry args={[1.32, 0.07, 2.0]} />
        <meshStandardMaterial color={BODY} roughness={0.6} metalness={0.15} />
      </mesh>

      {/* slim pillars (A/B/C) so the glass reads as framed */}
      {[
        [AXLE_X - 0.1, -0.78],
        [-(AXLE_X - 0.1), -0.78],
        [AXLE_X - 0.1, 0.12],
        [-(AXLE_X - 0.1), 0.12],
        [AXLE_X - 0.1, 1.02],
        [-(AXLE_X - 0.1), 1.02],
      ].map(([x, z]) => (
        <mesh key={`pillar${x}:${z}`} position={[x, 0.52, z]} castShadow>
          <boxGeometry args={[0.06, 0.54, 0.07]} />
          <meshStandardMaterial color={BODY} roughness={0.6} metalness={0.15} />
        </mesh>
      ))}

      {/* near-vertical rear hatch (4L is a hatch/wagon, no boot) */}
      <mesh position={[0, 0.16, 1.5]} castShadow>
        <boxGeometry args={[1.34, 0.36, 0.12]} />
        <meshStandardMaterial color={BODY} roughness={0.6} metalness={0.15} />
      </mesh>

      {/* flat front grille + round headlights */}
      <mesh position={[0, 0.16, -1.56]}>
        <boxGeometry args={[1.18, 0.32, 0.08]} />
        <meshStandardMaterial color={GRILLE} roughness={0.5} metalness={0.5} />
      </mesh>
      {[AXLE_X - 0.2, -(AXLE_X - 0.2)].map((x) => (
        <mesh key={`hl${x}`} position={[x, 0.18, -1.57]} rotation={[PI_2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.06, 16]} />
          <meshStandardMaterial
            color="#FFF6D8"
            emissive="#FFE9A8"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* thin metal bumpers */}
      <mesh position={[0, -0.08, -1.58]} castShadow>
        <boxGeometry args={[1.4, 0.1, 0.14]} />
        <meshStandardMaterial color={BUMPER} roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[0, -0.08, 1.58]} castShadow>
        <boxGeometry args={[1.4, 0.1, 0.14]} />
        <meshStandardMaterial color={BUMPER} roughness={0.35} metalness={0.7} />
      </mesh>

      {/* tall narrow taillights */}
      {[AXLE_X - 0.12, -(AXLE_X - 0.12)].map((x) => (
        <mesh key={`tl${x}`} position={[x, 0.2, 1.55]}>
          <boxGeometry args={[0.18, 0.22, 0.06]} />
          <meshStandardMaterial
            color="#C81E1E"
            emissive="#FF2A2A"
            emissiveIntensity={0.5}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* roof rack — the working-4L signature */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={`rail${x}`} position={[x, 0.91, 0.12]}>
          <boxGeometry args={[0.05, 0.05, 1.7]} />
          <meshStandardMaterial color={RACK} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      {[-0.5, 0.7].map((z) => (
        <mesh key={`cross${z}`} position={[0, 0.91, z]}>
          <boxGeometry args={[1.0, 0.05, 0.05]} />
          <meshStandardMaterial color={RACK} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}

      {/* wheels — tall + skinny, plain steel */}
      <Wheel position={[AXLE_X, WHEEL_Y, FRONT_Z]} />
      <Wheel position={[-AXLE_X, WHEEL_Y, FRONT_Z]} />
      <Wheel position={[AXLE_X, WHEEL_Y, REAR_Z]} />
      <Wheel position={[-AXLE_X, WHEEL_Y, REAR_Z]} />
    </group>
  );
}
