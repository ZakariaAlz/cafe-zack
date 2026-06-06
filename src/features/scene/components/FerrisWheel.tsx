"use client";

import { useAnimations } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { terrainHeight } from "../lib/terrain";
import { useModel } from "../lib/useModel";
import { useTimeOfDay } from "../store/useTimeOfDay";

/**
 * La Grande Roue — the Sablette Ferris wheel. The hero promenade landmark on
 * the seafront. The GLB ships one clip ("Take 001") that turns the wheel; we
 * play it on a slow loop so it always rotates. At night the rim, spokes and
 * cabins glow warm-amber (emissive override + a hub point light) so it reads
 * as the luminous fairground wheel that lights up the Algiers bay after dark —
 * caught by the scene's bloom pass.
 *
 * Pure dressing: no collider (the player walks the promenade around it).
 * Sits on the terrain via `terrainHeight` at its (x,z).
 */

const TARGET_HEIGHT = 17; // in scale with the 18 m Maqam — a true bay landmark
const WARM = "#FFB347"; // amber fairground bulbs

export function FerrisWheel({ x, z }: { x: number; z: number }) {
  const { scene, animations } = useModel("ferris-wheel.glb");
  const modelRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, modelRef);
  const timeOfDay = useTimeOfDay((s) => s.timeOfDay);
  const isNight = timeOfDay === "night";
  const isDusk = timeOfDay === "sunset" || timeOfDay === "sunrise";

  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    // The GLB ships fairground furniture (a ground plane, fence, trash, base
    // block, stairs — the "lambert4" group) alongside the wheel structure
    // ("lambert1"). The flat ground plane is huge in native units; left in, it
    // (a) dominates the bounding box so fitModelToHeight mis-scales the wheel
    // and (b) blows up into a giant slab. Strip the furniture BEFORE fitting so
    // the scale comes from the wheel alone and the slab is gone.
    const drop: THREE.Object3D[] = [];
    c.traverse((obj) => {
      if (obj instanceof THREE.Mesh && /plane|fence|trash|block|stairs|lambert4/i.test(obj.name)) {
        drop.push(obj);
      }
    });
    for (const m of drop) m.removeFromParent();
    fitModelToHeight(c, TARGET_HEIGHT);
    return c;
  }, [scene]);

  // Spin the wheel on a gentle continuous loop.
  useEffect(() => {
    const clip = Object.values(actions)
      .filter((a): a is THREE.AnimationAction => Boolean(a))
      .sort((a, b) => b.getClip().duration - a.getClip().duration)[0];
    if (clip) {
      clip.reset().play();
      clip.setEffectiveTimeScale(0.25); // slow, stately turn
      clip.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
    }
    return () => {
      clip?.stop();
    };
  }, [actions]);

  // Night: paint the wheel's structural meshes emissive warm so the rim and
  // cabins glow; restore the originals by day. Mirrors the Maqam night-lighting
  // override.
  useEffect(() => {
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    cloned.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        originals.set(obj, obj.material);
      }
    });
    const glow = isNight ? 1.4 : isDusk ? 0.5 : 0;
    if (glow > 0) {
      for (const mesh of originals.keys()) {
        // Only the wheel structure (lambert1 = metal frame/cabins) lights up;
        // the ground plane / fence / trash keep their day material.
        if (!/lambert1|wheel|polySurface/i.test(mesh.name)) continue;
        const base = mesh.material as THREE.MeshStandardMaterial;
        const lit = base.clone();
        lit.emissive = new THREE.Color(WARM);
        lit.emissiveIntensity = glow;
        mesh.material = lit;
      }
    }
    return () => {
      for (const [mesh, mat] of originals) mesh.material = mat;
    };
  }, [cloned, isNight, isDusk]);

  return (
    <group position={[x, terrainHeight(x, z), z]}>
      <group ref={modelRef}>
        <primitive object={cloned} />
      </group>
      {/* Warm hub glow at night, lifted to the wheel's centre, for bloom. */}
      {isNight && (
        <pointLight
          position={[0, TARGET_HEIGHT * 0.55, 0]}
          color={WARM}
          intensity={6}
          distance={40}
          decay={1.6}
        />
      )}
    </group>
  );
}
