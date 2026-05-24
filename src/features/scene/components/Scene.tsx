"use client";

import { OrbitControls, Sky, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
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
        <PlaceholderCharacter />
        <Ground />
        <Pipeline />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

/**
 * Top-level R3F scene — Algiers under a time-of-day cycle.
 *
 * Performance tuning (post-iteration):
 * - dpr capped at 1.5x (was 2x) — cuts pixel count ~30%
 * - shadow map 1024 (was 2048) — quarter of the prior fill cost
 * - Bloom without mipmapBlur — much cheaper full-screen pass
 * - autoRotate removed — was fighting user input and causing
 *   constant re-renders; visitor controls the camera
 * - OrbitControls damping enabled — smooth feel without per-frame work
 * - Stars count 1500 (was 3500) — 60% fewer points at night
 * - Distant silhouette buildings + small pipe segments no longer
 *   cast shadows (off-screen / too small for the shadow to matter)
 */
export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 3, 6], fov: 50 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
    >
      <SceneContent />
    </Canvas>
  );
}
