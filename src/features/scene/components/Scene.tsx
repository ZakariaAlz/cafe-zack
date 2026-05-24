"use client";

import { OrbitControls, Sky, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense } from "react";
import { type TimeOfDay, useTimeOfDay } from "../store/useTimeOfDay";
import { AlgiersSilhouette } from "./AlgiersSilhouette";
import { Ground } from "./Ground";
import { Pipeline } from "./Pipeline";
import { PlaceholderCharacter } from "./PlaceholderCharacter";

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

/**
 * Lighting + sky presets per time of day. Tuned so each one reads as a
 * distinct mood at a glance:
 * - sunrise: cool blue still in the shadows, warm peach light from the east
 * - midday: bright blue sky, near-white sun overhead, minimal bloom
 * - sunset: saturated orange-to-blue gradient, sun low in the west, long shadows
 * - night: starfield over the bay, blue moonlight, bloom shines harder so the
 *   pipeline (and future neon) pops
 */
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
    bloomIntensity: 0.55,
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
    bloomIntensity: 0.35,
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
    bloomIntensity: 0.7,
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
    bloomIntensity: 1.2,
  },
};

function SceneContent() {
  const timeOfDay = useTimeOfDay((s) => s.timeOfDay);
  const p = PRESETS[timeOfDay];
  const isNight = timeOfDay === "night";

  return (
    <>
      <fog attach="fog" args={[p.fogColor, 18, 60]} />

      {isNight ? (
        <>
          <color attach="background" args={["#050310"]} />
          <Stars radius={120} depth={60} count={3500} factor={4} saturation={0} fade speed={0.4} />
        </>
      ) : (
        <Sky
          key={timeOfDay}
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
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <Suspense fallback={null}>
        <AlgiersSilhouette />
        <PlaceholderCharacter />
        <Ground />
        <Pipeline />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.3}
      />

      <EffectComposer>
        <Bloom
          intensity={p.bloomIntensity}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

/**
 * Top-level R3F scene — Algiers under a time-of-day cycle.
 *
 * The whole atmosphere (sky, lights, fog, bloom) is preset-driven from
 * the useTimeOfDay store. UI control lives outside the Canvas in
 * TimeOfDayControl; this component just subscribes and re-renders.
 *
 * The scene focuses on PLACE — AlgiersSilhouette gestures at the city
 * skyline (real Quaternius/Meshy buildings arrive in Phase 4). The
 * pipeline visualization is intentionally tucked off to the side and
 * shrunk so it reads as background infrastructure, not the main event.
 */
export function Scene() {
  return (
    <Canvas shadows camera={{ position: [5, 3, 6], fov: 50 }} gl={{ antialias: true }} dpr={[1, 2]}>
      <SceneContent />
    </Canvas>
  );
}
