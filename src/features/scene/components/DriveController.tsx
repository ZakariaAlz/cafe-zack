"use client";

import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/lib/world-store";
import { useInteractKey } from "../hooks/useInteractKey";
import { easeOutCubic, exitSpot, faceYaw, summonTarget, withinRadius } from "../lib/driving";

// How close the agent must be to the taxi to climb in.
const ENTER_RADIUS = 3;
// Where the agent is dropped on exit (beside the driver's door, +X of taxi).
const EXIT_OFFSET = 2.2;
// Seconds for a called taxi to glide to the agent.
const SUMMON_TIME = 1.3;
// Where the summoned taxi parks relative to the agent (beside the door).
const SUMMON_OFFSET = 2.2;

const START = new THREE.Vector3();
const TARGET = new THREE.Vector3();
const POS = new THREE.Vector3();

/**
 * Owns the taxi enter/exit + call flow (PR: taxi-call). Renders nothing — it
 * holds both bodies' refs to gate interactions and to feed the HUD:
 *
 *  - F, driving → onFoot: teleport the agent beside the taxi.
 *  - F, onFoot near taxi → driving: climb in.
 *  - C, onFoot away from taxi: summon it — the taxi glides to the agent over
 *    SUMMON_TIME (eased, nose-first), then parks ready for F.
 *
 * F/C are distinct from E (open landmark panel, PanelsRoot) so no press ever
 * triggers two actions. The frame loop also publishes `nearTaxi` so the HUD
 * can switch between the "C · call" and "F · drive" prompts.
 */
export function DriveController({
  taxiRef,
  characterRef,
}: {
  taxiRef: RefObject<RapierRigidBody | null>;
  characterRef: RefObject<RapierRigidBody | null>;
}) {
  const elapsed = useRef(0);

  // Signal to e2e that the F/C window listeners are live. This component mounts
  // inside the Canvas (potentially behind the agent-GLB Suspense boundary), so
  // on a slow CI runner it can attach well after the canvas first paints — a
  // DOM wait can't see that gap, but tests can poll this flag before pressing.
  useEffect(() => {
    const w = window as unknown as { __driveReady?: boolean };
    w.__driveReady = true;
    return () => {
      w.__driveReady = false;
    };
  }, []);

  useFrame((_, delta) => {
    const { mode, nearTaxi, setNearTaxi, taxiCalling, setTaxiCalling } = useWorld.getState();
    const taxi = taxiRef.current;
    const agent = characterRef.current;

    if (taxiCalling && taxi) {
      elapsed.current += delta;
      const p = elapsed.current / SUMMON_TIME;
      POS.copy(START).lerp(TARGET, easeOutCubic(p));
      taxi.setTranslation({ x: POS.x, y: POS.y, z: POS.z }, true);
      taxi.setLinvel({ x: 0, y: 0, z: 0 }, true);
      taxi.setAngvel({ x: 0, y: 0, z: 0 }, true);
      if (p >= 1) setTaxiCalling(false);
      return;
    }

    if (mode !== "onFoot") {
      if (nearTaxi) setNearTaxi(false);
      return;
    }
    if (!taxi || !agent) return;
    const t = taxi.translation();
    const c = agent.translation();
    const near = withinRadius(t, c, ENTER_RADIUS);
    if (near !== nearTaxi) setNearTaxi(near);
  });

  const onToggle = useCallback(() => {
    const taxi = taxiRef.current;
    const agent = characterRef.current;
    if (!taxi || !agent) return;

    const { mode, setMode, taxiCalling } = useWorld.getState();
    if (taxiCalling) return;
    const t = taxi.translation();

    if (mode === "driving") {
      const spot = exitSpot(t, EXIT_OFFSET);
      agent.setTranslation({ x: spot.x, y: t.y + 0.4, z: spot.z }, true);
      agent.setLinvel({ x: 0, y: 0, z: 0 }, true);
      setMode("onFoot");
      return;
    }

    if (withinRadius(t, agent.translation(), ENTER_RADIUS)) setMode("driving");
  }, [taxiRef, characterRef]);

  const onCall = useCallback(() => {
    const taxi = taxiRef.current;
    const agent = characterRef.current;
    if (!taxi || !agent) return;

    const { mode, nearTaxi, taxiCalling, setTaxiCalling } = useWorld.getState();
    if (mode !== "onFoot" || nearTaxi || taxiCalling) return;

    const t = taxi.translation();
    const target = summonTarget(agent.translation(), SUMMON_OFFSET);
    START.set(t.x, t.y, t.z);
    TARGET.set(target.x, t.y, target.z);

    const yaw = faceYaw(START, TARGET);
    taxi.setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) }, true);

    elapsed.current = 0;
    setTaxiCalling(true);
  }, [taxiRef, characterRef]);

  useInteractKey("f", onToggle);
  useInteractKey("c", onCall);
  return null;
}
