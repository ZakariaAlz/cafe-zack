"use client";

import { useFrame } from "@react-three/fiber";
import { Physics, type RapierRigidBody } from "@react-three/rapier";
import { Suspense, useEffect, useRef } from "react";
import { useWorld } from "@/lib/world-store";
import { CafeFurniture } from "./CafeFurniture";
import { CafeRoom } from "./CafeRoom";
import { Character } from "./Character";
import { ChaseCamera } from "./ChaseCamera";
import { OrderPad } from "./OrderPad";

/**
 * The Café Zack walk-in interior — the `venue === "cafe-interior"` subtree that
 * replaces the street world while you're inside. Self-contained: its own
 * Physics, warm lighting, the room shell + furniture, the agent (spawned at the
 * door), a tight chase camera, and the diegetic order-pad contact form.
 *
 * A `useFrame` proximity check publishes `nearOrderPad` (at the counter) and
 * `nearExit` (at the door) so PanelsRoot can show the right E-prompt and route
 * the keypress. Sets `window.__cafeReady` once mounted so e2e can gate on the
 * interior being live before pressing keys (mirrors `__driveReady`).
 */

// Agent spawns just inside the door (+Z front wall) facing the counter (−Z).
const SPAWN: [number, number, number] = [0, 1.1, 2.2];
// Counter / order-pad spot and the door spot, in room-local XZ.
const PAD_XZ: [number, number] = [0.6, -2.1];
const DOOR_XZ: [number, number] = [0, 2.5];
const PAD_RADIUS = 1.7;
const EXIT_RADIUS = 1.4;

export function CafeInterior() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const nearPad = useRef(false);
  const nearDoor = useRef(false);

  useEffect(() => {
    // Signal interior readiness so e2e can gate on the interior being live.
    const w = window as unknown as { __cafeReady?: boolean };
    w.__cafeReady = true;
    return () => {
      w.__cafeReady = false;
    };
  }, []);

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) return;
    const p = body.translation();
    const w = useWorld.getState();

    const dpx = p.x - PAD_XZ[0];
    const dpz = p.z - PAD_XZ[1];
    const atPad = dpx * dpx + dpz * dpz < PAD_RADIUS * PAD_RADIUS;
    if (atPad !== nearPad.current) {
      nearPad.current = atPad;
      w.setNearOrderPad(atPad);
    }

    const ddx = p.x - DOOR_XZ[0];
    const ddz = p.z - DOOR_XZ[1];
    const atDoor = ddx * ddx + ddz * ddz < EXIT_RADIUS * EXIT_RADIUS;
    if (atDoor !== nearDoor.current) {
      nearDoor.current = atDoor;
      w.setNearExit(atDoor);
    }
  });

  return (
    <>
      {/* warm interior lighting */}
      <ambientLight intensity={0.45} color="#FFE3BE" />
      <hemisphereLight args={["#FFE3BE", "#3A2A1E", 0.5]} />
      <pointLight
        position={[0, 2.9, 0]}
        color="#FFD79A"
        intensity={18}
        distance={14}
        decay={2}
        castShadow
      />
      <pointLight position={[0, 1.8, -2.2]} color="#FFC98A" intensity={10} distance={8} decay={2} />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <CafeRoom />
          <CafeFurniture />
          <OrderPad />
          <Character bodyRef={bodyRef} spawn={SPAWN} />
        </Physics>
      </Suspense>

      {/* tight, warm chase cam; world-fixed seat so the visitor can drag-orbit */}
      <ChaseCamera targetRef={bodyRef} seat={[0, 2.1, 4]} lookLift={1} followBodyYaw={false} />
    </>
  );
}
