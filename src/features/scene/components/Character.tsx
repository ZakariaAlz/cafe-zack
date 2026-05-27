"use client";

import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/lib/world-store";
import { useKeyboard } from "../hooks/useKeyboard";

const SPEED = 4.8;
const SPAWN: [number, number, number] = [4, 1.2, -2];
const DIR = new THREE.Vector3();

// Walk/jog cycle: stride frequency + max limb swing (radians).
const STRIDE = 11;
const SWING = 0.62;

// Face-reveal: the suited head warms from near-black to skin as the sunglasses
// come off (the Café Zack payoff).
const HEAD_HIDDEN = new THREE.Color("#1B1B20");
const HEAD_REVEALED = new THREE.Color("#C8A988");

// Charcoal suit — lifted out of near-black so the agent reads as a figure in
// dusk light instead of a flat shadow (a touch of sheen via metalness).
const SUIT = "#2B2B34";
const SUIT_DARK = "#202028";

/**
 * The suited agent — an articulated low-poly figure (torso, two legs, two
 * arms, head) with a movement-driven walk cycle: legs and arms swing in
 * opposition and the body bobs while walking, easing to a rest pose when
 * still. Velocity-driven capsule body (mirrors the Vehicle) so it collides
 * for free; the visual rotates to face the heading.
 *
 * Carries the Café Zack face-reveal (sunglasses off + eyes + warm head). A
 * real RPM + Mixamo rig can replace the visual group later (useGLTF) — the
 * body, controller, and reveal hooks stay.
 */
export function Character({ bodyRef }: { bodyRef: RefObject<RapierRigidBody | null> }) {
  const keys = useKeyboard();
  const visualRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const glassesRef = useRef<THREE.Mesh>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const lLegRef = useRef<THREE.Group>(null);
  const rLegRef = useRef<THREE.Group>(null);
  const lArmRef = useRef<THREE.Group>(null);
  const rArmRef = useRef<THREE.Group>(null);
  const reveal = useRef(0); // 0 = sunglasses on, 1 = face revealed
  const phase = useRef(0); // walk-cycle phase
  const swing = useRef(0); // eased 0→1 walk intensity
  const mode = useWorld((s) => s.mode);

  useFrame((_, delta) => {
    // Face-reveal animation — ease toward the store flag (one-way in practice).
    const target = useWorld.getState().faceRevealed ? 1 : 0;
    reveal.current += (target - reveal.current) * (1 - Math.exp(-delta * 3));
    const r = reveal.current;
    if (glassesRef.current) {
      glassesRef.current.position.y = 0.71 + r * 0.34;
      glassesRef.current.scale.setScalar(Math.max(0.0001, 1 - r));
    }
    if (eyesRef.current) eyesRef.current.scale.setScalar(r);
    if (headRef.current) {
      (headRef.current.material as THREE.MeshStandardMaterial).color.lerpColors(
        HEAD_HIDDEN,
        HEAD_REVEALED,
        r,
      );
    }

    const body = bodyRef.current;
    if (!body) return;

    const { mode: m, activePanel } = useWorld.getState();
    const onFoot = m === "onFoot";
    const panelOpen = activePanel !== null;
    const linvel = body.linvel();

    let moving = false;
    if (!onFoot || panelOpen) {
      body.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
    } else {
      let x = 0;
      let z = 0;
      if (keys.current.forward) z -= 1;
      if (keys.current.backward) z += 1;
      if (keys.current.left) x -= 1;
      if (keys.current.right) x += 1;
      DIR.set(x, 0, z);
      if (DIR.lengthSq() > 0) {
        moving = true;
        DIR.normalize();
        body.setLinvel({ x: DIR.x * SPEED, y: linvel.y, z: DIR.z * SPEED }, true);
        if (visualRef.current) visualRef.current.rotation.y = Math.atan2(DIR.x, DIR.z);
      } else {
        body.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
      }
    }

    // Walk cycle: advance phase while moving, ease the swing in/out, drive limbs.
    swing.current += ((moving ? 1 : 0) - swing.current) * (1 - Math.exp(-delta * 10));
    if (moving) phase.current += delta * STRIDE;
    const s = Math.sin(phase.current) * SWING * swing.current;
    if (lLegRef.current) lLegRef.current.rotation.x = s;
    if (rLegRef.current) rLegRef.current.rotation.x = -s;
    if (lArmRef.current) lArmRef.current.rotation.x = -s;
    if (rArmRef.current) rArmRef.current.rotation.x = s;
    if (visualRef.current) {
      visualRef.current.position.y = Math.abs(Math.sin(phase.current)) * 0.05 * swing.current;
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={SPAWN}
      colliders={false}
      mass={70}
      linearDamping={0.9}
      enabledRotations={[false, false, false]}
    >
      {/* Capsule ~1.7 tall: total = 2*halfHeight + 2*radius = 1.1 + 0.6. Bottom
          sits at local y=-0.85, so the figure's feet are modelled to meet it. */}
      <CapsuleCollider args={[0.55, 0.3]} />
      <group ref={visualRef} visible={mode === "onFoot"}>
        {/* legs — pivot at the hips, swing fore/aft */}
        {(
          [
            ["l", -0.12, lLegRef],
            ["r", 0.12, rLegRef],
          ] as const
        ).map(([id, x, ref]) => (
          <group key={id} ref={ref} position={[x, -0.15, 0]}>
            <mesh position={[0, -0.35, 0]} castShadow>
              <boxGeometry args={[0.17, 0.7, 0.22]} />
              <meshStandardMaterial color={SUIT_DARK} roughness={0.5} metalness={0.05} />
            </mesh>
            {/* shoe */}
            <mesh position={[0, -0.68, 0.04]} castShadow>
              <boxGeometry args={[0.18, 0.1, 0.3]} />
              <meshStandardMaterial color="#070708" roughness={0.4} metalness={0.1} />
            </mesh>
          </group>
        ))}

        {/* pelvis + jacket */}
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[0.44, 0.34, 0.28]} />
          <meshStandardMaterial color={SUIT} roughness={0.45} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.3]} />
          <meshStandardMaterial color={SUIT} roughness={0.45} metalness={0.08} />
        </mesh>
        {/* shoulders */}
        <mesh position={[0, 0.56, 0]} castShadow>
          <boxGeometry args={[0.66, 0.16, 0.32]} />
          <meshStandardMaterial color={SUIT} roughness={0.45} metalness={0.08} />
        </mesh>

        {/* arms — pivot at the shoulders, swing opposite the legs */}
        {(
          [
            ["l", -0.35, lArmRef],
            ["r", 0.35, rArmRef],
          ] as const
        ).map(([id, x, ref]) => (
          <group key={id} ref={ref} position={[x, 0.54, 0]}>
            <mesh position={[0, -0.26, 0]} castShadow>
              <boxGeometry args={[0.13, 0.54, 0.15]} />
              <meshStandardMaterial color={SUIT} roughness={0.45} metalness={0.08} />
            </mesh>
          </group>
        ))}

        {/* head — warms from near-black to skin on the reveal */}
        <mesh ref={headRef} position={[0, 0.74, 0]} castShadow>
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial color="#1B1B20" roughness={0.5} />
        </mesh>
        {/* eyes — hidden (scale 0) until the reveal animates them in */}
        <group ref={eyesRef} scale={0}>
          {[-0.06, 0.06].map((ex) => (
            <group key={ex} position={[ex, 0.76, 0.145]}>
              <mesh>
                <sphereGeometry args={[0.032, 12, 12]} />
                <meshStandardMaterial color="#F4ECE0" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0, 0.022]}>
                <sphereGeometry args={[0.016, 10, 10]} />
                <meshStandardMaterial color="#1A140E" roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
        {/* sunglasses bar — lifts off + shrinks on the reveal (no green tint) */}
        <mesh ref={glassesRef} position={[0, 0.71, 0.14]}>
          <boxGeometry args={[0.26, 0.07, 0.05]} />
          <meshStandardMaterial color="#000000" roughness={0.2} metalness={0.5} />
        </mesh>
      </group>
    </RigidBody>
  );
}
