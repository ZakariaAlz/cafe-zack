"use client";

import { useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useWorld } from "@/lib/world-store";
import { useKeyboard } from "../hooks/useKeyboard";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

const FORWARD_AXIS = new THREE.Vector3(0, 0, -1);
const QUAT = new THREE.Quaternion();
const FORWARD = new THREE.Vector3();

// Lighter, twitchier than the R4 — but well-damped so it doesn't squirrel.
const ACCEL = 9;
const STEER = 5;
const MAX_LINEAR = 8;
const MAX_LINEAR_SPRINT = 12;
const ACCEL_SPRINT_MULT = 1.5;
const ANGVEL_DAMPING = 0.85;
const TARGET_HEIGHT = 1.1;
// Just west of the agent's spawn — a couple of steps from the R4 so the
// player discovers it the moment they step out.
const SPAWN: [number, number, number] = [-3, 0.6, -1];

/**
 * Rideable kick-scooter — the agent's second transport. Same arcade-physics
 * tuning shape as the R4 (Vehicle.tsx) but lighter and better-damped: lower
 * top speed, sharper lateral grip, higher angular damping so a flick of A/D
 * doesn't send it spinning. F mounts/dismounts via DriveController.
 *
 * The spy rider is rendered as a child of the scooter's RigidBody and only
 * becomes visible when `vehicle === "scooter" && mode === "driving"` —
 * Character.tsx hides its on-foot visual in driving mode, so without this
 * sub-component the player saw an invisible scooter wobbling on its own.
 */
function ScooterRider() {
  const { scene, animations } = useModel("agent-spy.glb");
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const modelRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, modelRef);
  const mode = useWorld((s) => s.mode);
  const vehicle = useWorld((s) => s.vehicle);
  const riding = mode === "driving" && vehicle === "scooter";

  useEffect(() => {
    const idle = actions.Idle;
    if (idle && riding) idle.reset().fadeIn(0.2).play();
    return () => {
      idle?.fadeOut(0.2);
    };
  }, [actions, riding]);

  // Stand the rider on the scooter deck, body facing forward (-Z).
  return (
    <group visible={riding}>
      <group ref={modelRef} position={[0, 0.05, 0.05]} scale={0.01}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

export function Scooter({ bodyRef }: { bodyRef: RefObject<RapierRigidBody | null> }) {
  const keys = useKeyboard();
  const { scene } = useModel("scooter.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, TARGET_HEIGHT, -0.4);
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

    // Tight lateral grip + capped forward + lerp toward zero when idle so the
    // scooter doesn't drift after a turn or wander off if you let go.
    const vForward = linvel.x * FORWARD.x + linvel.z * FORWARD.z;
    const latKeep = Math.exp(-delta * 14);
    const latX = (linvel.x - FORWARD.x * vForward) * latKeep;
    const latZ = (linvel.z - FORWARD.z * vForward) * latKeep;
    const fwdDamped = throttle === 0 ? vForward * Math.exp(-delta * 2) : vForward;
    const fwd = Math.max(-MAX_LINEAR, Math.min(speedCap, fwdDamped));
    body.setLinvel({ x: FORWARD.x * fwd + latX, y: linvel.y, z: FORWARD.z * fwd + latZ }, true);

    const angvel = body.angvel();
    const yawDamp = steer !== 0 ? ANGVEL_DAMPING : 0.6;
    body.setAngvel({ x: 0, y: angvel.y * yawDamp, z: 0 }, true);
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={SPAWN}
      colliders={false}
      mass={110}
      linearDamping={1.4}
      angularDamping={1.6}
      enabledRotations={[false, true, false]}
    >
      <CuboidCollider args={[0.45, 0.5, 0.9]} />
      <primitive object={cloned} />
      <ScooterRider />
    </RigidBody>
  );
}
