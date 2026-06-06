"use client";

import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { terrainHeight } from "../lib/terrain";
import { useModel } from "../lib/useModel";
import { FerrisWheel } from "./FerrisWheel";

/**
 * La Sablette — the populated seafront café terrace + promenade just east of
 * downtown, on the flat coastal shelf at the waterline (x≈60–70, facing the sea
 * at +X). Real CC-BY people from the asset library, every one normalized to the
 * player's ~1.7 m height via `fitModelToHeight`, so the realistic crowd reads at
 * one consistent scale alongside the low-poly player.
 *
 * The heavy café-building GLBs (12 MB+) don't ship, so the café is a light
 * terrace: KayKit tables + chairs with patrons seated together, beach props,
 * and a scooter. All Y comes from `terrainHeight`. Decorative — no colliders.
 */

const PLAYER_HEIGHT = 1.7;
// A seated figure's standing-equivalent height, so the seated pose lands in
// scale with the standing crowd.
const SEATED_HEIGHT = 1.55;
// Real-world heights for the promenade furniture, so everything sits in scale
// next to the ~1.7 m crowd (see the scooter/beach-kit sizing lessons).
const BENCH_HEIGHT = 0.85;
const TABLE_HEIGHT = 0.75;
const SCOOTER_HEIGHT = 1.1; // wheels-to-handlebars of the parked motor scooter
// Realistic GLBs from this pack face +Z.
const FACE_PZ = 0;
const FACE_NZ = Math.PI;
// The sea is at +X; a +Z-forward model rotated +90° about Y faces it.
const FACE_SEA = Math.PI / 2;

function place(x: number, z: number, y = 0): [number, number, number] {
  return [x, terrainHeight(x, z) + y, z];
}

/** Load + clone a GLB normalized to `height`, dropped at (x,z) on the terrain. */
function Fitted({
  model,
  x,
  z,
  height,
  rotationY = 0,
  yLift = 0,
}: {
  model: string;
  x: number;
  z: number;
  height: number;
  rotationY?: number;
  yLift?: number;
}) {
  const { scene } = useModel(model);
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, height);
    return c;
  }, [scene, height]);
  return (
    <group position={place(x, z, yLift)} rotation={[0, rotationY, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

/** A café table flanked by two chairs. */
function CafeTable({ x, z }: { x: number; z: number }) {
  return (
    <>
      <Fitted model="cafe-table.glb" x={x} z={z} height={0.74} />
      <Fitted model="market-chair.glb" x={x} z={z - 0.95} height={0.9} rotationY={FACE_PZ} />
      <Fitted model="market-chair.glb" x={x} z={z + 0.95} height={0.9} rotationY={FACE_NZ} />
    </>
  );
}

export function Sablette() {
  return (
    <group>
      {/* Café terrace — two patrons seated together at a table, facing each
          other across it. yLift seats their hips onto the chairs (eye-tuned). */}
      <CafeTable x={64} z={40} />
      <Fitted
        model="char-seated-gentleman.glb"
        x={64}
        z={38.8}
        height={SEATED_HEIGHT}
        rotationY={FACE_PZ}
        yLift={0.45}
      />
      <Fitted
        model="char-elder-reading.glb"
        x={64}
        z={41.2}
        height={SEATED_HEIGHT}
        rotationY={FACE_NZ}
        yLift={0.45}
      />
      {/* A second, empty table for ambience. */}
      <CafeTable x={64} z={47} />

      {/* Strollers on the promenade, varied headings. */}
      <Fitted model="char-casual-walk.glb" x={60} z={30} height={PLAYER_HEIGHT} rotationY={0.6} />
      <Fitted
        model="char-hijabi-woman.glb"
        x={58}
        z={50}
        height={PLAYER_HEIGHT}
        rotationY={FACE_NZ}
      />
      <Fitted model="char-executive.glb" x={61} z={55} height={PLAYER_HEIGHT} rotationY={-2.2} />

      {/* Kick-scooter with its rider — sized so the RIDER reads ~1.7 m (the
          whole model is ~1.9 m tall), not the scooter alone. */}
      <Fitted model="vehicle-scooter.glb" x={57} z={42} height={1.9} rotationY={Math.PI / 2} />

      {/* La Grande Roue — the luminous Ferris wheel on the seafront, near the
          waterline (shore is x≈70). Spins, glows warm at night. */}
      <FerrisWheel x={66} z={54} />

      {/* Promenade benches — a row facing out to sea (+X) along the paved
          seafront, the classic Sablette bench line. */}
      <Fitted model="park-bench.glb" x={62} z={32} height={BENCH_HEIGHT} rotationY={FACE_SEA} />
      <Fitted model="park-bench.glb" x={62} z={37} height={BENCH_HEIGHT} rotationY={FACE_SEA} />
      <Fitted model="park-bench.glb" x={62} z={46} height={BENCH_HEIGHT} rotationY={FACE_SEA} />
      <Fitted model="park-bench.glb" x={62} z={51} height={BENCH_HEIGHT} rotationY={FACE_SEA} />

      {/* Picnic tables clustered behind the bench line, toward the kiosks. */}
      <Fitted model="picnic-table.glb" x={56} z={35} height={TABLE_HEIGHT} rotationY={0.4} />
      <Fitted model="picnic-table.glb" x={55} z={49} height={TABLE_HEIGHT} rotationY={-0.6} />

      {/* Parked motor scooters — the common Algiers two-wheeler as street
          dressing along the promenade edge, kickstand-leaning. */}
      <Fitted
        model="vehicle-moto-scooter.glb"
        x={59}
        z={29}
        height={SCOOTER_HEIGHT}
        rotationY={-1.1}
      />
      <Fitted
        model="vehicle-moto-scooter.glb"
        x={58.4}
        z={56}
        height={SCOOTER_HEIGHT}
        rotationY={2.3}
      />
    </group>
  );
}
