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
    <mesh position={[0, yOffset, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.09, 0.09, 5, 32, 1]} />
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
 * "The world IS the pipeline" — Phase 3 head-start spike.
 *
 * Three horizontal pipes running along the X axis, stacked vertically
 * in bronze → silver → gold (medallion architecture: raw → transformed
 * → KPI). A moving stripe pattern inside each pipe reads as fluid flow;
 * a subtle fresnel rim gives the pipes physical presence in the scene.
 *
 * Each layer flows at a slightly different speed so they read as
 * distinct stages: bronze slowest (raw ingestion), gold fastest
 * (KPIs ready to serve).
 *
 * Next steps (Phases 4-5, see docs/design-brief-phase-1.md §4.5):
 * - Bend pipes around landmarks via TubeGeometry along curves
 * - Drive uSpeed from GitHub Events API / Kafka topic rate
 * - Add manhole cutaways at intersections for "peek beneath" reveals
 */
export function Pipeline() {
  return (
    <group position={[0, 0, 2]}>
      <PipeSegment yOffset={0.2} color="#A85B2A" speed={0.6} />
      <PipeSegment yOffset={0.46} color="#7AA7D9" speed={0.85} />
      <PipeSegment yOffset={0.72} color="#E8B549" speed={1.15} />
    </group>
  );
}
