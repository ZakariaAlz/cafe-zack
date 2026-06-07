"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import type * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { LANDMARK_XZ, terrainHeight } from "../lib/terrain";
import { useModel } from "../lib/useModel";

/**
 * Casbah street — a narrow whitewashed alley of stacked houses lining the route
 * from the Casbah landmark down to Notre-Dame d'Afrique. The real Casbah is a
 * dense, steep medina of tight winding lanes; here we evoke it with a double
 * row of the casbah-house GLB flanking a ~7 m walking corridor, stepping along
 * the Casbah→Notre-Dame segment so the player passes through it on the way to
 * the basilica.
 *
 * Houses are clustered tight (≈6 m tall, varied heading) for the massed medina
 * read; each carries a box collider so the alley centre stays walkable but the
 * walls are solid. Y comes from `terrainHeight` so the row climbs the slope.
 */

const HOUSE_HEIGHT = 10; // tall, massed white Casbah houses
const HALF_WIDTH = 5.5; // alley half-width (centre-to-house-face) — room for the path + sidewalks
const HOUSE_HALF = 2.8; // footprint collider half-extent
const COUNT = 8; // houses per side
const T_START = 0.22; // start past the Casbah landmark
const T_END = 0.86; // end before the basilica plaza

const [CX, CZ] = LANDMARK_XZ.casbah;
const [NX, NZ] = LANDMARK_XZ["notre-dame"];

/** One clone of the house GLB, fitted, with a footprint collider. */
function House({
  scene,
  x,
  z,
  rotationY,
}: {
  scene: THREE.Object3D;
  x: number;
  z: number;
  rotationY: number;
}) {
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, HOUSE_HEIGHT, 0);
    return c;
  }, [scene]);
  return (
    <group position={[x, terrainHeight(x, z), z]} rotation={[0, rotationY, 0]}>
      <primitive object={cloned} />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[HOUSE_HALF, HOUSE_HEIGHT / 2, HOUSE_HALF]}
          position={[0, HOUSE_HEIGHT / 2, 0]}
        />
      </RigidBody>
    </group>
  );
}

export function CasbahStreet() {
  const { scene } = useModel("casbah-house.glb");

  // Centreline direction Casbah → Notre-Dame, and its left-hand perpendicular
  // for the two house rows.
  const dx = NX - CX;
  const dz = NZ - CZ;
  const len = Math.hypot(dx, dz);
  const ux = dx / len;
  const uz = dz / len;
  const px = -uz; // perpendicular (unit)
  const pz = ux;

  const houses = useMemo(() => {
    const out: { x: number; z: number; rotationY: number; key: string }[] = [];
    for (let i = 0; i < COUNT; i++) {
      const t = T_START + (T_END - T_START) * (i / (COUNT - 1));
      const cx = CX + dx * t;
      const cz = CZ + dz * t;
      // Houses face the alley: heading along the street + a little jitter for
      // the organic, hand-stacked medina feel.
      const along = Math.atan2(ux, uz);
      const jitter = ((i % 3) - 1) * 0.18;
      // Left row faces +perp (into the alley), right row faces −perp.
      out.push({
        x: cx + px * HALF_WIDTH,
        z: cz + pz * HALF_WIDTH,
        rotationY: along + Math.PI / 2 + jitter,
        key: `L${i}`,
      });
      out.push({
        x: cx - px * HALF_WIDTH,
        z: cz - pz * HALF_WIDTH,
        rotationY: along - Math.PI / 2 + jitter,
        key: `R${i}`,
      });
    }
    return out;
  }, [dx, dz, ux, uz, px, pz]);

  return (
    <group>
      {houses.map((h) => (
        <House key={h.key} scene={scene} x={h.x} z={h.z} rotationY={h.rotationY} />
      ))}
    </group>
  );
}
