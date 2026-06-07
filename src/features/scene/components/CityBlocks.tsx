"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import type * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { LANDMARK_XZ, SHORE_X, terrainHeight } from "../lib/terrain";
import { useModel } from "../lib/useModel";
import { Palm } from "./Palm";

/**
 * City blocks — the population pass that turns "roads in a desert" into city
 * streets. Generalises the CasbahStreet pattern: it flanks the flat
 * downtown/seafront street spine with a repeating mix of buildings (Algerian
 * villa / casbah house / shop), each terrain-anchored with a footprint
 * collider, and threads palms along the kerb. Buildings face the street.
 *
 * Placements that fall on a landmark plaza (so monuments stay clear), in the
 * sea, or off the buildable shelf are skipped. Only the flat coastal city is
 * dressed here — the steep climbs to Maqam keep their open slope.
 */

type V2 = [number, number];

// Building palette: GLB, target height (m), collider half-extents (x,z).
const BUILDINGS: { model: string; height: number; half: [number, number] }[] = [
  { model: "algerian-villa.glb", height: 7.5, half: [3.2, 3.2] },
  { model: "casbah-house.glb", height: 6, half: [2.6, 2.6] },
  { model: "shop.glb", height: 4, half: [2.4, 2.4] },
  { model: "algerian-villa.glb", height: 8, half: [3.2, 3.2] },
];

// Flat downtown/seafront streets (new-world coords, y≈0). Buildings line these.
const STREETS: V2[][] = [
  // Seafront spine: Grande Poste → café/Sablette.
  [
    [46, 2],
    [52, 22],
    [60, 38],
  ],
  // Cross street running inland from the Grande Poste forecourt.
  [
    [46, 6],
    [30, 10],
    [18, 8],
  ],
];

const HALF_WIDTH = 7.5; // centreline → building face (clears road + sidewalk)
const SPACING = 9; // metres between buildings along a street
const LANDMARK_CLEAR = 13; // keep this far from any landmark anchor

const ANCHORS = Object.values(LANDMARK_XZ);

function nearLandmark(x: number, z: number): boolean {
  return ANCHORS.some(([lx, lz]) => (x - lx) ** 2 + (z - lz) ** 2 < LANDMARK_CLEAR ** 2);
}

function buildable(x: number): boolean {
  return x < SHORE_X - 2; // not in the sea
}

type Lot = {
  key: string;
  model: string;
  height: number;
  half: [number, number];
  x: number;
  z: number;
  rotationY: number;
};
type Tree = { key: string; x: number; z: number; seed: number };

/** Walk a polyline, emitting building lots on alternating sides + kerb palms. */
function layout(): { lots: Lot[]; trees: Tree[] } {
  const lots: Lot[] = [];
  const trees: Tree[] = [];
  let bi = 0;
  let pi = 0;
  for (let s = 0; s < STREETS.length; s++) {
    const pts = STREETS[s];
    for (let seg = 0; seg < pts.length - 1; seg++) {
      const [x0, z0] = pts[seg];
      const [x1, z1] = pts[seg + 1];
      const segLen = Math.hypot(x1 - x0, z1 - z0);
      const ux = (x1 - x0) / segLen;
      const uz = (z1 - z0) / segLen;
      const px = -uz; // perpendicular
      const pz = ux;
      const along = Math.atan2(ux, uz);
      const n = Math.max(1, Math.round(segLen / SPACING));
      for (let i = 0; i < n; i++) {
        const cx = x0 + ux * (i * SPACING);
        const cz = z0 + uz * (i * SPACING);
        for (const side of [1, -1]) {
          const x = cx + px * HALF_WIDTH * side;
          const z = cz + pz * HALF_WIDTH * side;
          if (!buildable(x) || nearLandmark(x, z)) continue;
          const b = BUILDINGS[bi % BUILDINGS.length];
          bi++;
          lots.push({
            key: `s${s}-${seg}-${i}-${side}`,
            model: b.model,
            height: b.height,
            half: b.half,
            x,
            z,
            // Face the street (front toward the centreline): perpendicular,
            // pointing inward (−side), plus a small jitter.
            rotationY: along - (side * Math.PI) / 2 + ((i % 3) - 1) * 0.12,
          });
        }
        // A palm on the sidewalk (just outside the 4 m road half-width, inside
        // the building line at 7.5), every other slot, alternating sides.
        if (i % 2 === 0) {
          const palmSide = i % 4 === 0 ? 1 : -1;
          const x = cx + px * 5.4 * palmSide;
          const z = cz + pz * 5.4 * palmSide;
          if (buildable(x) && !nearLandmark(x, z)) {
            trees.push({ key: `t${s}-${seg}-${i}`, x, z, seed: pi });
            pi++;
          }
        }
      }
    }
  }
  return { lots, trees };
}

/** One building clone — fitted, terrain-anchored, with a footprint collider. */
function Lot({ scene, lot }: { scene: THREE.Object3D; lot: Lot }) {
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, lot.height, 0);
    return c;
  }, [scene, lot.height]);
  return (
    <group position={[lot.x, terrainHeight(lot.x, lot.z), lot.z]} rotation={[0, lot.rotationY, 0]}>
      <primitive object={cloned} />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[lot.half[0], lot.height / 2, lot.half[1]]}
          position={[0, lot.height / 2, 0]}
        />
      </RigidBody>
    </group>
  );
}

export function CityBlocks() {
  const villa = useModel("algerian-villa.glb");
  const casbah = useModel("casbah-house.glb");
  const shop = useModel("shop.glb");
  const sceneFor = (model: string): THREE.Object3D =>
    model === "algerian-villa.glb" ? villa.scene : model === "shop.glb" ? shop.scene : casbah.scene;

  const { lots, trees } = useMemo(() => layout(), []);

  return (
    <group>
      {lots.map((lot) => (
        <Lot key={lot.key} scene={sceneFor(lot.model)} lot={lot} />
      ))}
      {trees.map((t) => (
        <Palm key={t.key} position={[t.x, terrainHeight(t.x, t.z), t.z]} seed={t.seed} />
      ))}
    </group>
  );
}
