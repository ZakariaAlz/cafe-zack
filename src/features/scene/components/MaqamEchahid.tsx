"use client";

import { useFrame } from "@react-three/fiber";
import { CuboidCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useWorld } from "@/lib/world-store";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";
import { useTimeOfDay } from "../store/useTimeOfDay";

/**
 * Maqam Echahid (Martyrs' Memorial) — the Skills anchor. Three white concrete
 * palm fronds curving up to a central tower; the real monument stands at 92 m
 * over Algiers. We render it at 30 m here so it dominates the south end of
 * the world without swallowing the rest.
 *
 * At night, the fronds are floodlit GREEN from below (matching the live
 * monument's nightly lighting) with a warm red/amber accent at the central
 * tower. Two SpotLights track the visible fronds and a stone plaza disc
 * carries the silhouette down to ground level. Daytime keeps the fronds
 * naturally lit by the HDRI / sun + a soft ambient glow on the tower.
 *
 * Proximity trigger flips world.nearby → "maqam" so the HUD prompts and E
 * opens the Skills panel.
 */

// Pushed south from the old [0,0,22] so the wider 30 m footprint clears the
// road network and the player can approach across the plaza before the
// trigger fires.
const POSITION: [number, number, number] = [0, 0, 40];
const TRIGGER_RADIUS = 18;
const TARGET_HEIGHT = 30;
const PLAZA_RADIUS = 12;

const GREEN = "#3DFF8C";
const RED_STRIP = "#FF3344";
const TOWER_GLOW = "#FF6A22";
const STONE = "#C8C2B5";

// Spotlights mounted at the plaza edge, pointing up toward the apex so the
// fronds catch the green wash like the real monument's stage rig.
const SPOT_RADIUS = 5;
const SPOT_TARGET_Y = TARGET_HEIGHT * 0.7;

export function MaqamEchahid({ playerRef }: { playerRef: RefObject<RapierRigidBody | null> }) {
  const { scene } = useModel("maqam-echahid.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, TARGET_HEIGHT, 0);
    return c;
  }, [scene]);
  const inside = useRef(false);
  const timeOfDay = useTimeOfDay((s) => s.timeOfDay);
  const isNight = timeOfDay === "night";
  const isDusk = timeOfDay === "sunset" || timeOfDay === "sunrise";
  const spotIntensity = isNight ? 10 : isDusk ? 3 : 0;
  const towerIntensity = isNight ? 4 : isDusk ? 2 : 1;

  // Green emissive override on the fronds at night — held in a ref so the
  // useFrame loop can pulse the intensity without re-running the effect.
  const greenMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const pulseClock = useRef(0);

  useEffect(() => {
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    cloned.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        originals.set(obj, obj.material);
      }
    });
    if (isNight) {
      const greenMat = new THREE.MeshStandardMaterial({
        color: "#0A140C",
        emissive: new THREE.Color(GREEN),
        emissiveIntensity: 1.6,
        roughness: 0.45,
        metalness: 0,
      });
      greenMatRef.current = greenMat;
      for (const mesh of originals.keys()) mesh.material = greenMat;
    } else {
      greenMatRef.current = null;
      for (const [mesh, mat] of originals) mesh.material = mat;
    }
    return () => {
      for (const [mesh, mat] of originals) mesh.material = mat;
    };
  }, [cloned, isNight]);

  useFrame((_, delta) => {
    pulseClock.current += delta;

    // Slow breathing pulse on the green emissive at night (range 1.2 to 2.0).
    const mat = greenMatRef.current;
    if (mat) {
      mat.emissiveIntensity = 1.6 + Math.sin(pulseClock.current * 1.2) * 0.4;
    }

    const body = playerRef.current;
    if (!body) return;
    const dx = body.translation().x - POSITION[0];
    const dz = body.translation().z - POSITION[2];
    const near = dx * dx + dz * dz < TRIGGER_RADIUS * TRIGGER_RADIUS;
    if (near !== inside.current) {
      inside.current = near;
      const w = useWorld.getState();
      if (near) w.setNearby("maqam");
      else if (w.nearby === "maqam") w.setNearby(null);
    }
  });

  return (
    <group position={POSITION}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[10, 15, 10]} position={[0, 15, 0]} />
      </RigidBody>

      {/* Stone esplanade disc — the real Maqam sits on a wide plaza, not on
          the road. Visually grounds the GLB and gives the player something to
          walk onto before the colliders. */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[PLAZA_RADIUS, PLAZA_RADIUS + 0.5, 0.2, 48]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>

      <primitive object={cloned} />

      {/* Three floodlights at 120°, mounted at the plaza edge pointing UP at
          the fronds. Green at night, dim warm during dusk, off in daylight. */}
      {[0, 120, 240].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = Math.cos(rad) * SPOT_RADIUS;
        const z = Math.sin(rad) * SPOT_RADIUS;
        return (
          <group key={deg}>
            <spotLight
              position={[x, 0.4, z]}
              target-position={[x * 0.55, SPOT_TARGET_Y, z * 0.55]}
              color={GREEN}
              intensity={spotIntensity}
              angle={Math.PI / 8}
              penumbra={0.35}
              distance={TARGET_HEIGHT * 1.3}
              decay={1.6}
              castShadow={false}
            />
            {/* Visible green fixture so the spot's source is legible at
                ground level. */}
            <mesh position={[x, 0.25, z]}>
              <cylinderGeometry args={[0.3, 0.35, 0.5, 12]} />
              <meshStandardMaterial
                color={GREEN}
                emissive={GREEN}
                emissiveIntensity={isNight ? 2.5 : 0.4}
                roughness={0.4}
              />
            </mesh>
          </group>
        );
      })}

      {/* Red emissive strips climbing the left + right fronds — at night these
          read like the LED accent lines on the real monument's evening rig.
          Two thin vertical bars at ±5 m on the X axis, leaning inward to
          follow the fronds' curve toward the apex. */}
      {[-5.2, 5.2].map((x) => (
        <mesh
          key={`strip${x}`}
          position={[x, TARGET_HEIGHT * 0.42, 0]}
          rotation={[0, 0, -Math.sign(x) * 0.18]}
        >
          <boxGeometry args={[0.12, TARGET_HEIGHT * 0.7, 0.12]} />
          <meshStandardMaterial
            color={RED_STRIP}
            emissive={RED_STRIP}
            emissiveIntensity={isNight ? 3.4 : isDusk ? 1.4 : 0.4}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Central tower accent — the real monument has a red/amber halo at the
          top of the inner tower. Sits roughly where the three fronds meet. */}
      <mesh position={[0, TARGET_HEIGHT * 0.78, 0]}>
        <sphereGeometry args={[0.6, 16, 12]} />
        <meshStandardMaterial
          color={TOWER_GLOW}
          emissive={TOWER_GLOW}
          emissiveIntensity={towerIntensity}
          roughness={0.3}
        />
      </mesh>
      <pointLight
        position={[0, TARGET_HEIGHT * 0.78, 0]}
        color={TOWER_GLOW}
        intensity={towerIntensity * 4}
        distance={20}
        decay={1.8}
      />
    </group>
  );
}
