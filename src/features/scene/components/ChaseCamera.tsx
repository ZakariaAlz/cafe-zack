"use client";

import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import type { RefObject } from "react";
import * as THREE from "three";

// Camera seat in the car's local space: behind (+Z, since forward is -Z) and
// above. Rotated by the body's yaw each frame so the view stays at the taxi's back.
const SEAT = new THREE.Vector3(0, 3.5, 8);
// Look a little above the body center so the car sits low in frame, road ahead visible.
const LOOK_LIFT = 1.2;

const QUAT = new THREE.Quaternion();
const DESIRED = new THREE.Vector3();
const TARGET = new THREE.Vector3();

/**
 * Chase camera for the taxi (PR B). Follows the vehicle's RigidBody from
 * behind-and-above, swinging around to stay at its back as it turns.
 *
 * Replaces OrbitControls' ownership of the view while driving — the two can't
 * coexist since both write camera.position every frame. Smoothing is
 * frame-rate independent (exponential lerp) so the follow feels the same at
 * 30 or 144 fps. Yaw-only because the body's rotations are locked to Y.
 */
export function ChaseCamera({ targetRef }: { targetRef: RefObject<RapierRigidBody | null> }) {
  const camera = useThree((s) => s.camera);

  useFrame((_, delta) => {
    const body = targetRef.current;
    if (!body) return;

    const t = body.translation();
    const r = body.rotation();
    QUAT.set(r.x, r.y, r.z, r.w);

    // Desired seat = body position + local offset rotated into the car's heading.
    DESIRED.copy(SEAT)
      .applyQuaternion(QUAT)
      .add(TARGET.set(t.x, t.y, t.z));

    // Frame-rate-independent smoothing; higher k = tighter, snappier follow.
    const k = 1 - Math.exp(-delta * 4);
    camera.position.lerp(DESIRED, k);

    camera.lookAt(TARGET.set(t.x, t.y + LOOK_LIFT, t.z));
  });

  return null;
}
