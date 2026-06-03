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

// Business_Man feet sit at the model origin (Y≈0). The capsule body's local
// origin sits 0.85 above the ground, so drop the visual by that much to align.
const FEET_OFFSET = -0.85;

// Business_Man is authored in metres (~1.9 m tall), NOT centimetres like the
// Mixamo packs — so no 100× correction. 0.9 brings him to ~1.7 m, matching the
// capsule (half-height 0.55 + radius 0.3).
const MODEL_SCALE = 0.9;

// Flip to Math.PI if the model's rest pose faces away from its travel
// direction. Business_Man's rig faces +Z, which matches atan2(x, z).
const FACING_OFFSET = 0;

// Cross-fade time between animation clips. Long enough not to look snappy.
const ANIM_FADE = 0.2;

// Which clip is playing. Gait (idle/walk/run) plus the café-reveal "talk" beat.
type AnimState = Gait | "talk";

/**
 * Player character — low-poly Business_Man GLB (~364 KB) with native
 * idle/walk/run clips plus `cycle_talking` for the café reveal. Movement is
 * camera-relative on foot — the chase cam is world-fixed (user orbits with
 * mouse drag), so we project camera-forward onto the XZ plane and build the
 * desired world velocity from input. Without this, W would always move toward
 * world −Z regardless of where the camera points.
 *
 * Locomotion is a three-state gait machine (see `pickGait`): standing → idle,
 * moving → walk, moving + Shift → the dedicated run clip at natural speed with
 * movement bumped by SPRINT_MULT.
 *
 * Café reveal (reinvented from the spy's sunglasses-off beat, since this model
 * has no eyewear): when `faceRevealed` flips, the agent turns to face the
 * camera, swaps idle → `cycle_talking`, and a warm key light fades up on him.
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
  const { scene, animations } = useModel("agent-businessman.glb");
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const modelRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const revealLightRef = useRef<THREE.PointLight>(null);
  const { actions } = useAnimations(animations, modelRef);

  const reveal = useRef(0);
  const animRef = useRef<AnimState>("idle");
  const mode = useWorld((s) => s.mode);

  // Start in idle once the actions are ready; walk/run take over on input.
  useEffect(() => {
    const idle = actions.idle;
    if (idle) idle.reset().fadeIn(ANIM_FADE).play();
    return () => {
      idle?.fadeOut(ANIM_FADE);
    };
  }, [actions]);

  useFrame((_, delta) => {
    // Café reveal — ease toward the store flag (0 → 1).
    const target = useWorld.getState().faceRevealed ? 1 : 0;
    reveal.current += (target - reveal.current) * (1 - Math.exp(-delta * 3));
    const revealed = reveal.current > 0.5;
    if (revealLightRef.current) revealLightRef.current.intensity = reveal.current * 8;

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
        if (visualRef.current) {
          visualRef.current.rotation.y = Math.atan2(DIR.x, DIR.z) + FACING_OFFSET;
        }
      } else {
        body.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
      }
    }

    // While revealed and standing still, turn to face the camera for the beat.
    if (revealed && !moving && visualRef.current) {
      const p = body.translation();
      const targetYaw = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
      const cur = visualRef.current.rotation.y;
      let d = targetYaw - cur;
      d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest path, wrapped to [−π, π]
      visualRef.current.rotation.y = cur + d * (1 - Math.exp(-delta * 4));
    }

    // Animation state: gait normally, but swap idle → talk during the reveal.
    const gait = pickGait(moving, keys.current.sprint);
    const next: AnimState = revealed && !moving ? "talk" : gait;
    const clipFor = (s: AnimState) =>
      s === "talk"
        ? (actions.cycle_talking ?? actions.idle)
        : s === "idle"
          ? actions.idle
          : s === "walk"
            ? actions.walk
            : (actions.run ?? actions.walk);

    if (next !== animRef.current) {
      const prev = clipFor(animRef.current);
      const nextClip = clipFor(next);
      animRef.current = next;
      if (prev !== nextClip) {
        prev?.fadeOut(ANIM_FADE);
        nextClip?.reset().fadeIn(ANIM_FADE).play();
      }
    }
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
        {/* Warm key light that fades up on the café reveal — front-lit face. */}
        <pointLight
          ref={revealLightRef}
          position={[0, 1, 0.7]}
          intensity={0}
          distance={4}
          color="#ffd9a0"
        />
      </group>
    </RigidBody>
  );
}
