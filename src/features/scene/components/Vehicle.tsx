"use client";

import { useFrame } from "@react-three/fiber";
import { type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";
import { useKeyboard } from "../hooks/useKeyboard";

const FORWARD_AXIS = new THREE.Vector3(0, 0, -1);
const QUAT = new THREE.Quaternion();
const FORWARD = new THREE.Vector3();

const ACCEL = 8;
const STEER = 5;
const MAX_LINEAR = 12;
const ANGVEL_DAMPING = 0.9;

/**
 * Drivable taxi spike. Yellow box (real Quaternius sedan model comes in PR C)
 * with simple arcade-style physics: forward/back impulse along the body's
 * facing direction, torque on yaw for steering (only when actually moving so
 * the car can't spin in place).
 *
 * Controls: WASD or arrow keys. No enter/exit yet (PR E), no chase camera
 * yet (PR B) — OrbitControls still owns the camera so you can drive the
 * box around and watch it from any angle.
 *
 * Rotation locked to yaw only (no pitch/roll) so the box can't tip over —
 * simulates a low-CG vehicle without needing real wheel physics.
 */
export function Vehicle() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const keys = useKeyboard();

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    const rot = body.rotation();
    QUAT.set(rot.x, rot.y, rot.z, rot.w);
    FORWARD.copy(FORWARD_AXIS).applyQuaternion(QUAT);

    // Throttle (forward / reverse impulse along the body's facing)
    let throttle = 0;
    if (keys.current.forward) throttle += 1;
    if (keys.current.backward) throttle -= 1;

    if (throttle !== 0) {
      const impulse = ACCEL * throttle * delta * 60;
      body.applyImpulse({ x: FORWARD.x * impulse, y: 0, z: FORWARD.z * impulse }, true);
    }

    // Cap linear velocity so the cap doesn't fly off
    const linvel = body.linvel();
    const speed = Math.hypot(linvel.x, linvel.z);
    if (speed > MAX_LINEAR) {
      const scale = MAX_LINEAR / speed;
      body.setLinvel({ x: linvel.x * scale, y: linvel.y, z: linvel.z * scale }, true);
    }

    // Steering torque — only effective when moving (arcade physics, no
    // pivot-in-place); scales with speed so high-speed steering is sharper
    let steer = 0;
    if (keys.current.left) steer += 1;
    if (keys.current.right) steer -= 1;

    if (steer !== 0 && speed > 0.5) {
      const torque = steer * STEER * delta * 60 * Math.min(speed / MAX_LINEAR, 1);
      body.applyTorqueImpulse({ x: 0, y: torque, z: 0 }, true);
    }

    // Damp angular velocity so the car doesn't keep yawing after key release
    const angvel = body.angvel();
    body.setAngvel({ x: 0, y: angvel.y * ANGVEL_DAMPING, z: 0 }, true);
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[0, 1, 0]}
      colliders="cuboid"
      mass={300}
      linearDamping={0.6}
      angularDamping={0.5}
      enabledRotations={[false, true, false]}
    >
      {/* main body — taxi yellow */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.8, 3]} />
        <meshStandardMaterial color="#F5C842" roughness={0.45} metalness={0.25} />
      </mesh>
      {/* lit roof sign for the taxi */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.5, 0.22, 0.7]} />
        <meshStandardMaterial
          color="#FAF7F2"
          emissive="#F5C842"
          emissiveIntensity={0.7}
          roughness={0.3}
        />
      </mesh>
    </RigidBody>
  );
}
