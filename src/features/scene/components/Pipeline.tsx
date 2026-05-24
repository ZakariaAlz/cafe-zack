"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSpeed;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    // Flowing stripe pattern along the pipe length (UV.y maps along cylinder axis)
    float phase = vUv.y * 8.0 - uTime * uSpeed;
    float stripe = sin(phase * 3.14159) * 0.5 + 0.5;
    stripe = smoothstep(0.45, 0.55, stripe);

    // Fresnel rim highlight gives the pipes physical presence
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    fresnel = pow(fresnel, 2.5);

    // Compose: dim base + bright flowing stripes + rim glow
    vec3 col = uColor * 0.55 + uColor * stripe * 1.7 + uColor * fresnel * 0.9;

    gl_FragColor = vec4(col, 1.0);
  }
`;

type SegmentProps = {
  yOffset: number;
  color: string;
  speed?: number;
};

function PipeSegment({ yOffset, color, speed = 1 }: SegmentProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uSpeed: { value: speed },
    }),
    [color, speed],
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh position={[0, yOffset, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.05, 0.05, 2.4, 16, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
      />
    </mesh>
  );
}

/**
 * "The world IS the pipeline" — supporting detail, not the main event.
 *
 * Tucked behind the character to the right, low to the ground, much
 * smaller than the original spike. Three pipes still stacked in the
 * medallion order (bronze → silver → gold) so the visual language
 * is locked in, but the dominance has been pulled WAY back so the
 * actual Algiers scene (sky, character, skyline) reads first.
 *
 * Phase 4-5 brings this back stronger via:
 * - Manhole cutaways with the pipeline visible peeking up from below
 * - TubeGeometry runs between landmarks following street paths
 * - Real ingestion driving uSpeed (GitHub Events API / Kafka topic)
 */
export function Pipeline() {
  return (
    <group position={[2.8, 0, 2.5]}>
      <PipeSegment yOffset={0.1} color="#A85B2A" speed={0.6} />
      <PipeSegment yOffset={0.22} color="#7AA7D9" speed={0.85} />
      <PipeSegment yOffset={0.34} color="#E8B549" speed={1.15} />
    </group>
  );
}
