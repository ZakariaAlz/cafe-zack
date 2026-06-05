"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SHORE_X } from "../lib/terrain";

/**
 * The Bay of Algiers — a large Mediterranean-blue water plane filling the sea
 * seaward of the shoreline (x > SHORE_X). The amphitheatre terrain rises above
 * the waterline inland and occludes the plane there, while the seaward beach
 * (where terrainHeight dips below 0) reads as a shore meeting the water.
 *
 * Purely visual — no collider; the heightfield's seaward dip is the floor. A
 * cheap per-vertex swell keeps the bay alive without a custom shader.
 */

const WATER_Y = -0.1;
const WIDTH = 1400; // along X, out to the horizon
const DEPTH = 1300; // along Z
const SEG = 48;
const CENTER_X = SHORE_X + WIDTH / 2 - 60; // start a touch landward of the shore

export function Sea() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WIDTH, DEPTH, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
  const base = useMemo(() => {
    const pos = (geometry.attributes.position as THREE.BufferAttribute).clone();
    return pos;
  }, [geometry]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = base.getX(i);
      const z = base.getZ(i);
      const swell = Math.sin(x * 0.03 + t * 0.6) * 0.18 + Math.cos(z * 0.04 + t * 0.5) * 0.14;
      pos.setY(i, swell);
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[CENTER_X, WATER_Y, 0]} receiveShadow>
      <meshStandardMaterial
        color="#1F6E8C"
        roughness={0.25}
        metalness={0.1}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}
