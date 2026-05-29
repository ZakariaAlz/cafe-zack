"use client";

import { useFrame } from "@react-three/fiber";
import { CuboidCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/lib/world-store";
import { useKeyboard } from "../hooks/useKeyboard";
import { RenaultFour } from "./RenaultFour";

const FORWARD_AXIS = new THREE.Vector3(0, 0, -1);
const QUAT = new THREE.Quaternion();
const FORWARD = new THREE.Vector3();

const ACCEL = 8;
const STEER = 5;
const MAX_LINEAR = 12;
const MAX_LINEAR_SPRINT = 18;
const ACCEL_SPRINT_MULT = 1.5;
const ANGVEL_DAMPING = 0.9;

/**
 * Drivable car. The visual is a procedural Renault 4 (<RenaultFour> —
 * Inspecteur Tahar's ride) with simple arcade-style physics: forward/back
 * impulse along the body's facing direction, torque on yaw for steering (only
 * when actually moving so the car can't spin in place).
 *
 * Physics uses an explicit CuboidCollider sized to the chassis only — the
 * model's wheels and bumpers poke past it, but collision stays a tidy box.
 *
 * Controls: WASD or arrow keys. No enter/exit yet (PR E). The ChaseCamera
 * (PR B) tracks the body via the optional `bodyRef` prop — when the scene
 * passes one in, the camera follows the taxi; otherwise the component owns
 * its own ref and drives standalone.
 *
 * Rotation locked to yaw only (no pitch/roll) so the box can't tip over —
 * simulates a low-CG vehicle without needing real wheel physics.
 */
export function Vehicle({ bodyRef: externalRef }: { bodyRef?: RefObject<RapierRigidBody | null> }) {
  const internalRef = useRef<RapierRigidBody>(null);
  const bodyRef = externalRef ?? internalRef;
  const keys = useKeyboard();

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    // Controls are locked while a landmark panel is open, or while the player
    // is out on foot — the car coasts to a stop (cap + damping below still run)
    // instead of driving off-screen or responding to walk input.
    const { mode, activePanel } = useWorld.getState();
    const locked = mode !== "driving" || activePanel !== null;

    const rot = body.rotation();
    QUAT.set(rot.x, rot.y, rot.z, rot.w);
    FORWARD.copy(FORWARD_AXIS).applyQuaternion(QUAT);

    // Throttle (forward / reverse impulse along the body's facing). Holding
    // Shift bumps both acceleration and the forward-speed cap so the R4 can
    // get out of its own way without feeling reckless under default press.
    let throttle = 0;
    if (!locked && keys.current.forward) throttle += 1;
    if (!locked && keys.current.backward) throttle -= 1;

    const sprinting = !locked && keys.current.sprint;
    const accelScale = sprinting && throttle > 0 ? ACCEL_SPRINT_MULT : 1;
    const speedCap = sprinting && throttle > 0 ? MAX_LINEAR_SPRINT : MAX_LINEAR;

    if (throttle !== 0) {
      const impulse = ACCEL * accelScale * throttle * delta * 60;
      body.applyImpulse({ x: FORWARD.x * impulse, y: 0, z: FORWARD.z * impulse }, true);
    }

    const linvel = body.linvel();
    const speed = Math.hypot(linvel.x, linvel.z);

    // Steering — crisp: full authority by ~speed 4 so it's not twitchy at a
    // crawl but turns sharply once rolling.
    let steer = 0;
    if (!locked && keys.current.left) steer += 1;
    if (!locked && keys.current.right) steer -= 1;
    if (steer !== 0 && speed > 0.4) {
      const torque = steer * STEER * delta * 60 * Math.min(speed / 4, 1);
      body.applyTorqueImpulse({ x: 0, y: torque, z: 0 }, true);
    }

    // Tyre grip — the drift fix. A physics box keeps sliding sideways after a
    // turn; split the velocity into forward + lateral and bleed off most of
    // the lateral each frame so the car tracks its heading instead of
    // drifting. Forward speed is capped here too. (Frame-rate independent.)
    const vForward = linvel.x * FORWARD.x + linvel.z * FORWARD.z;
    const latKeep = Math.exp(-delta * 9);
    const latX = (linvel.x - FORWARD.x * vForward) * latKeep;
    const latZ = (linvel.z - FORWARD.z * vForward) * latKeep;
    const fwd = Math.max(-MAX_LINEAR, Math.min(speedCap, vForward));
    body.setLinvel({ x: FORWARD.x * fwd + latX, y: linvel.y, z: FORWARD.z * fwd + latZ }, true);

    // Settle the yaw spin fast once you let go of steering, so the car stops
    // turning crisply instead of coasting around.
    const angvel = body.angvel();
    const yawDamp = steer !== 0 ? ANGVEL_DAMPING : 0.8;
    body.setAngvel({ x: 0, y: angvel.y * yawDamp, z: 0 }, true);
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[0, 1, 0]}
      colliders={false}
      mass={300}
      linearDamping={0.6}
      angularDamping={0.5}
      enabledRotations={[false, true, false]}
    >
      {/* Chassis-only collision box; matches the old auto-cuboid half-extents
          so the arcade tuning above is unchanged. Bottom sits at local y=-0.4,
          where the Renault 4's wheels are sized to meet the road. */}
      <CuboidCollider args={[0.8, 0.4, 1.55]} />
      <RenaultFour />
    </RigidBody>
  );
}
