"use client";

import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

/**
 * A single Algerian-style market stall built from three KayKit Restaurant
 * pieces: an empty crate as the base, a produce crate stacked on top, and a
 * wooden chair beside it (the merchant's seat). Pure decoration — no
 * proximity, no colliders — so the player can drive between stalls and they
 * dress the world without becoming obstacles.
 *
 * `produce` picks which produce crate sits on top (tomatoes / potatoes).
 * Each piece is auto-fitted to a target height so the stalls all read at the
 * same scale regardless of the source FBX units.
 */
export function MarketStall({
  position,
  rotationY = 0,
  produce = "tomatoes",
}: {
  position: [number, number, number];
  rotationY?: number;
  produce?: "tomatoes" | "potatoes";
}) {
  const baseGlb = useModel("market-crate.glb");
  const topGlb = useModel(
    produce === "potatoes" ? "market-crate-potatoes.glb" : "market-crate-tomatoes.glb",
  );
  const chairGlb = useModel("market-chair.glb");

  const baseScene = useMemo(() => {
    const c = SkeletonUtils.clone(baseGlb.scene);
    fitModelToHeight(c, 0.75, 0);
    return c;
  }, [baseGlb.scene]);
  const topScene = useMemo(() => {
    const c = SkeletonUtils.clone(topGlb.scene);
    fitModelToHeight(c, 0.55, 0.75);
    return c;
  }, [topGlb.scene]);
  const chairScene = useMemo(() => {
    const c = SkeletonUtils.clone(chairGlb.scene);
    fitModelToHeight(c, 1.0, 0);
    return c;
  }, [chairGlb.scene]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <primitive object={baseScene} />
      <primitive object={topScene} />
      <group position={[1.0, 0, 0.3]} rotation={[0, -Math.PI / 4, 0]}>
        <primitive object={chairScene} />
      </group>
    </group>
  );
}
