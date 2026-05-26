"use client";

import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/lib/world-store";
import { useKeyboard } from "../hooks/useKeyboard";

const SPEED = 4;
const SPAWN: [number, number, number] = [4, 1.2, -2];
const DIR = new THREE.Vector3();

// Face-reveal: the suited head warms from near-black to skin as the sunglasses
// come off (the Café Zack payoff).
const HEAD_HIDDEN = new THREE.Color("#1B1B20");
const HEAD_REVEALED = new THREE.Color("#C8A988");

/**
 * The suited agent (PR E) — a velocity-driven capsule the player walks while
 * out of the taxi. Mirrors the Vehicle's dynamic-body approach (snappy linvel
 * instead of impulses) so it collides with the ground and landmark colliders
 * for free; rotations are locked and the *visual* turns to face movement.
 *
 * Movement is world-relative: W drives -Z (away from the chase camera, into
 * the screen), matching the camera's fixed behind-the-back seat on foot.
 * Input is gated to onFoot mode and ignored while a panel is open. While
 * driving the agent is hidden and parked (DriveController teleports it beside
 * the taxi on exit).
 *
 * Visual is the placeholder suited silhouette (real RPM + Mixamo rig: Phase 2).
 */
export function Character({ bodyRef }: { bodyRef: RefObject<RapierRigidBody | null> }) {
  const keys = useKeyboard();
  const visualRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const glassesRef = useRef<THREE.Mesh>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const reveal = useRef(0); // 0 = sunglasses on, 1 = face revealed
  const mode = useWorld((s) => s.mode);

  useFrame((_, delta) => {
    // Face-reveal animation — ease toward the store flag (one-way in practice).
    const target = useWorld.getState().faceRevealed ? 1 : 0;
    reveal.current += (target - reveal.current) * (1 - Math.exp(-delta * 3));
    const r = reveal.current;
    if (glassesRef.current) {
      glassesRef.current.position.y = 0.61 + r * 0.34; // lift up off the face
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

    // Parked (driving) or locked (panel open): kill horizontal drift, let
    // gravity keep it resting on the ground.
    if (!onFoot || panelOpen) {
      body.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
      return;
    }

    let x = 0;
    let z = 0;
    if (keys.current.forward) z -= 1;
    if (keys.current.backward) z += 1;
    if (keys.current.left) x -= 1;
    if (keys.current.right) x += 1;

    DIR.set(x, 0, z);
    if (DIR.lengthSq() > 0) {
      DIR.normalize();
      body.setLinvel({ x: DIR.x * SPEED, y: linvel.y, z: DIR.z * SPEED }, true);
      // Face the heading (body rotations are locked, so rotate the mesh).
      if (visualRef.current) visualRef.current.rotation.y = Math.atan2(DIR.x, DIR.z);
    } else {
      body.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
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
          sits at local y=-0.85, so the visual's feet are modelled to meet it. */}
      <CapsuleCollider args={[0.55, 0.3]} />
      <group ref={visualRef} visible={mode === "onFoot"}>
        {/* legs */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.4, 0.7, 0.28]} />
          <meshStandardMaterial color="#0B0B0D" roughness={0.5} metalness={0.05} />
        </mesh>
        {/* suit torso */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[0.52, 0.62, 0.3]} />
          <meshStandardMaterial color="#0E0E12" roughness={0.45} metalness={0.08} />
        </mesh>
        {/* shoulders */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.62, 0.18, 0.32]} />
          <meshStandardMaterial color="#0E0E12" roughness={0.45} metalness={0.08} />
        </mesh>
        {/* head — warms from near-black to skin on the reveal */}
        <mesh ref={headRef} position={[0, 0.6, 0]} castShadow>
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial color="#1B1B20" roughness={0.5} />
        </mesh>
        {/* eyes — hidden (scale 0) until the reveal animates them in */}
        <group ref={eyesRef} scale={0}>
          {[-0.06, 0.06].map((ex) => (
            <group key={ex} position={[ex, 0.625, 0.145]}>
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
        <mesh ref={glassesRef} position={[0, 0.61, 0.14]}>
          <boxGeometry args={[0.26, 0.07, 0.05]} />
          <meshStandardMaterial color="#000000" roughness={0.2} metalness={0.5} />
        </mesh>
      </group>
    </RigidBody>
  );
}
