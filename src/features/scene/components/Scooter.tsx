"use client";

import { useFrame } from "@react-three/fiber";
import { CuboidCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useWorld } from "@/lib/world-store";
import { useKeyboard } from "../hooks/useKeyboard";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

const FORWARD_AXIS = new THREE.Vector3(0, 0, -1);
const QUAT = new THREE.Quaternion();
const FORWARD = new THREE.Vector3();

// Lighter, twitchier than the R4: faster off the line, lower top end, and
// the body banks more easily because there's no roof rack drag.
const ACCEL = 10;
const STEER = 6;
const MAX_LINEAR = 9;
const MAX_LINEAR_SPRINT = 14;
const ACCEL_SPRINT_MULT = 1.6;
const ANGVEL_DAMPING = 0.88;
const TARGET_HEIGHT = 1.1;
// Just west of the agent's spawn — a couple of steps from the R4 so the
// player discovers it the moment they step out. Same Y as the R4's
// resting height so it sits flat on the road.
const SPAWN: [number, number, number] = [-3, 0.6, -1];

/**
 * Rideable Vespa-style scooter — the agent's second transport option. Same
 * arcade-physics tuning as the R4 (Vehicle.tsx) but lighter: half the mass,
 * a touch more accel, a lower top speed, and a slightly higher angular damping
 * so steering settles fast. Spawned at a fixed spot the agent can walk to;
 * F-mount happens in DriveController when nearScooter is true.
 *
 * Controls only respond when `mode === "driving" && vehicle === "scooter"` so
 * the R4 and scooter can coexist without fighting over WASD.
 */
export function Scooter({ bodyRef }: { bodyRef: RefObject<RapierRigidBody | null> }) {
  const keys = useKeyboard();
  const { scene } = useModel("scooter.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, TARGET_HEIGHT, -0.35);
    return c;
  }, [scene]);

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    const { mode, activePanel, vehicle } = useWorld.getState();
    const locked = mode !== "driving" || vehicle !== "scooter" || activePanel !== null;

    const rot = body.rotation();
    QUAT.set(rot.x, rot.y, rot.z, rot.w);
    FORWARD.copy(FORWARD_AXIS).applyQuaternion(QUAT);

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

    let steer = 0;
    if (!locked && keys.current.left) steer += 1;
    if (!locked && keys.current.right) steer -= 1;
    if (steer !== 0 && speed > 0.4) {
      const torque = steer * STEER * delta * 60 * Math.min(speed / 4, 1);
      body.applyTorqueImpulse({ x: 0, y: torque, z: 0 }, true);
    }

    const vForward = linvel.x * FORWARD.x + linvel.z * FORWARD.z;
    const latKeep = Math.exp(-delta * 10);
    const latX = (linvel.x - FORWARD.x * vForward) * latKeep;
    const latZ = (linvel.z - FORWARD.z * vForward) * latKeep;
    const fwd = Math.max(-MAX_LINEAR, Math.min(speedCap, vForward));
    body.setLinvel({ x: FORWARD.x * fwd + latX, y: linvel.y, z: FORWARD.z * fwd + latZ }, true);

    const angvel = body.angvel();
    const yawDamp = steer !== 0 ? ANGVEL_DAMPING : 0.7;
    body.setAngvel({ x: 0, y: angvel.y * yawDamp, z: 0 }, true);
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={SPAWN}
      colliders={false}
      mass={120}
      linearDamping={0.55}
      angularDamping={0.5}
      enabledRotations={[false, true, false]}
    >
      <CuboidCollider args={[0.35, 0.5, 0.85]} />
      <primitive object={cloned} />
    </RigidBody>
  );
}
