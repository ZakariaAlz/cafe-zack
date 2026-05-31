"use client";

import { useMemo } from "react";
import type * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

/**
 * Dresses the Café Zack interior with KayKit Restaurant Bits pieces: the back
 * service counter (with menu board + espresso machine), and a few round bistro
 * tables each ringed by the reused market chair. Pure visual decoration — the
 * room shell (CafeRoom) owns collision; furniture is non-colliding so the agent
 * walks freely between tables.
 *
 * Each GLB is cloned per placement (SkeletonUtils.clone) so instances don't
 * share a mutated transform. KayKit pieces are authored ~1 unit; we fit by
 * height to sit them at human scale in the room.
 */

function Piece({
  file,
  height,
  position,
  rotation = 0,
}: {
  file: string;
  height: number;
  position: [number, number, number];
  rotation?: number;
}) {
  const { scene } = useModel(file);
  const obj = useMemo(() => {
    const c = SkeletonUtils.clone(scene) as THREE.Object3D;
    fitModelToHeight(c, height);
    return c;
  }, [scene, height]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <primitive object={obj} />
    </group>
  );
}

const TABLES: { pos: [number, number, number]; rot: number }[] = [
  { pos: [-2.4, 0, 0.4], rot: 0.2 },
  { pos: [2.4, 0, 0.6], rot: -0.3 },
  { pos: [-1.6, 0, 2.0], rot: 0.6 },
];

// A chair tucked on each side of a table (offsets in the table's local frame).
const CHAIR_OFFSETS: [number, number][] = [
  [0.7, 0],
  [-0.7, 0],
];

export function CafeFurniture() {
  return (
    <group>
      {/* back counter, centred on the −Z wall */}
      <Piece file="cafe-counter.glb" height={1.05} position={[0, 0, -2.4]} />
      <Piece file="cafe-espresso.glb" height={0.5} position={[-1.1, 1.05, -2.4]} />
      <Piece file="cafe-menu.glb" height={0.9} position={[1.4, 1.9, -2.78]} />

      {/* bistro tables + chairs */}
      {TABLES.map((t) => (
        <group key={`${t.pos[0]},${t.pos[2]}`} position={t.pos} rotation={[0, t.rot, 0]}>
          <Piece file="cafe-table.glb" height={0.95} position={[0, 0, 0]} />
          {CHAIR_OFFSETS.map(([cx, cz], i) => (
            <Piece
              key={`chair${cx},${cz}`}
              file="market-chair.glb"
              height={0.9}
              position={[cx, 0, cz]}
              rotation={i === 0 ? Math.PI / 2 : -Math.PI / 2}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
