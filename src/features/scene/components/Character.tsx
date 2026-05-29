"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useWorld } from "@/lib/world-store";
import { useKeyboard } from "../hooks/useKeyboard";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

const SPEED = 4.8;
const SPRINT_MULT = 1.8;
const SPAWN: [number, number, number] = [4, 1.2, -2];
const DIR = new THREE.Vector3();
const CAM_FWD = new THREE.Vector3();
const CAM_RIGHT = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);

// Capsule's local origin sits 0.85 above the ground, so drop the visual by
// that amount to line the model's feet up with the bottom of the collider.
const FEET_OFFSET = -0.85;
const CHARACTER_HEIGHT = 1.78;

// Programmatic walk feel. The new businessman GLB ships static (no baked
// animations), so a gentle bob + lateral lean while moving sells "walking"
// without needing a Mixamo retarget pass.
const BOB_SPEED = 9;
const BOB_HEIGHT = 0.05;
const LEAN_AMOUNT = 0.07;

/**
 * Suited agent — refined businessman GLB (`eric2.fbx` upstream, 969 KB
 * compressed). Replaces the 1940s Spy whose oversized hands and cartoon
 * proportions read as a Sherlock-Holmes caricature; this rig is a normal
 * man in a tailored suit. Static mesh (no skins), so `fitModelToHeight`
 * is safe here — the issue we hit with the earlier Adobe-Fuse rig came
 * from mutating a multi-skin scene's bind matrices, which doesn't apply.
 *
 * Movement is camera-relative — the chase cam is world-fixed on foot (the
 * user orbits it with mouse drag), so we project camera-forward onto the
 * XZ plane and build the desired world velocity from input. Without this,
 * pressing W would always move toward world -Z regardless of where the
 * camera was pointed.
 *
 * Sprint (Shift) bumps speed by 1.8× while moving. The face-reveal hook
 * (revealFace store flag) is retired — the new rig has no `Eyewearmesh`,
 * and the cinematic moment can land in a follow-up via procedural
 * sunglasses or a camera push-in.
 */
export function Character({ bodyRef }: { bodyRef: RefObject<RapierRigidBody | null> }) {
  const keys = useKeyboard();
  const camera = useThree((s) => s.camera);
  const { scene } = useModel("agent-businessman.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, CHARACTER_HEIGHT, 0);
    return c;
  }, [scene]);
  const visualRef = useRef<THREE.Group>(null);
  const bobRef = useRef<THREE.Group>(null);
  const bobPhase = useRef(0);
  const mode = useWorld((s) => s.mode);

  // The eric2 FBX ships its diffuse textures in a sibling `textures/` dir
  // that Blender's exporter doesn't locate during the gltf-transform run, so
  // the optimized GLB lands with bare-white materials. Re-paint by material
  // name to give the agent a believable charcoal suit and natural skin tone
  // — matches the "standard man in a suit" the user asked for without an
  // extra texture round-trip.
  useEffect(() => {
    const palette: Record<string, string> = {
      male_elegantsuit01: "#1A1C24", // charcoal suit
      "Material.001": "#1A1C24", // matched suit panel
      Ch31_hair: "#1B1410", // near-black hair
      eric: "#C99577", // warm skin tone
      "low-poly": "#C99577", // skin variant
      shoes03: "#0E0E10", // black shoes
      "Material.002": "#0E0E10",
    };
    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = false;
      const mat = obj.material as THREE.MeshStandardMaterial | undefined;
      if (!mat) return;
      const hex = palette[mat.name ?? ""];
      if (hex) {
        mat.color = new THREE.Color(hex);
        // Suit / shoes read better with a touch of roughness; skin keeps the
        // default softness so it doesn't look chalky.
        mat.roughness = mat.name === "eric" || mat.name === "low-poly" ? 0.7 : 0.55;
        mat.metalness = 0;
        mat.needsUpdate = true;
      }
    });
  }, [cloned]);

  useFrame((_, delta) => {
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

    // Programmatic walk feel — sprint runs the cycle faster.
    const bob = bobRef.current;
    if (bob) {
      if (moving) {
        const bobSpeed = keys.current.sprint ? BOB_SPEED * 1.6 : BOB_SPEED;
        bobPhase.current += delta * bobSpeed;
        const y = Math.abs(Math.sin(bobPhase.current)) * BOB_HEIGHT;
        const lean = Math.sin(bobPhase.current) * LEAN_AMOUNT;
        bob.position.y = FEET_OFFSET + y;
        bob.rotation.z = lean;
      } else {
        bob.position.y += (FEET_OFFSET - bob.position.y) * (1 - Math.exp(-delta * 8));
        bob.rotation.z += (0 - bob.rotation.z) * (1 - Math.exp(-delta * 8));
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
        <group ref={bobRef} position={[0, FEET_OFFSET, 0]}>
          <primitive object={cloned} />
        </group>
      </group>
    </RigidBody>
  );
}
