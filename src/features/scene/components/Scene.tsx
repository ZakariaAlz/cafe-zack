"use client";

import { OrbitControls, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense } from "react";
import { Ground } from "./Ground";
import { Pipeline } from "./Pipeline";
import { PlaceholderCharacter } from "./PlaceholderCharacter";

/**
 * Top-level R3F scene — sunset atmosphere over Algiers.
 *
 * Lighting stack:
 * - drei <Sky> with sun low on the west horizon for the ochre-bay-of-Algiers
 *   sunset look (replaces the prior flat charcoal background)
 * - hemisphere light: warm sky tone + ochre ground bounce for natural gradient
 * - cool dim ambient: faint Mediterranean blue rim
 * - warm low directional: the actual sunset shaft, casts long shadows
 *
 * Postprocess:
 * - Bloom (mipmap, threshold 0.5) makes the pipeline stripes glow
 *   without washing out the rest of the scene
 *
 * Fog color is warm dust so the world fades into the sky at distance
 * rather than dropping into black.
 */
export function Scene() {
  return (
    <Canvas shadows camera={{ position: [4, 3, 5], fov: 50 }} gl={{ antialias: true }} dpr={[1, 2]}>
      <fog attach="fog" args={["#3a1f1a", 15, 50]} />

      <Sky
        distance={450000}
        sunPosition={[-50, 5, 0]}
        turbidity={6}
        rayleigh={1.4}
        mieCoefficient={0.005}
        mieDirectionalG={0.92}
      />

      <hemisphereLight args={["#FFD9A8", "#A85B2A", 0.5]} />
      <ambientLight intensity={0.18} color="#A0C0E0" />
      <directionalLight
        position={[10, 4, 5]}
        intensity={1.6}
        color="#FFD9A8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      <Suspense fallback={null}>
        <PlaceholderCharacter />
        <Ground />
        <Pipeline />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.4}
      />

      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.5} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
