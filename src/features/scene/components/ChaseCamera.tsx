"use client";

import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { type RefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/lib/world-store";

const SEAT = new THREE.Vector3();
const BODY_QUAT = new THREE.Quaternion();
const ORBIT_QUAT = new THREE.Quaternion();
const ORBIT_EULER = new THREE.Euler(0, 0, 0, "YXZ");
const DESIRED = new THREE.Vector3();
const TARGET = new THREE.Vector3();

// Pitch limits keep the camera from flipping under the ground or staring
// straight down at the player's head.
const PITCH_MIN = -1.2;
const PITCH_MAX = 0.25;
// Zoom range — multiplier applied to the seat magnitude. 0.4 = very close
// (good for inspecting details), 2.5 = wide overview shot of the block.
const DIST_MIN = 0.4;
const DIST_MAX = 2.5;
const MOUSE_SENS = 0.0045;
const WHEEL_SENS = 0.0012;

/**
 * Chase camera with drag-to-orbit + wheel-to-zoom. Follows a RigidBody from a
 * seat behind it; the user can left-click + drag on the canvas to rotate the
 * camera around the player (yaw + clamped pitch), and scroll to zoom. Double-
 * click resets to the default behind-the-player view.
 *
 * `followBodyYaw` controls whether the body's heading rotates the seat. The
 * driving cam wants this on (the camera swings around as the car turns); on
 * foot, we leave it off so the user can drag-orbit freely without the body
 * fighting them. The user's mouse offset stacks on top of whichever base is
 * active.
 *
 * `seat` and `lookLift` are props so the same camera serves the taxi (high,
 * far seat) and the on-foot agent (tighter seat). Mouse listeners attach to
 * the WebGL canvas only, so left-click on HUD overlays still works. Drag +
 * wheel are gated on `activePanel === null` so dialogs don't fight the cam.
 */
export function ChaseCamera({
  targetRef,
  seat = [0, 3.5, 8],
  lookLift = 1.2,
  followBodyYaw = false,
}: {
  targetRef: RefObject<RapierRigidBody | null>;
  seat?: [number, number, number];
  lookLift?: number;
  followBodyYaw?: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const yawOffset = useRef(0);
  const pitchOffset = useRef(0);
  const distance = useRef(1);
  const dragging = useRef(false);

  useEffect(() => {
    const el = gl.domElement;
    const panelOpen = () => useWorld.getState().activePanel !== null;

    const onDown = (e: MouseEvent) => {
      if (panelOpen() || e.button !== 0) return;
      e.preventDefault();
      dragging.current = true;
      el.style.cursor = "grabbing";
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      el.style.cursor = "grab";
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      yawOffset.current -= e.movementX * MOUSE_SENS;
      pitchOffset.current += e.movementY * MOUSE_SENS;
      if (pitchOffset.current < PITCH_MIN) pitchOffset.current = PITCH_MIN;
      if (pitchOffset.current > PITCH_MAX) pitchOffset.current = PITCH_MAX;
    };
    const onWheel = (e: WheelEvent) => {
      if (panelOpen()) return;
      e.preventDefault();
      const next = distance.current + e.deltaY * WHEEL_SENS;
      distance.current = Math.min(DIST_MAX, Math.max(DIST_MIN, next));
    };
    const onDouble = (e: MouseEvent) => {
      if (panelOpen()) return;
      e.preventDefault();
      yawOffset.current = 0;
      pitchOffset.current = 0;
      distance.current = 1;
    };
    const onLeave = () => {
      if (dragging.current) {
        dragging.current = false;
        el.style.cursor = "grab";
      }
    };

    el.style.cursor = "grab";
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("dblclick", onDouble);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.style.cursor = "";
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("dblclick", onDouble);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const body = targetRef.current;
    if (!body) return;
    const t = body.translation();

    SEAT.set(seat[0] * distance.current, seat[1] * distance.current, seat[2] * distance.current);
    if (followBodyYaw) {
      const r = body.rotation();
      BODY_QUAT.set(r.x, r.y, r.z, r.w);
      SEAT.applyQuaternion(BODY_QUAT);
    }
    ORBIT_EULER.set(pitchOffset.current, yawOffset.current, 0);
    ORBIT_QUAT.setFromEuler(ORBIT_EULER);
    SEAT.applyQuaternion(ORBIT_QUAT);
    DESIRED.copy(SEAT).add(TARGET.set(t.x, t.y, t.z));

    const k = 1 - Math.exp(-delta * 4);
    camera.position.lerp(DESIRED, k);
    camera.lookAt(TARGET.set(t.x, t.y + lookLift, t.z));
  });

  return null;
}
