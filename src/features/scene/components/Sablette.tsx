"use client";

import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { terrainHeight } from "../lib/terrain";
import { useModel } from "../lib/useModel";

/**
 * La Sablette — the populated seafront just east of downtown, on the flat
 * coastal shelf at the waterline (x≈60–70, facing the sea at +X). Real CC-BY
 * people from the asset library, every one normalized to the player's ~1.7 m
 * height via `fitModelToHeight`, so the realistic crowd reads at one consistent
 * scale alongside the low-poly player. Seated patrons, strollers, beach
 * umbrellas, and a parked scooter dress the promenade.
 *
 * All Y comes from `terrainHeight` so people/props sit on the slope, not in the
 * air. Realistic figures default to facing +Z; FACE_SEA turns them toward the
 * water. Decorative — no colliders on the dressing.
 */

const PLAYER_HEIGHT = 1.7;
const SEATED_HEIGHT = 1.25;
// Realistic GLBs from this pack face +Z; +X is the sea, so turn −90° to face it.
const FACE_SEA = -Math.PI / 2;

function place(x: number, z: number): [number, number, number] {
  return [x, terrainHeight(x, z), z];
}

/** A standing person, normalized to the player's height. */
function Person({
  model,
  x,
  z,
  rotationY = 0,
  height = PLAYER_HEIGHT,
}: {
  model: string;
  x: number;
  z: number;
  rotationY?: number;
  height?: number;
}) {
  const { scene } = useModel(model);
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, height);
    return c;
  }, [scene, height]);
  return (
    <group position={place(x, z)} rotation={[0, rotationY, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

/** A beach prop (umbrella / kit), normalized to a target height. */
function Prop({
  model,
  x,
  z,
  height,
  rotationY = 0,
}: {
  model: string;
  x: number;
  z: number;
  height: number;
  rotationY?: number;
}) {
  const { scene } = useModel(model);
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, height);
    return c;
  }, [scene, height]);
  return (
    <group position={place(x, z)} rotation={[0, rotationY, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

export function Sablette() {
  return (
    <group>
      {/* Seated patrons looking out to sea (on the low sea-wall / sand). */}
      <Person
        model="char-seated-gentleman.glb"
        x={66}
        z={36}
        rotationY={FACE_SEA}
        height={SEATED_HEIGHT}
      />
      <Person
        model="char-elder-reading.glb"
        x={66}
        z={44}
        rotationY={FACE_SEA}
        height={SEATED_HEIGHT}
      />

      {/* Strollers on the promenade, varied headings. */}
      <Person model="char-casual-walk.glb" x={60} z={30} rotationY={0.6} />
      <Person model="char-hijabi-woman.glb" x={58} z={48} rotationY={Math.PI} />
      <Person model="char-executive.glb" x={62} z={54} rotationY={-2.2} />

      {/* Beach umbrellas / props on the sand toward the water. */}
      <Prop model="beach-kit-lowpoly.glb" x={68} z={32} height={2.6} />
      <Prop model="beach-kit-lowpoly.glb" x={69} z={46} height={2.6} rotationY={0.8} />

      {/* A scooter parked at the kerb. */}
      <Prop model="vehicle-scooter.glb" x={57} z={40} height={1.1} rotationY={Math.PI / 2} />
    </group>
  );
}
