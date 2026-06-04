"use client";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { playRevealWhoosh } from "@/features/audio";
import { useWorld } from "@/lib/world-store";

/**
 * The mysterious face veil. A small cluster of soft, dark, camera-facing smoke
 * puffs that hover over the agent's head, keeping his face unreadable for the
 * whole pre-café traversal. On the Café Zack `faceRevealed` beat the veil rises
 * and dissolves — the face "evaporates" into view rather than the spy's old
 * sunglasses-off pop.
 *
 * Self-contained: it eases its own copy of the reveal flag and animates puff
 * drift + fade in `useFrame`. Billboarded so it always covers the face from the
 * viewer's angle regardless of how the agent or camera is turned, and drawn
 * with depthTest off + a high renderOrder so it reliably sits in front of the
 * head instead of z-fighting the face mesh.
 */

// Procedural soft radial smoke sprite — avoids shipping a texture asset.
function makeSmokeTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(10,10,16,0.96)");
    g.addColorStop(0.45, "rgba(12,12,20,0.62)");
    g.addColorStop(1, "rgba(14,14,22,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Puff layout around the face: base offset (local XY), size, and drift phase.
const PUFFS = [
  { o: [0, 0, 0] as const, s: 0.52, phase: 0 },
  { o: [-0.17, 0.04, 0.02] as const, s: 0.4, phase: 1.6 },
  { o: [0.17, -0.02, 0.02] as const, s: 0.42, phase: 3.1 },
  { o: [0.02, 0.16, 0.01] as const, s: 0.34, phase: 4.5 },
];

export function FaceVeil({ height = 0.72 }: { height?: number }) {
  const tex = useMemo(makeSmokeTexture, []);
  const reveal = useRef(0);
  const played = useRef(false);
  const groupRef = useRef<THREE.Group>(null);
  const matRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((state, delta) => {
    const revealedFlag = useWorld.getState().faceRevealed;
    // Fire the evaporation cue once, the instant the reveal is triggered.
    if (revealedFlag && !played.current) {
      played.current = true;
      playRevealWhoosh();
    } else if (!revealedFlag && played.current) {
      played.current = false;
    }
    const target = revealedFlag ? 1 : 0;
    // Ease toward the flag a touch slower than the camera so the evaporation
    // reads as a deliberate beat rather than a snap.
    reveal.current += (target - reveal.current) * (1 - Math.exp(-delta * 2.2));
    const r = reveal.current;
    const grp = groupRef.current;
    if (grp) {
      // Rise as it evaporates; hide entirely once essentially clear.
      grp.position.y = height + r * 0.7;
      grp.visible = r < 0.985;
    }
    const t = state.clock.elapsedTime;
    for (let i = 0; i < PUFFS.length; i++) {
      const mat = matRefs.current[i];
      if (!mat) continue;
      // Idle smoke breathing, fading right out as the face is revealed.
      const breathe = 0.78 + 0.12 * Math.sin(t * 1.1 + PUFFS[i].phase);
      mat.opacity = breathe * (1 - r);
    }
  });

  return (
    <group ref={groupRef} position={[0, height, 0]}>
      {PUFFS.map((p, i) => (
        <Billboard key={p.phase} position={p.o}>
          <mesh renderOrder={20}>
            <planeGeometry args={[p.s, p.s]} />
            <meshBasicMaterial
              ref={(m) => {
                matRefs.current[i] = m;
              }}
              map={tex}
              transparent
              depthTest={false}
              depthWrite={false}
              opacity={0.85}
              color="#0a0a10"
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}
