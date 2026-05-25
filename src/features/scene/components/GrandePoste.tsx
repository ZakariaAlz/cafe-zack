"use client";

import { useFrame } from "@react-three/fiber";
import { CuboidCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useMemo, useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/lib/world-store";

// Algiers stone palette (scene colors are independent of the 2D design tokens).
const STONE = "#E4D5B7";
const STONE_LIGHT = "#EFE3CA";
const OCHRE = "#C2410C";
const RECESS = "#241811"; // dark interior seen through the arches

const POSITION: [number, number, number] = [0, 0, -21];
const TRIGGER_RADIUS = 9;

/**
 * La Grande Poste d'Alger — the About anchor. Stylized Neo-Moorish facade
 * built procedurally: an extruded front wall with three real horseshoe-arch
 * openings, a clock, flanking towers and ochre domes.
 *
 * Procedural by necessity (no Blender/asset in this environment) but composed
 * like the real building so it reads as designed, not placeholder. A Meshy/
 * Blender .glb can replace the <group> wholesale later via useGLTF — the
 * collider and proximity trigger stay.
 *
 * Shadows are off: at z=-21 it sits outside the directional light's shadow
 * camera (±15), so casting would cost fill for nothing (same call the
 * AlgiersSilhouette makes).
 */
export function GrandePoste({ playerRef }: { playerRef: RefObject<RapierRigidBody | null> }) {
  const inside = useRef(false);

  // Proximity trigger — flip world.nearby only on boundary crossings (not
  // every frame) so we don't thrash the store. Tracks whichever body the
  // player currently controls (taxi or on-foot agent). getState() = no
  // re-render here.
  useFrame(() => {
    const body = playerRef.current;
    if (!body) return;
    const t = body.translation();
    const dx = t.x - POSITION[0];
    const dz = t.z - POSITION[2];
    const near = dx * dx + dz * dz < TRIGGER_RADIUS * TRIGGER_RADIUS;
    if (near !== inside.current) {
      inside.current = near;
      useWorld.getState().setNearby(near ? "grande-poste" : null);
    }
  });

  // Front wall as an extruded shape with three arched holes.
  const facade = useMemo(() => buildFacade(9, 5.4, 0.7, 3), []);

  return (
    <group position={POSITION}>
      {/* Colliders so the car bumps the building instead of clipping: the main
          hall, plus a low wall over the plinth/steps so it stops at the base
          and "pulls up" to the landmark rather than climbing the facade. */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[6, 4, 3]} position={[0, 4, -2]} />
        <CuboidCollider args={[6.5, 0.45, 4.6]} position={[0, 0.45, -1]} />
      </RigidBody>

      {/* Plinth + steps you "walk up" (plan: approach the steps). */}
      <mesh position={[0, 0.3, -1]}>
        <boxGeometry args={[13, 0.6, 9]} />
        <meshStandardMaterial color={STONE} roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.15 + i * 0.18, 2.6 + i * 0.6]}>
          <boxGeometry args={[7 - i * 0.6, 0.18, 0.6]} />
          <meshStandardMaterial color={STONE_LIGHT} roughness={0.9} />
        </mesh>
      ))}

      {/* Main hall, set back; its dark recess shows through the arches. */}
      <mesh position={[0, 3.3, -2]}>
        <boxGeometry args={[10, 6, 6]} />
        <meshStandardMaterial color={STONE} roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.3, 1.4]}>
        <boxGeometry args={[8.6, 5.2, 0.4]} />
        <meshStandardMaterial color={RECESS} roughness={1} />
      </mesh>

      {/* Arched portico front. */}
      <mesh geometry={facade} position={[0, 0.6, 1.8]}>
        <meshStandardMaterial color={STONE_LIGHT} roughness={0.8} />
      </mesh>

      {/* Cornice band + attic. */}
      <mesh position={[0, 6.55, -2]}>
        <boxGeometry args={[11, 0.5, 7]} />
        <meshStandardMaterial color={OCHRE} roughness={0.7} />
      </mesh>
      <mesh position={[0, 7.4, -2]}>
        <boxGeometry args={[9, 1.3, 6]} />
        <meshStandardMaterial color={STONE} roughness={0.85} />
      </mesh>

      {/* Clock on the attic. */}
      <group position={[0, 7.55, 1.05]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.72, 0.72, 0.2, 32]} />
          <meshStandardMaterial color={STONE_LIGHT} roughness={0.6} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.72, 0.08, 12, 32]} />
          <meshStandardMaterial color={OCHRE} roughness={0.6} />
        </mesh>
        {/* hands */}
        <mesh position={[0, 0.11, 0.18]}>
          <boxGeometry args={[0.05, 0.02, 0.42]} />
          <meshStandardMaterial color={RECESS} />
        </mesh>
        <mesh position={[0.16, 0.11, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.05, 0.02, 0.32]} />
          <meshStandardMaterial color={RECESS} />
        </mesh>
      </group>

      {/* Flanking towers + ochre domes. */}
      {[-5.6, 5.6].map((x) => (
        <group key={x} position={[x, 0, -2]}>
          <mesh position={[0, 4.6, 0]}>
            <boxGeometry args={[2.4, 9.2, 2.4]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
          </mesh>
          <mesh position={[0, 9.3, 0]}>
            <boxGeometry args={[2.7, 0.35, 2.7]} />
            <meshStandardMaterial color={OCHRE} roughness={0.7} />
          </mesh>
          <mesh position={[0, 9.5, 0]}>
            <sphereGeometry args={[1.35, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={OCHRE} roughness={0.55} metalness={0.1} />
          </mesh>
          <mesh position={[0, 10.95, 0]}>
            <coneGeometry args={[0.16, 0.7, 12]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Extruded front wall (centered on x, rising from y=0) pierced by `openings`
 * arched holes — a flat rectangle Shape with semicircle-topped Path holes.
 */
function buildFacade(
  width: number,
  height: number,
  depth: number,
  openings: number,
): THREE.ExtrudeGeometry {
  const hw = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, height);
  shape.lineTo(hw, height);
  shape.lineTo(hw, 0);
  shape.lineTo(-hw, 0);

  const gap = width / openings;
  const r = gap * 0.28; // opening half-width
  const springLine = height * 0.55; // where the arch starts curving
  for (let i = 0; i < openings; i++) {
    const cx = -hw + gap * (i + 0.5);
    const hole = new THREE.Path();
    hole.moveTo(cx - r, 0.25);
    hole.lineTo(cx - r, springLine);
    hole.absarc(cx, springLine, r, Math.PI, 0, true); // semicircle top
    hole.lineTo(cx + r, 0.25);
    hole.lineTo(cx - r, 0.25);
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return geo;
}
