"use client";

import { Sky, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Physics, type RapierRigidBody } from "@react-three/rapier";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { useAmbientZone } from "@/features/audio";
import { useWorld } from "@/lib/world-store";
import { type TimeOfDay, useTimeOfDay } from "../store/useTimeOfDay";
import { AlgiersSilhouette } from "./AlgiersSilhouette";
import { CafeZack } from "./CafeZack";
import { Casbah } from "./Casbah";
import { Character } from "./Character";
import { ChaseCamera } from "./ChaseCamera";
import { DriveController } from "./DriveController";
import { GrandePoste } from "./GrandePoste";
import { Ground } from "./Ground";
import { MaqamEchahid } from "./MaqamEchahid";
import { NotreDameDAfrique } from "./NotreDameDAfrique";
import { Street } from "./Street";
import { Vehicle } from "./Vehicle";

type Preset = {
  sunPosition: [number, number, number];
  turbidity: number;
  rayleigh: number;
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

const PRESETS: Record<TimeOfDay, Preset> = {
  sunrise: {
    sunPosition: [50, 4, 0],
    turbidity: 5,
    rayleigh: 1.0,
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
    sunPosition: [10, 50, 0],
    turbidity: 8,
    rayleigh: 0.5,
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
    sunPosition: [-30, 2, 0],
    turbidity: 8,
    rayleigh: 2.5,
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
    sunPosition: [0, -10, 0],
    turbidity: 0.1,
    rayleigh: 0.01,
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
  const activeRef = mode === "driving" ? taxiRef : characterRef;
  useAmbientZone(activeRef);

  return (
    <>
      <fog attach="fog" args={[p.fogColor, 18, 60]} />

      {isNight ? (
        <>
          <color attach="background" args={["#050310"]} />
          <Stars
            radius={120}
            depth={60}
            count={1500}
            factor={3.5}
            saturation={0}
            fade
            speed={0.3}
          />
        </>
      ) : (
        <Sky
          distance={450000}
          sunPosition={p.sunPosition}
          turbidity={p.turbidity}
          rayleigh={p.rayleigh}
          mieCoefficient={0.005}
          mieDirectionalG={0.92}
        />
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
        <AlgiersSilhouette />
        <Street />
        <Physics gravity={[0, -9.81, 0]}>
          <Ground />
          <Vehicle bodyRef={taxiRef} />
          <Character bodyRef={characterRef} />
          <GrandePoste playerRef={activeRef} />
          <Casbah playerRef={activeRef} />
          <NotreDameDAfrique playerRef={activeRef} />
          <MaqamEchahid playerRef={activeRef} />
          <CafeZack playerRef={activeRef} />
        </Physics>
      </Suspense>

      <ChaseCamera
        targetRef={activeRef}
        // On-foot cam pushes in to a tighter, more intimate framing once the
        // face is revealed (the café cinematic beat).
        seat={mode === "driving" ? [0, 3.5, 8] : faceRevealed ? [0, 1.9, 3.4] : [0, 2.2, 4.5]}
        lookLift={mode === "driving" ? 1.2 : faceRevealed ? 0.8 : 1}
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
