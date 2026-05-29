"use client";

import { MarketStall } from "./MarketStall";

/**
 * Two market stalls dressed in front of the Casbah house — the first hint
 * that the Casbah quarter is more than a single building. Positioned so the
 * approach from the main road (east) reads as a small market before the door.
 * Pure decor; no proximity or colliders.
 *
 * Casbah anchor lives at world `[-22, 0, -12]`; we sit the stalls just east
 * of it on the plaza so they don't clip with the house mesh.
 */
const CASBAH = { x: -22, z: -12 } as const;

export function CasbahMarket() {
  return (
    <group>
      <MarketStall
        position={[CASBAH.x + 7, 0, CASBAH.z + 2]}
        rotationY={-Math.PI / 2}
        produce="tomatoes"
      />
      <MarketStall
        position={[CASBAH.x + 7, 0, CASBAH.z - 2]}
        rotationY={-Math.PI / 2}
        produce="potatoes"
      />
    </group>
  );
}
