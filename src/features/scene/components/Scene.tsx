"use client";

import { Environment, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Physics, type RapierRigidBody } from "@react-three/rapier";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { useAmbientZone } from "@/features/audio";
import { useWorld } from "@/lib/world-store";
import { type TimeOfDay, useTimeOfDay } from "../store/useTimeOfDay";
import { Autoroute } from "./Autoroute";
import { Bouzareah } from "./Bouzareah";
import { CafeInterior } from "./CafeInterior";
import { CafeZack } from "./CafeZack";
import { Casbah } from "./Casbah";
import { CasbahPath } from "./CasbahPath";
import { CasbahStreet } from "./CasbahStreet";
import { Character } from "./Character";
import { ChaseCamera } from "./ChaseCamera";
import { CityBlocks } from "./CityBlocks";
import { DriveController } from "./DriveController";
import { GrandePoste } from "./GrandePoste";
import { MaqamEchahid } from "./MaqamEchahid";
import { NotreDameDAfrique } from "./NotreDameDAfrique";
import { Pedestrians } from "./Pedestrians";
import { RoadNetwork } from "./RoadNetwork";
import { Sablette } from "./Sablette";
import { SabletteLife } from "./SabletteLife";
import { Sea } from "./Sea";
import { Streetlamps } from "./Streetlamps";
import { Terrain } from "./Terrain";
import { Traffic } from "./Traffic";
import { Vehicle } from "./Vehicle";

// NOTE: the old flat-layout set-dressing (Street, RoadNetwork, Beach, CafeDog,
// Casbah quarter/market/kids, Djamaa Djedid, Grande Poste plaza, promenade &
// landmark crowds, shore rocks) is temporarily out of the scene while the world
// is rebuilt onto the amphitheatre slope — each was pinned to the old compass
// grid at y=0 and would float on the new terrain. They return, re-anchored to
// terrainHeight, in the follow-up population passes.

type Preset = {
  skyFile: string;
  fogColor: string;
  ambientColor: string;
  ambientIntensity: number;
  hemisphereSky: string;
  hemisphereGround: string;
  hemisphereIntensity: number;
  directionalPos: [number, number, number];
  directionalColor: string;
  directionalIntensity: number;
  bloomIntensity: number;
};

// Equirectangular HDRI skies live at /textures/sky-*.jpg (downsampled from
// the 16K originals by scripts/build-skybox.ts). The HDRI replaces the
// procedural Sky shader so the horizon reads as real Algiers atmosphere.
const PRESETS: Record<TimeOfDay, Preset> = {
  sunrise: {
    skyFile: "/textures/sky-sunset.jpg",
    fogColor: "#5A3A2A",
    ambientColor: "#A0C0E0",
    ambientIntensity: 0.22,
    hemisphereSky: "#FFE5C2",
    hemisphereGround: "#A85B2A",
    hemisphereIntensity: 0.5,
    directionalPos: [12, 4, 5],
    directionalColor: "#FFE0B5",
    directionalIntensity: 1.6,
    bloomIntensity: 0.4,
  },
  midday: {
    skyFile: "/textures/sky-day.jpg",
    fogColor: "#9DBEDC",
    ambientColor: "#FFFFFF",
    ambientIntensity: 0.5,
    hemisphereSky: "#87CEEB",
    hemisphereGround: "#A85B2A",
    hemisphereIntensity: 0.4,
    directionalPos: [5, 12, 5],
    directionalColor: "#FFFFFF",
    directionalIntensity: 2.4,
    bloomIntensity: 0.25,
  },
  sunset: {
    skyFile: "/textures/sky-sunset.jpg",
    fogColor: "#4A2018",
    ambientColor: "#7AA7D9",
    ambientIntensity: 0.15,
    hemisphereSky: "#FF8A4C",
    hemisphereGround: "#C2410C",
    hemisphereIntensity: 0.7,
    directionalPos: [-12, 3, 5],
    directionalColor: "#FFB070",
    directionalIntensity: 1.9,
    bloomIntensity: 0.5,
  },
  night: {
    skyFile: "/textures/sky-night.jpg",
    fogColor: "#0A0820",
    ambientColor: "#2A2050",
    ambientIntensity: 0.2,
    hemisphereSky: "#1E1B2C",
    hemisphereGround: "#0A0820",
    hemisphereIntensity: 0.3,
    directionalPos: [-5, 8, 5],
    directionalColor: "#5070A0",
    directionalIntensity: 0.5,
    bloomIntensity: 0.8,
  },
};

function SceneContent() {
  const timeOfDay = useTimeOfDay((s) => s.timeOfDay);
  const p = PRESETS[timeOfDay];
  const isNight = timeOfDay === "night";

  // The two controllable bodies; `activeRef` is whichever the player drives,
  // which the chase camera follows and the landmark proximity reads.
  const taxiRef = useRef<RapierRigidBody>(null);
  const characterRef = useRef<RapierRigidBody>(null);
  const mode = useWorld((s) => s.mode);
  const faceRevealed = useWorld((s) => s.faceRevealed);
  const venue = useWorld((s) => s.venue);
  const streetSpawn = useWorld((s) => s.streetSpawn);
  // Ambient audio follows whichever body is active on the street; inside the
  // café the interior owns its own (silent) zone for now.
  const activeRef = mode === "driving" ? taxiRef : characterRef;
  useAmbientZone(activeRef);

  // Expose the street player body to e2e so a test can place the agent next to a
  // landmark and let real proximity fire — walking across the open world via
  // held keys is camera-relative and nondeterministic under headless GL. Same
  // spirit as window.__world; a harmless ref handle.
  useEffect(() => {
    (window as unknown as { __playerBody?: typeof characterRef }).__playerBody = characterRef;
  }, []);

  // Inside Café Zack: the whole street world unmounts and the interior subtree
  // takes over (its own Physics, lights, agent, and camera). The black
  // FadeOverlay (DOM, in PanelsRoot) hides the swap. EffectComposer stays
  // mounted across both so bloom is continuous.
  if (venue === "cafe-interior") {
    return (
      <>
        <CafeInterior />
        <EffectComposer>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.85}
            kernelSize={1}
            levels={3}
          />
        </EffectComposer>
      </>
    );
  }

  return (
    <>
      {/* Fog pushed out so the world reads as open — was 18→60 (plateau-sized),
          now 40→220 with a much larger Ground beneath. */}
      <fog attach="fog" args={[p.fogColor, 40, 220]} />

      <Environment files={p.skyFile} background backgroundBlurriness={0} />
      {isNight && (
        <Stars radius={300} depth={120} count={2200} factor={4} saturation={0} fade speed={0.3} />
      )}

      <hemisphereLight args={[p.hemisphereSky, p.hemisphereGround, p.hemisphereIntensity]} />
      <ambientLight intensity={p.ambientIntensity} color={p.ambientColor} />
      <directionalLight
        position={p.directionalPos}
        intensity={p.directionalIntensity}
        color={p.directionalColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      <Suspense fallback={null}>
        <Bouzareah />
        <Sea />
        <RoadNetwork />
        {/* Casbah path — a terrain-draped cobble lane with raised stone
            sidewalks down the alley between the enlarged white houses. (A rigid
            road-tile here pitched into ramps on the slope; a draped ribbon
            tracks the rolling medina ground.) */}
        <CasbahPath />
        <Autoroute />
        <Sablette />
        <SabletteLife playerRef={activeRef} />
        <Pedestrians />
        <Physics gravity={[0, -9.81, 0]}>
          <Terrain />
          <CityBlocks />
          <Traffic />
          <Streetlamps />
          <Vehicle bodyRef={taxiRef} />
          <Character bodyRef={characterRef} spawn={streetSpawn ?? undefined} />
          <GrandePoste playerRef={activeRef} />
          <Casbah playerRef={activeRef} />
          <CasbahStreet />
          <NotreDameDAfrique playerRef={activeRef} />
          <MaqamEchahid playerRef={activeRef} />
          <CafeZack playerRef={activeRef} />
        </Physics>
      </Suspense>

      <ChaseCamera
        targetRef={activeRef}
        // On-foot cam pushes in to a tighter, more intimate framing once the
        // face is revealed (the café cinematic beat). Drive mode lets the
        // seat swing with the car's heading so steering feels natural; on
        // foot we leave the seat world-fixed so drag-orbit can inspect freely.
        seat={mode === "driving" ? [0, 3.5, 8] : faceRevealed ? [0, 1.9, 3.4] : [0, 2.2, 4.5]}
        lookLift={mode === "driving" ? 1.2 : faceRevealed ? 0.8 : 1}
        followBodyYaw={mode === "driving"}
      />
      <DriveController taxiRef={taxiRef} characterRef={characterRef} />

      <EffectComposer>
        <Bloom
          intensity={p.bloomIntensity}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.85}
          // KernelSize enum is in 'postprocessing' (not re-exported by
          // @react-three/postprocessing). 1 = SMALL, the cheapest blur.
          kernelSize={1}
          levels={3}
        />
      </EffectComposer>
    </>
  );
}

/**
 * Top-level R3F scene — Algiers under a time-of-day cycle.
 *
 * Now physics-enabled (Rapier) — the drivable taxi spike is inside the
 * <Physics> block alongside the Ground collider. Pipeline visualization
 * removed from view (file kept on disk in case we re-introduce as
 * decorative manhole detail later); was the focus shift away from the
 * "world IS the pipeline" abstraction to a Bruno-Simon-style city the
 * visitor can actually drive through.
 *
 * Drive with WASD or arrow keys; a ChaseCamera (PR B) follows the taxi from
 * behind. OrbitControls retired here — a programmatic follow cam and orbit
 * controls can't both own camera.position.
 */
export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 3, 6], fov: 50 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      dpr={[1, 1.5]}
    >
      <SceneContent />
    </Canvas>
  );
}
