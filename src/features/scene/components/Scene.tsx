"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Ground } from "./Ground";
import { PlaceholderCharacter } from "./PlaceholderCharacter";

/**
 * Top-level R3F scene. Phase 0 is just lights + ground + a placeholder block
 * where the suited agent will go. Real character + landmarks land in Phase 2-4.
 *
 * Lighting is tuned for the sunset palette (warm directional, cool ambient).
 * Fog matches the charcoal background so the world fades to night at distance.
 */
export function Scene() {
  return (
    <Canvas shadows camera={{ position: [4, 3, 5], fov: 50 }} gl={{ antialias: true }} dpr={[1, 2]}>
      <color attach="background" args={["#0A0A0A"]} />
      <fog attach="fog" args={["#0A0A0A", 10, 35]} />

      <ambientLight intensity={0.35} color="#7AA7D9" />
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.4}
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
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}
