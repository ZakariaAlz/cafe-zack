"use client";

import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { type RefObject, useCallback, useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/lib/world-store";
import { useInteractKey } from "../hooks/useInteractKey";
import { easeOutCubic, exitSpot, faceYaw, summonTarget, withinRadius } from "../lib/driving";

// How close the agent must be to climb into a vehicle.
const ENTER_RADIUS = 3;
// Where the agent is dropped on exit (beside the vehicle, +X).
const EXIT_OFFSET = 2.2;
// Seconds for a called taxi to glide to the agent.
const SUMMON_TIME = 1.3;
// Where the summoned taxi parks relative to the agent.
const SUMMON_OFFSET = 2.2;

const START = new THREE.Vector3();
const TARGET = new THREE.Vector3();
const POS = new THREE.Vector3();

/**
 * Owns vehicle enter/exit + call flow for both the R4 and the scooter:
 *
 *  - F, driving → onFoot: teleport the agent beside the vehicle they were in.
 *  - F, onFoot near R4 → driving R4.
 *  - F, onFoot near scooter → driving scooter.
 *  - C, onFoot away from R4: summon the R4 to you (the scooter doesn't get a
 *    call; it's a found-it-and-rode-it sidequest, not a hail).
 *
 * Frame loop publishes `nearTaxi` + `nearScooter` so the HUD can switch
 * prompts between "F · drive the R4" and "F · ride the scooter" based on
 * which the agent is closest to.
 */
export function DriveController({
  taxiRef,
  scooterRef,
  characterRef,
}: {
  taxiRef: RefObject<RapierRigidBody | null>;
  scooterRef: RefObject<RapierRigidBody | null>;
  characterRef: RefObject<RapierRigidBody | null>;
}) {
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    const {
      mode,
      nearTaxi,
      setNearTaxi,
      nearScooter,
      setNearScooter,
      taxiCalling,
      setTaxiCalling,
    } = useWorld.getState();
    const taxi = taxiRef.current;
    const scooter = scooterRef.current;
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
      if (nearScooter) setNearScooter(false);
      return;
    }
    if (!agent) return;
    const c = agent.translation();
    if (taxi) {
      const t = taxi.translation();
      const near = withinRadius(t, c, ENTER_RADIUS);
      if (near !== nearTaxi) setNearTaxi(near);
    }
    if (scooter) {
      const s = scooter.translation();
      const near = withinRadius(s, c, ENTER_RADIUS);
      if (near !== nearScooter) setNearScooter(near);
    }
  });

  // F — enter / exit the vehicle the agent is closest to. Driving → on foot
  // drops the agent beside whichever vehicle they were riding.
  const onToggle = useCallback(() => {
    const taxi = taxiRef.current;
    const scooter = scooterRef.current;
    const agent = characterRef.current;
    if (!agent) return;

    const { mode, setMode, vehicle, setVehicle, taxiCalling } = useWorld.getState();
    if (taxiCalling) return;

    if (mode === "driving") {
      const ride = vehicle === "scooter" ? scooter : taxi;
      if (!ride) return;
      const t = ride.translation();
      const spot = exitSpot(t, EXIT_OFFSET);
      agent.setTranslation({ x: spot.x, y: t.y + 0.4, z: spot.z }, true);
      agent.setLinvel({ x: 0, y: 0, z: 0 }, true);
      setMode("onFoot");
      return;
    }

    // On foot — mount whichever vehicle is in range. Prefer the scooter if
    // both are within reach so the player can climb back into the wider R4
    // by walking a step away if needed (the R4's hitbox is much bigger).
    const c = agent.translation();
    if (scooter && withinRadius(scooter.translation(), c, ENTER_RADIUS)) {
      setVehicle("scooter");
      setMode("driving");
      return;
    }
    if (taxi && withinRadius(taxi.translation(), c, ENTER_RADIUS)) {
      setVehicle("r4");
      setMode("driving");
    }
  }, [taxiRef, scooterRef, characterRef]);

  // C — call the R4 to you (only on foot, away from it, not on the scooter
  // path either).
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
