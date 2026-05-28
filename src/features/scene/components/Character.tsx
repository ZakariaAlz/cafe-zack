"use client";

import { useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useWorld } from "@/lib/world-store";
import { useKeyboard } from "../hooks/useKeyboard";
import { useModel } from "../lib/useModel";

const SPEED = 4.8;
const SPAWN: [number, number, number] = [4, 1.2, -2];
const DIR = new THREE.Vector3();

// Mixamo characters export with their feet at the model origin (Y=0). The
// capsule body's local origin sits 0.85 above the ground, so drop the visual
// by that amount to line up.
const FEET_OFFSET = -0.85;

// Mixamo rigs in the 1940s Spy pack come out from Blender slightly oversized
// for our world scale — capsule is ~1.7 m tall; the model is ~1.85 m as
// exported. A small scale brings the silhouette inside the collider.
const MODEL_SCALE = 0.92;

// Cross-fade time between Walking and Idle. Long enough not to look snappy.
const ANIM_FADE = 0.2;

/**
 * Suited agent — Mixamo-rigged GLB (1940s Spy, 3.8 MB compressed) with
 * Walking/Idle animations driven by the keyboard. The Eyewear mesh (the
 * sunglasses) animates to scale 0 on the Café Zack face-reveal beat.
 *
 * Velocity-driven capsule rigid body — same controller as before, only the
 * visual changed. The model is cloned (SkeletonUtils) so re-mounts during
 * HMR don't end up aliasing the cached scene from useGLTF.
 */
export function Character({ bodyRef }: { bodyRef: RefObject<RapierRigidBody | null> }) {
  const keys = useKeyboard();
  const { scene, animations } = useModel("agent-spy.glb");
  // Clone keeps each mounted instance independent — and survives HMR cleanly.
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const modelRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const eyewearRef = useRef<THREE.Object3D | null>(null);
  const { actions } = useAnimations(animations, modelRef);

  const reveal = useRef(0);
  const movingRef = useRef(false);
  const mode = useWorld((s) => s.mode);

  // Locate the Eyewear mesh once per cloned scene — it's our reveal hook.
  useEffect(() => {
    eyewearRef.current = cloned.getObjectByName("Eyewearmesh") ?? null;
  }, [cloned]);

  // Start in Idle once the actions are ready. Walking activates as soon as
  // the player moves.
  useEffect(() => {
    const idle = actions.Idle;
    if (idle) idle.reset().fadeIn(ANIM_FADE).play();
    return () => {
      idle?.fadeOut(ANIM_FADE);
    };
  }, [actions]);

  useFrame((_, delta) => {
    // Face-reveal — ease toward the store flag.
    const target = useWorld.getState().faceRevealed ? 1 : 0;
    reveal.current += (target - reveal.current) * (1 - Math.exp(-delta * 3));
    const eyewear = eyewearRef.current;
    if (eyewear) eyewear.scale.setScalar(Math.max(0.0001, 1 - reveal.current));

    const body = bodyRef.current;
    if (!body) return;

    const { mode: m, activePanel } = useWorld.getState();
    const onFoot = m === "onFoot";
    const panelOpen = activePanel !== null;
    const linvel = body.linvel();

    let moving = false;
    if (!onFoot || panelOpen) {
      body.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
    } else {
      let x = 0;
      let z = 0;
      if (keys.current.forward) z -= 1;
      if (keys.current.backward) z += 1;
      if (keys.current.left) x -= 1;
      if (keys.current.right) x += 1;
      DIR.set(x, 0, z);
      if (DIR.lengthSq() > 0) {
        moving = true;
        DIR.normalize();
        body.setLinvel({ x: DIR.x * SPEED, y: linvel.y, z: DIR.z * SPEED }, true);
        if (visualRef.current) visualRef.current.rotation.y = Math.atan2(DIR.x, DIR.z);
      } else {
        body.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
      }
    }

    // Crossfade Walking ↔ Idle whenever the moving state flips.
    if (moving !== movingRef.current) {
      movingRef.current = moving;
      const walk = actions.Walking;
      const idle = actions.Idle;
      if (walk && idle) {
        if (moving) {
          idle.fadeOut(ANIM_FADE);
          walk.reset().fadeIn(ANIM_FADE).play();
        } else {
          walk.fadeOut(ANIM_FADE);
          idle.reset().fadeIn(ANIM_FADE).play();
        }
      }
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={SPAWN}
      colliders={false}
      mass={70}
      linearDamping={0.9}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[0.55, 0.3]} />
      <group ref={visualRef} visible={mode === "onFoot"}>
        <group ref={modelRef} position={[0, FEET_OFFSET, 0]} scale={MODEL_SCALE}>
          <primitive object={cloned} />
        </group>
      </group>
    </RigidBody>
  );
}
