"use client";

import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import type { RefObject } from "react";
import * as THREE from "three";

// Default seat in the body's local space: behind (+Z, since forward is -Z) and
// above. Rotated by the body's yaw each frame so the view stays at its back.
const SEAT = new THREE.Vector3();
const QUAT = new THREE.Quaternion();
const DESIRED = new THREE.Vector3();
const TARGET = new THREE.Vector3();

/**
 * Chase camera (PR B, generalized in PR E). Follows a RigidBody from
 * behind-and-above, swinging around to stay at its back as it turns.
 *
 * `seat` and `lookLift` are props so the same camera serves the taxi (high,
 * far seat) and the on-foot agent (tighter seat) — Scene swaps both along with
 * the follow target when the drive mode changes. Bodies with locked Y rotation
 * (the agent) keep an identity quaternion, so the seat stays world-fixed
 * behind them; the taxi's yaw rotates the seat to follow its heading.
 *
 * Replaces OrbitControls' ownership of the view — the two can't coexist since
 * both write camera.position every frame. Smoothing is frame-rate independent
 * (exponential lerp) so the follow feels the same at 30 or 144 fps.
 */
export function ChaseCamera({
  targetRef,
  seat = [0, 3.5, 8],
  lookLift = 1.2,
}: {
  targetRef: RefObject<RapierRigidBody | null>;
  seat?: [number, number, number];
  lookLift?: number;
}) {
  const camera = useThree((s) => s.camera);

  useFrame((_, delta) => {
    const body = targetRef.current;
    if (!body) return;

    const t = body.translation();
    const r = body.rotation();
    QUAT.set(r.x, r.y, r.z, r.w);

    // Desired seat = body position + local offset rotated into the body's heading.
    DESIRED.copy(SEAT.set(seat[0], seat[1], seat[2]))
      .applyQuaternion(QUAT)
      .add(TARGET.set(t.x, t.y, t.z));

    // Frame-rate-independent smoothing; higher k = tighter, snappier follow.
    const k = 1 - Math.exp(-delta * 4);
    camera.position.lerp(DESIRED, k);

    camera.lookAt(TARGET.set(t.x, t.y + lookLift, t.z));
  });

  return null;
}
