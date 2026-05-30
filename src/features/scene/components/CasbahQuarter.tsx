"use client";

import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

/**
 * The Casbah, expanded — clones the single casbah-house GLB into a small
 * quarter around the panel anchor at world `[-22, 0, -12]`. Each clone has
 * an independent SkeletonUtils.clone of the GLB scene so they don't share
 * transforms, and a slightly varied rotation/scale to break the uniformity.
 *
 * The original Casbah component still owns the proximity trigger + the
 * central house (the one that opens the Projects panel). This adds the
 * surrounding density so the quarter doesn't read as a single building.
 *
 * Layout: a loose ring of 6 houses to the east + north + south of the
 * anchor — staying west of the road network so the player approaches the
 * cluster head-on from the road. Static, no colliders for now (the central
 * house's collider in `Casbah.tsx` is the only physical block).
 */

type HouseLayout = {
  position: [number, number, number];
  rotationY: number;
  height: number;
};

// Anchor matches Casbah.tsx POSITION.
const ANCHOR_X = -22;
const ANCHOR_Z = -12;

const LAYOUT: HouseLayout[] = [
  { position: [ANCHOR_X - 8, 0, ANCHOR_Z - 6], rotationY: 0.2, height: 7 },
  { position: [ANCHOR_X - 7, 0, ANCHOR_Z + 5], rotationY: -0.4, height: 8.5 },
  { position: [ANCHOR_X - 12, 0, ANCHOR_Z], rotationY: 1.1, height: 6 },
  { position: [ANCHOR_X - 4, 0, ANCHOR_Z + 9], rotationY: -1.2, height: 7.5 },
  { position: [ANCHOR_X - 14, 0, ANCHOR_Z + 4], rotationY: 0.7, height: 9 },
  { position: [ANCHOR_X - 10, 0, ANCHOR_Z - 9], rotationY: -0.6, height: 7 },
];

function CasbahHouseClone({ layout }: { layout: HouseLayout }) {
  const { scene } = useModel("casbah-house.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, layout.height);
    return c;
  }, [scene, layout.height]);

  return (
    <group position={layout.position} rotation={[0, layout.rotationY, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

export function CasbahQuarter() {
  return (
    <group>
      {LAYOUT.map((h) => (
        <CasbahHouseClone key={`${h.position[0]}:${h.position[2]}`} layout={h} />
      ))}
    </group>
  );
}
