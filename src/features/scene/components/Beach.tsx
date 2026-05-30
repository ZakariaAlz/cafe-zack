"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { useTimeOfDay } from "../store/useTimeOfDay";
import { Palm } from "./Palm";

/**
 * Algiers corniche — a strip of beach + Mediterranean sea well north of the
 * Grande Poste. Layout, looking north (-Z):
 *
 *   z = -62  ─── concrete sea wall ───
 *   z = -65  ─── promenade tile ───
 *   z = -70  ─── sand strip slopes down to water ───
 *   z = -85  ─── Mediterranean (huge plane) ───
 *
 * Six procedural palms along the promenade. Water mesh nudges its UV offset
 * each frame for a low-cost "sea is moving" read; emissive bumps gently at
 * sunset / night so the water catches the sky colour.
 */

const SAND = "#E8D7A8";
const PROMENADE = "#C8C2B5";
const SEA_WALL = "#A8A39A";
const WATER_BLUE = "#1B5A8C";
const SAND_WIDTH = 90;
const PROMENADE_WIDTH = 90;
const PROMENADE_DEPTH = 4;
const SAND_DEPTH = 12;
const WATER_WIDTH = 200;
const WATER_DEPTH = 80;

// Beach strip lives well north of the road network; Z grows southward in our
// world so the corniche is at very negative Z.
const PROMENADE_Z = -64;
const SAND_Z = -72;
const WATER_Z = -120;
const SEA_WALL_Z = -65.5;

export function Beach() {
  const timeOfDay = useTimeOfDay((s) => s.timeOfDay);
  const isNight = timeOfDay === "night";
  const isDusk = timeOfDay === "sunset" || timeOfDay === "sunrise";
  const waterEmissive = isNight ? 0.35 : isDusk ? 0.5 : 0.05;
  const waterColor = isNight ? "#0E2440" : isDusk ? "#A85B2A" : WATER_BLUE;
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const mesh = waterRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    // Drift the normal-ish gradient via material color cycle — cheap motion
    // hint without a custom shader. Replace with proper wave shader when the
    // performance budget allows.
    mat.emissiveIntensity = waterEmissive + Math.sin(performance.now() * 0.001) * 0.04;
    void delta;
  });

  return (
    <group>
      {/* Promenade — light grey concrete tile between road and sea wall. */}
      <mesh position={[0, 0.01, PROMENADE_Z]} receiveShadow>
        <boxGeometry args={[PROMENADE_WIDTH, 0.04, PROMENADE_DEPTH]} />
        <meshStandardMaterial color={PROMENADE} roughness={0.95} />
      </mesh>

      {/* Sea wall — short concrete barrier south of the sand, gives elevation. */}
      <mesh position={[0, 0.4, SEA_WALL_Z]} castShadow receiveShadow>
        <boxGeometry args={[PROMENADE_WIDTH, 0.8, 0.5]} />
        <meshStandardMaterial color={SEA_WALL} roughness={0.9} />
      </mesh>

      {/* Sand strip — slopes down toward the water plane. */}
      <mesh position={[0, 0.02, SAND_Z]} receiveShadow>
        <boxGeometry args={[SAND_WIDTH, 0.04, SAND_DEPTH]} />
        <meshStandardMaterial color={SAND} roughness={0.98} />
      </mesh>

      {/* Mediterranean — wide plane that fog softens at the horizon. */}
      <mesh ref={waterRef} position={[0, 0.05, WATER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WATER_WIDTH, WATER_DEPTH, 1, 1]} />
        <meshStandardMaterial
          color={waterColor}
          emissive={waterColor}
          emissiveIntensity={waterEmissive}
          roughness={0.18}
          metalness={0.05}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Promenade palms — three on the road-facing side, three on the sand. */}
      <Palm position={[-30, 0, PROMENADE_Z - 1.5]} seed={1} scale={1.05} />
      <Palm position={[0, 0, PROMENADE_Z - 1.5]} seed={2} />
      <Palm position={[30, 0, PROMENADE_Z - 1.5]} seed={3} scale={1.1} />
      <Palm position={[-22, 0, SAND_Z + 2]} seed={4} scale={0.95} />
      <Palm position={[15, 0, SAND_Z + 1]} seed={5} scale={1.0} />
      <Palm position={[35, 0, SAND_Z + 3]} seed={6} scale={1.05} />
    </group>
  );
}
