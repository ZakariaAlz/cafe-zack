"use client";

import { useAnimations } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useWorld } from "@/lib/world-store";
import { useKeyboard } from "../hooks/useKeyboard";
import { type Gait, pickGait } from "../lib/gait";
import { useModel } from "../lib/useModel";

const SPEED = 4.8;
const SPRINT_MULT = 1.8;
const SPAWN: [number, number, number] = [4, 1.2, -2];
const DIR = new THREE.Vector3();
const CAM_FWD = new THREE.Vector3();
const CAM_RIGHT = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);

// Mixamo characters export with their feet at the model origin (Y=0). The
// capsule body's local origin sits 0.85 above the ground, so drop the visual
// by that amount to line up.
const FEET_OFFSET = -0.85;

// The Mixamo source for this pack authors in centimetres; Blender's FBX
// importer keeps those units, so the GLB exports at 100× scene scale. 0.01
// brings the silhouette to a realistic ~1.7 m, matching the capsule.
const MODEL_SCALE = 0.01;

// Cross-fade time between gait clips (idle/walk/run). Long enough not to snap.
const ANIM_FADE = 0.2;
// Fallback only: when the dedicated Running clip hasn't been grafted into the
// GLB yet, the Walking clip is played this much faster so sprint still reads as
// a run. Once `actions.Running` exists this multiplier is unused — the run is
// its own clip at natural speed.
const SPRINT_TIMESCALE = 1.7;

/**
 * Suited agent — Mixamo-rigged 1940s Spy GLB (~3.8 MB compressed) with
 * Walking/Idle animations driven by the keyboard. Movement is camera-relative
 * on foot — the chase cam is world-fixed (user orbits with mouse drag), so we
 * project camera-forward onto the XZ plane and build the desired world
 * velocity from input. Without this, W would always move toward world -Z
 * regardless of where the camera was pointed.
 *
 * Locomotion is a three-state gait machine (idle/walk/run, see `pickGait`):
 * standing → Idle, moving → Walking, moving + Shift → the dedicated Running
 * clip at natural speed with movement bumped by SPRINT_MULT. Until the Running
 * clip is grafted into the GLB, sprint gracefully falls back to the Walking
 * clip at 1.7× timescale so the feature still works on a stale asset.
 *
 * The Eyewearmesh (sunglasses) animates to scale 0 on the Café Zack face-
 * reveal beat — the rig's hook into the cinematic moment.
 *
 * The previous attempt to swap in `eric2.fbx` (a static suit FBX) shipped
 * untextured material slots, a T-pose, and no walk cycle — the spy's
 * Mixamo rig is the load-bearing visual identity for this scene until we
 * graft Mixamo Walking/Idle onto a refined suit rig in a follow-up.
 */
export function Character({
  bodyRef,
  spawn = SPAWN,
}: {
  bodyRef: RefObject<RapierRigidBody | null>;
  /** Override the spawn position (the café interior spawns the agent at its
   * door; the street can respawn outside the café after an exit). */
  spawn?: [number, number, number];
}) {
  const keys = useKeyboard();
  const camera = useThree((s) => s.camera);
  const { scene, animations } = useModel("agent-spy.glb");
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const modelRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const eyewearRef = useRef<THREE.Object3D | null>(null);
  const { actions } = useAnimations(animations, modelRef);

  const reveal = useRef(0);
  const gaitRef = useRef<Gait>("idle");
  const mode = useWorld((s) => s.mode);

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

    const { mode: m, activePanel, contactOpen } = useWorld.getState();
    const onFoot = m === "onFoot";
    // Freeze movement while a 2D panel OR the in-world café form is open, so the
    // agent doesn't wander off while the visitor is typing.
    const panelOpen = activePanel !== null || contactOpen;
    const linvel = body.linvel();

    let moving = false;
    if (!onFoot || panelOpen) {
      body.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
    } else {
      CAM_FWD.set(0, 0, -1).applyQuaternion(camera.quaternion);
      CAM_FWD.y = 0;
      if (CAM_FWD.lengthSq() < 1e-6) CAM_FWD.set(0, 0, -1);
      CAM_FWD.normalize();
      CAM_RIGHT.crossVectors(CAM_FWD, WORLD_UP).normalize();

      const fwdInput = (keys.current.forward ? 1 : 0) - (keys.current.backward ? 1 : 0);
      const rightInput = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);

      DIR.copy(CAM_FWD).multiplyScalar(fwdInput).addScaledVector(CAM_RIGHT, rightInput);
      if (DIR.lengthSq() > 0) {
        moving = true;
        DIR.normalize();
        const speed = keys.current.sprint ? SPEED * SPRINT_MULT : SPEED;
        body.setLinvel({ x: DIR.x * speed, y: linvel.y, z: DIR.z * speed }, true);
        if (visualRef.current) visualRef.current.rotation.y = Math.atan2(DIR.x, DIR.z);
      } else {
        body.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
      }
    }

    // Three-state gait machine. `run` resolves to the dedicated Running clip
    // when present, else falls back to Walking (sped up below) so the feature
    // degrades gracefully on a GLB that predates the grafted Running animation.
    const walk = actions.Walking;
    const idle = actions.Idle;
    const run = actions.Running;
    const hasRun = !!run;
    const clipFor = (g: Gait) => (g === "idle" ? idle : g === "walk" ? walk : (run ?? walk));

    const gait = pickGait(moving, keys.current.sprint);
    if (gait !== gaitRef.current) {
      const prev = clipFor(gaitRef.current);
      const next = clipFor(gait);
      gaitRef.current = gait;
      // Skip the crossfade when run falls back to the same Walking clip already
      // playing — only the timeScale changes in that case (handled below).
      if (prev !== next) {
        prev?.fadeOut(ANIM_FADE);
        next?.reset().fadeIn(ANIM_FADE).play();
      }
    }
    // The real Running clip plays at natural speed; the Walking clip only speeds
    // up when it is standing in for a missing Running clip during a sprint.
    if (walk) walk.timeScale = !hasRun && gait === "run" ? SPRINT_TIMESCALE : 1;
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={spawn}
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
